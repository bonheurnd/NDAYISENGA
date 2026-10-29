from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import (
    Farmer, Plot, WaterSchedule, Tariff, Invoice, Payment,
    Equipment, WorkOrder, Complaint, SmsNotification, AuditLog
)
from .serializers import (
    FarmerSerializer, PlotSerializer, WaterScheduleSerializer,
    TariffSerializer, InvoiceSerializer, PaymentSerializer,
    EquipmentSerializer, WorkOrderSerializer, ComplaintSerializer,
    SmsNotificationSerializer, AuditLogSerializer
)
from .permissions import HasRolePermission


class HealthCheckView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({
            'status': 'healthy',
            'scheme': 'GFI Nasho 1',
            'district': 'Kirehe',
            'country': 'Rwanda',
            'version': '1.0.0',
            'timestamp': timezone.now().isoformat(),
        })


class FarmerViewSet(viewsets.ModelViewSet):
    queryset = Farmer.objects.all().order_by('-created_at')
    serializer_class = FarmerSerializer
    permission_classes = [HasRolePermission]


class PlotViewSet(viewsets.ModelViewSet):
    queryset = Plot.objects.all().order_by('block__block_code', 'plot_code')
    serializer_class = PlotSerializer
    permission_classes = [HasRolePermission]


class WaterScheduleViewSet(viewsets.ModelViewSet):
    queryset = WaterSchedule.objects.all().order_by('-planned_start_time')
    serializer_class = WaterScheduleSerializer
    permission_classes = [HasRolePermission]

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        schedule = self.get_object()
        schedule.status = 'APPROVED'
        schedule.approved_at = timezone.now()
        schedule.approved_by = request.user if request.user.is_authenticated else None
        schedule.save()
        return Response({'status': 'Schedule approved', 'schedule': WaterScheduleSerializer(schedule).data})


class TariffViewSet(viewsets.ModelViewSet):
    queryset = Tariff.objects.all().order_by('-effective_from')
    serializer_class = TariffSerializer
    permission_classes = [HasRolePermission]


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all().order_by('-issue_date')
    serializer_class = InvoiceSerializer
    permission_classes = [HasRolePermission]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().order_by('-recorded_at')
    serializer_class = PaymentSerializer
    permission_classes = [HasRolePermission]

    def create(self, request, *args, **kwargs):
        idempotency_key = request.data.get('idempotency_key')
        tx_ref = request.data.get('transaction_reference')
        if Payment.objects.filter(idempotency_key=idempotency_key).exists() or Payment.objects.filter(transaction_reference=tx_ref).exists():
            return Response({'error': 'Duplicate payment rejected.'}, status=status.HTTP_409_CONFLICT)
        return super().create(request, *args, **kwargs)


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all().order_by('asset_code')
    serializer_class = EquipmentSerializer
    permission_classes = [HasRolePermission]


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all().order_by('-reported_date')
    serializer_class = WorkOrderSerializer
    permission_classes = [HasRolePermission]


class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all().order_by('-submitted_at')
    serializer_class = ComplaintSerializer
    permission_classes = [HasRolePermission]


class SmsNotificationViewSet(viewsets.ModelViewSet):
    queryset = SmsNotification.objects.all().order_by('-sent_at')
    serializer_class = SmsNotificationSerializer
    permission_classes = [HasRolePermission]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [HasRolePermission]
