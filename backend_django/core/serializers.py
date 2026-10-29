import re
from decimal import Decimal
from rest_framework import serializers
from .models import (
    Scheme, Organization, Role, User, Farmer, Block, Plot, Season,
    WaterSchedule, Tariff, Invoice, InvoiceLine, Payment,
    Equipment, WorkOrder, Complaint, SmsNotification, AuditLog, OfflineSyncEvent
)
from .services import WaterSchedulingService, BillingService


class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = '__all__'


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'active_role', 'organization', 'organization_name', 'is_active']


class FarmerSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    assigned_plot_ids = serializers.SerializerMethodField()

    class Meta:
        model = Farmer
        fields = '__all__'

    def get_assigned_plot_ids(self, obj):
        return [str(p.id) for p in obj.plots.all()]

    def validate_phone(self, value):
        cleaned = re.sub(r'[\s\-]', '', value)
        if not re.match(r'^(\+?250|0)7[2389]\d{7}$', cleaned):
            raise serializers.ValidationError("Enter a valid Rwandan mobile number (+250 78/73/72/79...).")
        return cleaned

    def validate_national_id(self, value):
        if value:
            cleaned = re.sub(r'[\s\-]', '', value)
            if len(cleaned) != 16 or not cleaned.isdigit():
                raise serializers.ValidationError("Rwandan National ID (NID) must be exactly 16 numeric digits.")
            return cleaned
        return value


class PlotSerializer(serializers.ModelSerializer):
    current_farmer_name = serializers.CharField(source='current_farmer.full_name', read_only=True)
    block_name = serializers.CharField(source='block.name', read_only=True)

    class Meta:
        model = Plot
        fields = '__all__'

    def validate_area_hectares(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Plot area must be greater than zero hectares.")
        return value


class WaterScheduleSerializer(serializers.ModelSerializer):
    plot_code = serializers.CharField(source='plot.plot_code', read_only=True)
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    operator_name = serializers.CharField(source='operator.get_full_name', read_only=True)

    class Meta:
        model = WaterSchedule
        fields = '__all__'

    def validate(self, attrs):
        start = attrs.get('planned_start_time') or (self.instance.planned_start_time if self.instance else None)
        end = attrs.get('planned_end_time') or (self.instance.planned_end_time if self.instance else None)
        plot = attrs.get('plot') or (self.instance.plot if self.instance else None)

        if start and end and start >= end:
            raise serializers.ValidationError({"planned_end_time": "Planned end time must be chronologically after start time."})

        # Overlap conflict detection
        if plot and start and end:
            conflicts = WaterSchedulingService.check_schedule_conflicts(
                plot_id=plot.id,
                start_time=start,
                end_time=end,
                exclude_schedule_id=self.instance.id if self.instance else None
            )
            if conflicts.exists():
                c = conflicts.first()
                raise serializers.ValidationError({
                    "plot": f"Conflict detected: Plot {plot.plot_code} is already scheduled under {c.schedule_code} from {c.planned_start_time} to {c.planned_end_time}."
                })

        return attrs


class TariffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tariff
        fields = '__all__'


class InvoiceLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLine
        fields = ['id', 'description', 'quantity', 'unit', 'unit_price_rwf', 'total_rwf']


class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineSerializer(many=True, required=False)
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    farmer_code = serializers.CharField(source='farmer.farmer_code', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'

    def create(self, validated_data):
        lines_data = self.context.get('request').data.get('line_items', [])
        lines_validated = validated_data.pop('lines', [])

        invoice = Invoice.objects.create(**validated_data)

        subtotal = Decimal('0.00')
        raw_lines = lines_data or lines_validated
        for item in raw_lines:
            qty = Decimal(str(item.get('quantity', 1)))
            rate = Decimal(str(item.get('unit_price_rwf', item.get('totalRwf', 45000))))
            tot = (qty * rate).quantize(Decimal('1.00'))
            subtotal += tot
            InvoiceLine.objects.create(
                invoice=invoice,
                description=item.get('description', 'Seasonal Irrigation Levy'),
                quantity=qty,
                unit=item.get('unit', 'Ha'),
                unit_price_rwf=rate,
                total_rwf=tot
            )

        invoice.subtotal_rwf = subtotal
        invoice.total_rwf = subtotal
        invoice.balance_rwf = subtotal
        invoice.save()
        return invoice


class PaymentSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'

    def validate_amount_rwf(self, value):
        if value <= Decimal('0'):
            raise serializers.ValidationError("Payment amount must be greater than zero RWF.")
        return value


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'


class WorkOrderSerializer(serializers.ModelSerializer):
    equipment_code = serializers.CharField(source='equipment.asset_code', read_only=True)
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)

    class Meta:
        model = WorkOrder
        fields = '__all__'


class ComplaintSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.full_name', read_only=True)
    plot_code = serializers.CharField(source='plot.plot_code', read_only=True)
    ticket_number = serializers.CharField(required=False, default="")

    class Meta:
        model = Complaint
        fields = '__all__'

    def create(self, validated_data):
        if not validated_data.get('ticket_number'):
            count = Complaint.objects.count() + 1
            validated_data['ticket_number'] = f"TK-2026-{count:04d}"
        return super().create(validated_data)


class SmsNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmsNotification
        fields = '__all__'


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = '__all__'


class OfflineSyncEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineSyncEvent
        fields = '__all__'
