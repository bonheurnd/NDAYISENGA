from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HealthCheckView,
    FarmerViewSet, PlotViewSet, WaterScheduleViewSet,
    TariffViewSet, InvoiceViewSet, PaymentViewSet,
    EquipmentViewSet, WorkOrderViewSet, ComplaintViewSet,
    SmsNotificationViewSet, AuditLogViewSet
)

router = DefaultRouter()
router.register(r'farmers', FarmerViewSet)
router.register(r'plots', PlotViewSet)
router.register(r'schedules', WaterScheduleViewSet)
router.register(r'tariffs', TariffViewSet)
router.register(r'billing/invoices', InvoiceViewSet)
router.register(r'billing/payments', PaymentViewSet)
router.register(r'equipment', EquipmentViewSet)
router.register(r'work-orders', WorkOrderViewSet)
router.register(r'complaints', ComplaintViewSet)
router.register(r'sms-logs', SmsNotificationViewSet)
router.register(r'audit-logs', AuditLogViewSet)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='api-health'),
    path('', include(router.urls)),
]
