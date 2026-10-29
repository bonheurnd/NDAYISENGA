"""
Production Django Models for GFI Nasho 1 Irrigation Scheme
Database: PostgreSQL with UUID primary keys and NUMERIC/DECIMAL financial types.
Timezone: Africa/Kigali (display) stored consistently in UTC.
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class Scheme(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, default="GFI Nasho 1")
    district = models.CharField(max_length=100, default="Kirehe")
    province = models.CharField(max_length=100, default="Eastern Province")
    country = models.CharField(max_length=100, default="Rwanda")
    total_area_hectares = models.DecimalField(max_digits=10, decimal_places=2, default=1173.00)
    water_source = models.CharField(max_length=200, default="Lake Nasho / Lake Cyambwe")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.district})"


class Organization(models.Model):
    """Water User Associations (WUAs) or Agricultural Cooperatives"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="organizations")
    name = models.CharField(max_length=255) # e.g. "Koperative Twitezimbere Nasho"
    registration_number = models.CharField(max_length=100, unique=True)
    contact_phone = models.CharField(max_length=50)
    contact_email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Role(models.Model):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Administrator'),
        ('SCHEME_MANAGER', 'Scheme Manager'),
        ('WATER_OPERATOR', 'Water Operator'),
        ('FINANCE_OFFICER', 'Finance Officer'),
        ('MAINTENANCE_TECH', 'Maintenance Technician'),
        ('WUA_OFFICER', 'WUA / Cooperative Officer'),
        ('FARMER', 'Farmer (Member)'),
        ('AUDITOR', 'Independent Auditor'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=30, unique=True, default='+250780000000')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)
    active_role = models.CharField(max_length=50, default="FARMER")

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='nasho_user_groups',
        blank=True,
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='nasho_user_permissions',
        blank=True,
    )

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.phone})"


class Farmer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="farmers")
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="farmer_profile")
    farmer_code = models.CharField(max_length=50, unique=True) # e.g. NSH-FMR-0104
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, db_index=True)
    national_id = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    email = models.EmailField(blank=True, null=True)
    membership_status = models.CharField(max_length=30, default="ACTIVE")
    registration_date = models.DateField()
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.farmer_code} - {self.full_name}"


class Block(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="blocks")
    block_code = models.CharField(max_length=50) # e.g. "BLOCK-A"
    name = models.CharField(max_length=150)
    total_area_hectares = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('scheme', 'block_code')

    def __str__(self):
        return self.name


class Plot(models.Model):
    IRRIGATION_CHOICES = (
        ('CENTER_PIVOT', 'Center Pivot'),
        ('SPRINKLER', 'Solid-Set Sprinkler'),
        ('DRAGLINE_SPRINKLER', 'Dragline Sprinkler'),
        ('DRIP', 'Drip Irrigation'),
        ('HOSE', 'Hose Reel'),
    )
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('FALLOW', 'Fallow'),
        ('MAINTENANCE', 'Under Maintenance'),
        ('OFFLINE', 'Offline'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    block = models.ForeignKey(Block, on_delete=models.CASCADE, related_name="plots")
    plot_code = models.CharField(max_length=50) # e.g. "BLK-A-P01"
    area_hectares = models.DecimalField(max_digits=6, decimal_places=2)
    irrigation_type = models.CharField(max_length=50, choices=IRRIGATION_CHOICES, default='CENTER_PIVOT')
    current_crop = models.CharField(max_length=100, default="Maize")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ACTIVE')
    current_farmer = models.ForeignKey(Farmer, on_delete=models.SET_NULL, null=True, blank=True, related_name="plots")
    flow_rate_m3_per_hour = models.DecimalField(max_digits=8, decimal_places=2, default=120.00)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('block', 'plot_code')

    def __str__(self):
        return f"{self.plot_code} ({self.area_hectares} Ha)"


class Season(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50) # e.g. "2026A", "2026B"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class WaterSchedule(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('APPROVED', 'Approved'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('INTERRUPTED', 'Interrupted'),
        ('CANCELLED', 'Cancelled'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    schedule_code = models.CharField(max_length=50, unique=True)
    plot = models.ForeignKey(Plot, on_delete=models.CASCADE, related_name="schedules")
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="schedules")
    season = models.ForeignKey(Season, on_delete=models.SET_NULL, null=True, blank=True)
    planned_start_time = models.DateTimeField()
    planned_end_time = models.DateTimeField()
    planned_volume_m3 = models.DecimalField(max_digits=10, decimal_places=2)
    actual_start_time = models.DateTimeField(null=True, blank=True)
    actual_end_time = models.DateTimeField(null=True, blank=True)
    actual_volume_m3 = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='DRAFT')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_schedules")
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_schedules")
    approved_at = models.DateTimeField(null=True, blank=True)
    allocation_basis = models.CharField(max_length=50, default='TIME_HOURS')
    interruption_reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.schedule_code} - {self.plot.plot_code}"


class Tariff(models.Model):
    BASIS_CHOICES = (
        ('PER_HECTARE_SEASON', 'Per Hectare / Season'),
        ('PER_M3_WATER', 'Per m³ Metered Volume'),
        ('PER_HOUR_PUMPING', 'Per Pumping Hour'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="tariffs")
    name = models.CharField(max_length=200)
    basis = models.CharField(max_length=50, choices=BASIS_CHOICES)
    rate_rwf = models.DecimalField(max_digits=12, decimal_places=2)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} - {self.rate_rwf} RWF"


class Invoice(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('ISSUED', 'Issued'),
        ('PARTIALLY_PAID', 'Partially Paid'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
        ('CANCELLED', 'Cancelled'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    farmer = models.ForeignKey(Farmer, on_delete=models.PROTECT, related_name="invoices")
    season = models.ForeignKey(Season, on_delete=models.SET_NULL, null=True, blank=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    subtotal_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    tax_rwf = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    amount_paid_rwf = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='ISSUED')
    is_demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.invoice_number} ({self.total_rwf} RWF)"


class InvoiceLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="lines")
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=50)
    unit_price_rwf = models.DecimalField(max_digits=12, decimal_places=2)
    total_rwf = models.DecimalField(max_digits=12, decimal_places=2)


class Payment(models.Model):
    METHOD_CHOICES = (
        ('MTN_MOMO', 'MTN Mobile Money'),
        ('AIRTEL_MONEY', 'Airtel Money'),
        ('BK_BANK_TRANSFER', 'Bank of Kigali Transfer'),
        ('CASH', 'Cash at Cooperative Counter'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=50, unique=True)
    farmer = models.ForeignKey(Farmer, on_delete=models.PROTECT, related_name="payments")
    invoice = models.ForeignKey(Invoice, on_delete=models.PROTECT, related_name="payments")
    amount_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    payment_method = models.CharField(max_length=50, choices=METHOD_CHOICES)
    transaction_reference = models.CharField(max_length=150, unique=True)
    idempotency_key = models.CharField(max_length=150, unique=True)
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT)
    recorded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.receipt_number} - {self.amount_rwf} RWF"


class Equipment(models.Model):
    TYPE_CHOICES = (
        ('PUMP_STATION', 'Pump Station'),
        ('CENTER_PIVOT', 'Center Pivot'),
        ('VALVE', 'Hydraulic Valve'),
        ('HYDRANT', 'Hydrant Point'),
        ('FLOW_METER', 'Flow Meter'),
        ('FILTRATION_UNIT', 'Filtration Unit'),
        ('CONTROL_PANEL', 'Solar Control Panel'),
        ('MAIN_PIPELINE', 'Main Pipeline Sector'),
    )
    CONDITION_CHOICES = (
        ('EXCELLENT', 'Excellent'),
        ('GOOD', 'Good'),
        ('FAIR', 'Fair'),
        ('REQUIRES_REPAIR', 'Requires Repair'),
        ('CRITICAL', 'Critical Breakdown'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    scheme = models.ForeignKey(Scheme, on_delete=models.CASCADE, related_name="equipment")
    asset_code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    location = models.CharField(max_length=255)
    serial_number = models.CharField(max_length=100, blank=True)
    install_date = models.DateField()
    condition = models.CharField(max_length=50, choices=CONDITION_CHOICES, default='GOOD')
    status = models.CharField(max_length=50, default='OPERATIONAL')
    last_inspection_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)


class WorkOrder(models.Model):
    STATUS_CHOICES = (
        ('OPEN', 'Open'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('WAITING_FOR_PARTS', 'Waiting for Parts'),
        ('COMPLETED', 'Completed'),
        ('VERIFIED', 'Verified'),
        ('CANCELLED', 'Cancelled'),
    )
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('EMERGENCY', 'Emergency'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    work_order_number = models.CharField(max_length=50, unique=True)
    equipment = models.ForeignKey(Equipment, on_delete=models.PROTECT, related_name="work_orders")
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=30, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='OPEN')
    assigned_technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    reported_date = models.DateField(auto_now_add=True)
    completed_date = models.DateField(null=True, blank=True)
    estimated_cost_rwf = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_cost_rwf = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    downtime_hours = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)


class Complaint(models.Model):
    CATEGORY_CHOICES = (
        ('WATER_SHORTAGE', 'Water Shortage / Low Pressure'),
        ('EQUIPMENT_LEAK', 'Equipment Leak / Damage'),
        ('BILLING_DISPUTE', 'Billing Dispute'),
        ('SCHEDULE_CONFLICT', 'Schedule Overlap / Conflict'),
        ('OTHER', 'Other Operational Issue'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('INVESTIGATING', 'Investigating'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket_number = models.CharField(max_length=50, unique=True)
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name="complaints")
    plot = models.ForeignKey(Plot, on_delete=models.SET_NULL, null=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    is_demo = models.BooleanField(default=True)


class SmsNotification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient_phone = models.CharField(max_length=50)
    recipient_name = models.CharField(max_length=200)
    farmer = models.ForeignKey(Farmer, on_delete=models.SET_NULL, null=True, blank=True)
    type = models.CharField(max_length=50)
    language = models.CharField(max_length=10, default='rw')
    message = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, default='DELIVERED')
    provider = models.CharField(max_length=50, default='MOCK_GW')
    is_demo = models.BooleanField(default=True)


class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_role = models.CharField(max_length=50)
    action = models.CharField(max_length=100)
    details = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)


class OfflineSyncEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    queued_at = models.DateTimeField()
    processed_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=30, default='SYNCED')
    error_message = models.TextField(blank=True)
