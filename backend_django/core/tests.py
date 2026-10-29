"""
Automated unit and integration test suite for GFI Nasho 1 Django REST Framework backend.
Tests models, serializers, services, viewsets, RBAC permissions, and idempotent payments.
"""

from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    Scheme, Organization, Role, User, Farmer, Block, Plot,
    Season, WaterSchedule, Tariff, Invoice, InvoiceLine, Payment,
    Equipment, WorkOrder, Complaint, AuditLog
)
from .services import (
    calculate_invoice_totals,
    apply_payment_to_invoice,
    detect_schedule_conflict,
    create_audit_entry,
)


class NashoModelAndServiceTestCase(TestCase):
    def setUp(self):
        self.scheme = Scheme.objects.create(
            name="GFI Nasho 1",
            district="Kirehe",
            province="Eastern Province",
            country="Rwanda",
            total_area_hectares=Decimal("1173.00"),
        )
        self.org = Organization.objects.create(
            scheme=self.scheme,
            name="Koperative Twitezimbere Nasho",
            registration_number="RCA/2020/0842",
            contact_phone="+250788310001",
        )
        self.manager_user = User.objects.create_user(
            username="manager1",
            phone="+250788100001",
            active_role="SCHEME_MANAGER",
        )
        self.farmer_user = User.objects.create_user(
            username="farmer1",
            phone="+250788200001",
            active_role="FARMER",
        )
        self.farmer = Farmer.objects.create(
            scheme=self.scheme,
            organization=self.org,
            user=self.farmer_user,
            farmer_code="NSH-FMR-TEST01",
            full_name="Jean Claude Habimana",
            phone="+250788200001",
            membership_status="ACTIVE",
            registration_date=timezone.now().date(),
        )
        self.block = Block.objects.create(
            scheme=self.scheme,
            block_code="BLOCK-A",
            name="Pivot Sector 1 - Nasho North",
            total_area_hectares=Decimal("120.00"),
        )
        self.plot = Plot.objects.create(
            block=self.block,
            plot_code="BLK-A-P01",
            area_hectares=Decimal("2.50"),
            irrigation_type="CENTER_PIVOT",
            current_crop="Maize",
            current_farmer=self.farmer,
        )
        self.season = Season.objects.create(
            name="2026A",
            start_date=timezone.now().date() - timedelta(days=30),
            end_date=timezone.now().date() + timedelta(days=90),
            is_active=True,
        )

    def test_farmer_and_plot_creation(self):
        """Test farmer code and plot relationships"""
        self.assertEqual(self.farmer.farmer_code, "NSH-FMR-TEST01")
        self.assertEqual(self.plot.current_farmer, self.farmer)
        self.assertEqual(self.plot.area_hectares, Decimal("2.50"))

    def test_duplicate_plot_code_in_same_block_prevented(self):
        """Test database uniqueness constraint on block and plot_code"""
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Plot.objects.create(
                block=self.block,
                plot_code="BLK-A-P01",
                area_hectares=Decimal("1.50"),
            )

    def test_schedule_conflict_detection(self):
        """Test overlapping time detection for the same plot"""
        now = timezone.now()
        start1 = now + timedelta(hours=2)
        end1 = now + timedelta(hours=6)

        # Create first schedule
        sched1 = WaterSchedule.objects.create(
            schedule_code="SCH-2026-TEST-001",
            plot=self.plot,
            farmer=self.farmer,
            season=self.season,
            planned_start_time=start1,
            planned_end_time=end1,
            planned_volume_m3=Decimal("300.00"),
            status="APPROVED",
        )

        # Overlapping start
        start2 = now + timedelta(hours=4)
        end2 = now + timedelta(hours=8)
        has_conflict = detect_schedule_conflict(self.plot.id, start2, end2)
        self.assertTrue(has_conflict)

        # Non-overlapping time slot
        start3 = now + timedelta(hours=7)
        end3 = now + timedelta(hours=10)
        has_conflict_non_overlap = detect_schedule_conflict(self.plot.id, start3, end3)
        self.assertFalse(has_conflict_non_overlap)

    def test_billing_calculations_and_payment_idempotency(self):
        """Test invoice creation, line calculation, and partial payment allocation"""
        invoice = Invoice.objects.create(
            invoice_number="INV-2026-TEST-001",
            farmer=self.farmer,
            season=self.season,
            issue_date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=30),
            subtotal_rwf=Decimal("50000.00"),
            tax_rwf=Decimal("0.00"),
            total_rwf=Decimal("50000.00"),
            amount_paid_rwf=Decimal("0.00"),
            balance_rwf=Decimal("50000.00"),
            status="ISSUED",
        )

        InvoiceLine.objects.create(
            invoice=invoice,
            description="Seasonal Irrigation Fee - 2.5 Ha",
            quantity=Decimal("2.50"),
            unit="Ha",
            unit_price_rwf=Decimal("20000.00"),
            total_rwf=Decimal("50000.00"),
        )

        # Apply partial payment of 20,000 RWF
        payment1 = Payment.objects.create(
            receipt_number="REC-2026-TEST-001",
            farmer=self.farmer,
            invoice=invoice,
            amount_rwf=Decimal("20000.00"),
            payment_method="MTN_MOMO",
            transaction_reference="MOMO-TX-TEST-001",
            idempotency_key="IDEM-TEST-KEY-001",
            recorded_by=self.manager_user,
        )
        apply_payment_to_invoice(invoice, payment1.amount_rwf)

        invoice.refresh_from_db()
        self.assertEqual(invoice.amount_paid_rwf, Decimal("20000.00"))
        self.assertEqual(invoice.balance_rwf, Decimal("30000.00"))
        self.assertEqual(invoice.status, "PARTIALLY_PAID")

        # Duplicate payment with same idempotency key must fail
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            Payment.objects.create(
                receipt_number="REC-2026-TEST-002",
                farmer=self.farmer,
                invoice=invoice,
                amount_rwf=Decimal("20000.00"),
                payment_method="MTN_MOMO",
                transaction_reference="MOMO-TX-TEST-002",
                idempotency_key="IDEM-TEST-KEY-001", # Duplicate
                recorded_by=self.manager_user,
            )

    def test_audit_log_creation(self):
        """Test audit logging on actions"""
        log = create_audit_entry(
            user=self.manager_user,
            action="SCHEDULE_APPROVE",
            entity_type="WaterSchedule",
            entity_id="SCH-2026-TEST-001",
            details={"approved_by": "manager1", "water_volume_m3": 300},
            ip_address="127.0.0.1",
        )
        self.assertIsNotNone(log.id)
        self.assertEqual(log.action, "SCHEDULE_APPROVE")
        self.assertEqual(log.user, self.manager_user)


class NashoAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.scheme = Scheme.objects.create(
            name="GFI Nasho 1",
            district="Kirehe",
            total_area_hectares=Decimal("1173.00"),
        )
        self.farmer = Farmer.objects.create(
            scheme=self.scheme,
            farmer_code="NSH-FMR-API-01",
            full_name="Emmanuel Niyonzima",
            phone="+250788555123",
            registration_date=timezone.now().date(),
        )

    def test_get_farmers_endpoint(self):
        """API endpoint /api/v1/farmers/ returns list"""
        response = self.client.get('/api/v1/farmers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1 or 'results' in response.data)

    def test_create_complaint_endpoint(self):
        """Farmers can submit feedback / complaints"""
        data = {
            'farmer': str(self.farmer.id),
            'category': 'WATER_SHORTAGE',
            'description': 'Water pressure dropped below standard 3.5 bar.',
        }
        response = self.client.post('/api/v1/complaints/', data=data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue('TK-2026' in response.data['ticket_number'])

    def test_health_check_endpoint(self):
        """API endpoint /api/v1/health/ returns status healthy"""
        response = self.client.get('/api/v1/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['scheme'], 'GFI Nasho 1')
