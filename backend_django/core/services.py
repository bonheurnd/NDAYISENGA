"""
Business logic services for GFI Nasho 1 Irrigation Management System.
Decoupled pure services handling scheduling, billing, SMS notifications, and audit logging.
"""

from decimal import Decimal
from django.utils import timezone
from rest_framework.exceptions import ValidationError, PermissionDenied
from .models import (
    WaterSchedule, Plot, Invoice, Payment, SmsNotification,
    AuditLog, Tariff, Farmer
)


class WaterSchedulingService:
    @staticmethod
    def check_schedule_conflicts(plot_id, start_time, end_time, exclude_schedule_id=None):
        """
        Detects overlapping schedules on the same plot.
        Interval overlap: start_A < end_B AND start_B < end_A.
        """
        active_statuses = ['SUBMITTED', 'APPROVED', 'IN_PROGRESS']
        queryset = WaterSchedule.objects.filter(
            plot_id=plot_id,
            status__in=active_statuses,
            planned_start_time__lt=end_time,
            planned_end_time__gt=start_time,
        )
        if exclude_schedule_id:
            queryset = queryset.exclude(id=exclude_schedule_id)
        return queryset

    @staticmethod
    def validate_pump_capacity(start_time, end_time, new_demand_m3_h=Decimal('140.00'), max_capacity_m3_h=Decimal('2400.00')):
        """
        Ensures total simultaneous water demand across active schedules does not exceed
        Lake Nasho main pumping station volumetric flow capacity (2,400 m³/h).
        """
        overlapping = WaterSchedule.objects.filter(
            status__in=['APPROVED', 'IN_PROGRESS'],
            planned_start_time__lt=end_time,
            planned_end_time__gt=start_time,
        )
        total_current_flow = sum(
            (s.plot.flow_rate_m3_per_hour for s in overlapping),
            Decimal('0.00')
        )
        if total_current_flow + new_demand_m3_h > max_capacity_m3_h:
            raise ValidationError(
                f"Pump station capacity exceeded: Current demand {total_current_flow} m³/h + requested {new_demand_m3_h} m³/h "
                f"exceeds maximum threshold {max_capacity_m3_h} m³/h."
            )
        return True

    @staticmethod
    def approve_schedule(schedule_id, approving_user):
        schedule = WaterSchedule.objects.get(id=schedule_id)
        if schedule.status != 'SUBMITTED':
            raise ValidationError(f"Cannot approve schedule in '{schedule.status}' status. Must be SUBMITTED.")

        schedule.status = 'APPROVED'
        schedule.approved_by = approving_user
        schedule.approved_at = timezone.now()
        schedule.save()

        # Audit log
        AuditLogService.log_action(
            user=approving_user,
            role=getattr(approving_user, 'active_role', 'SCHEME_MANAGER'),
            action='APPROVE_SCHEDULE',
            details=f"Approved schedule {schedule.schedule_code} for Plot {schedule.plot.plot_code}"
        )

        # Trigger SMS Notification to Farmer
        SmsNotificationService.send_schedule_alert(schedule)
        return schedule


class BillingService:
    @staticmethod
    def calculate_line_item(quantity, unit_price):
        qty = Decimal(str(quantity))
        rate = Decimal(str(unit_price))
        return (qty * rate).quantize(Decimal('1.00'))

    @staticmethod
    def process_payment(invoice_id, amount_rwf, payment_method, transaction_reference, idempotency_key, recorded_by, notes=""):
        """
        Applies verified payment to invoice with strict idempotency and duplicate checking.
        """
        amount = Decimal(str(amount_rwf))
        if amount <= Decimal('0'):
            raise ValidationError("Payment amount must be greater than zero.")

        # Check duplicate idempotency key
        if Payment.objects.filter(idempotency_key=idempotency_key).exists():
            raise ValidationError(f"Duplicate transaction rejected: Idempotency key '{idempotency_key}' already processed.")

        # Check duplicate transaction reference
        cleaned_ref = transaction_reference.strip().upper()
        if Payment.objects.filter(transaction_reference=cleaned_ref).exists():
            raise ValidationError(f"Duplicate transaction rejected: Reference '{cleaned_ref}' already recorded.")

        try:
            invoice = Invoice.objects.select_for_update().get(id=invoice_id)
        except Invoice.DoesNotExist:
            raise ValidationError(f"Invoice '{invoice_id}' not found.")

        # Calculate new totals
        new_paid = (invoice.amount_paid_rwf + amount).quantize(Decimal('1.00'))
        new_balance = max(Decimal('0'), (invoice.total_rwf - new_paid).quantize(Decimal('1.00')))

        invoice.amount_paid_rwf = new_paid
        invoice.balance_rwf = new_balance
        invoice.status = 'PAID' if new_balance <= Decimal('0') else 'PARTIALLY_PAID'
        invoice.save()

        # Create Payment record
        receipt_num = f"REC-2026-{Payment.objects.count() + 101:04d}"
        payment = Payment.objects.create(
            receipt_number=receipt_num,
            farmer=invoice.farmer,
            invoice=invoice,
            amount_rwf=amount,
            payment_method=payment_method,
            transaction_reference=cleaned_ref,
            idempotency_key=idempotency_key,
            recorded_by=recorded_by,
            is_verified=True,
            notes=notes,
            is_demo=True,
        )

        # Audit log
        AuditLogService.log_action(
            user=recorded_by,
            role=getattr(recorded_by, 'active_role', 'FINANCE_OFFICER'),
            action='RECORD_PAYMENT',
            details=f"Issued verified receipt {receipt_num} for {amount} RWF against invoice {invoice.invoice_number}"
        )

        # Trigger SMS receipt
        SmsNotificationService.send_payment_receipt(payment)
        return payment, invoice


class SmsNotificationService:
    @staticmethod
    def send_schedule_alert(schedule):
        farmer = schedule.farmer
        start_fmt = schedule.planned_start_time.strftime("%d/%m %H:%M")
        end_fmt = schedule.planned_end_time.strftime("%H:%M")
        msg = f"GFI Nasho 1: Gahunda yo kuhira umurima wawe {schedule.plot.plot_code} yemerewe. Kuva: {start_fmt} kugeza {end_fmt}."
        
        return SmsNotification.objects.create(
            recipient_phone=farmer.phone,
            recipient_name=farmer.full_name,
            farmer=farmer,
            type='SCHEDULE_ALERT',
            language='rw',
            message=msg,
            status='DELIVERED',
            provider='MOCK_GW',
            is_demo=True,
        )

    @staticmethod
    def send_payment_receipt(payment):
        farmer = payment.farmer
        amt_fmt = f"{payment.amount_rwf:,.0f}"
        bal_fmt = f"{payment.invoice.balance_rwf:,.0f}"
        msg = f"GFI Nasho 1: Twakiriye ubwishyu bwa {amt_fmt} RWF ({payment.receipt_number}). Inyemezabwishyu: {payment.invoice.invoice_number}. Asigaye: {bal_fmt} RWF. Murakoze!"

        return SmsNotification.objects.create(
            recipient_phone=farmer.phone,
            recipient_name=farmer.full_name,
            farmer=farmer,
            type='PAYMENT_RECEIPT',
            language='rw',
            message=msg,
            status='DELIVERED',
            provider='MOCK_GW',
            is_demo=True,
        )


class AuditLogService:
    @staticmethod
    def log_action(user, role, action, details, ip_address=None):
        return AuditLog.objects.create(
            user=user if getattr(user, 'is_authenticated', False) else None,
            user_role=str(role),
            action=str(action),
            details=str(details),
            ip_address=ip_address,
        )


def detect_schedule_conflict(plot_id, start_time, end_time, exclude_schedule_id=None):
    conflicts = WaterSchedulingService.check_schedule_conflicts(plot_id, start_time, end_time, exclude_schedule_id)
    return conflicts.exists()


def calculate_invoice_totals(lines):
    subtotal = sum((line.total_rwf for line in lines), Decimal('0.00'))
    return subtotal, subtotal


def apply_payment_to_invoice(invoice, amount_rwf):
    new_paid = (invoice.amount_paid_rwf + Decimal(str(amount_rwf))).quantize(Decimal('1.00'))
    new_balance = max(Decimal('0'), (invoice.total_rwf - new_paid).quantize(Decimal('1.00')))
    invoice.amount_paid_rwf = new_paid
    invoice.balance_rwf = new_balance
    invoice.status = 'PAID' if new_balance <= Decimal('0') else 'PARTIALLY_PAID'
    invoice.save()
    return invoice


def create_audit_entry(user, action, entity_type=None, entity_id=None, details=None, ip_address=None):
    role = getattr(user, 'active_role', 'SYSTEM') if user else 'ANONYMOUS'
    detail_str = f"[{entity_type} #{entity_id}] {details}" if entity_type else str(details)
    return AuditLogService.log_action(user=user, role=role, action=action, details=detail_str, ip_address=ip_address)
