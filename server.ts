import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_USERS,
  INITIAL_FARMERS,
  INITIAL_PLOTS,
  INITIAL_SCHEDULES,
  INITIAL_TARIFFS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_EQUIPMENT,
  INITIAL_WORK_ORDERS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CHECKINS,
  INITIAL_TEMPLATES,
  INITIAL_QUICK_LOGS,
} from './src/lib/storage/mockData.ts';
import {
  addMoney,
  applyPaymentToInvoice,
  isDuplicatePaymentTransaction,
} from './src/lib/logic/billing.ts';
import {
  findScheduleConflicts,
  isValidScheduleStateTransition,
} from './src/lib/logic/scheduling.ts';
import {
  processFarmerCheckinVerification,
  generateBlockQrPayload,
} from './src/lib/logic/checkin.ts';
import {
  getKigaliTodayDate,
  validateQuickLogInput,
  isDuplicateQuickLog,
} from './src/lib/logic/quicklog.ts';
import { hasPermission } from './src/lib/logic/permissions.ts';
import { validateOfflineEvent } from './src/lib/logic/sync.ts';
import type { UserRole, Farmer, Plot, WaterSchedule, Invoice, Payment, WorkOrder, Complaint, SmsNotification, FarmerCheckin, QrPosterTemplate, IrrigationQuickLog } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory persistent state across requests during server runtime
  let currentUser = INITIAL_USERS[0]; // Default Super Admin
  let farmers: Farmer[] = [...INITIAL_FARMERS];
  let plots: Plot[] = [...INITIAL_PLOTS];
  let schedules: WaterSchedule[] = [...INITIAL_SCHEDULES];
  const tariffs = [...INITIAL_TARIFFS];
  let invoices: Invoice[] = [...INITIAL_INVOICES];
  let payments: Payment[] = [...INITIAL_PAYMENTS];
  const equipment = [...INITIAL_EQUIPMENT];
  let workOrders: WorkOrder[] = [...INITIAL_WORK_ORDERS];
  let complaints: Complaint[] = [...INITIAL_COMPLAINTS];
  let notifications: SmsNotification[] = [...INITIAL_NOTIFICATIONS];
  let checkins: FarmerCheckin[] = [...INITIAL_CHECKINS];
  let qrTemplates: QrPosterTemplate[] = [...INITIAL_TEMPLATES];
  let quickLogs: IrrigationQuickLog[] = [...INITIAL_QUICK_LOGS];
  const processedIdempotencyKeys = new Set<string>(['IDEM-MOMO-2026-001', 'IDEM-AIRTEL-2026-002']);
  const processedTxRefs = new Set<string>(['MOMO-RW-20260920-8841', 'AIRTEL-RW-20260922-4410']);
  const auditLogs: Array<{ id: string; timestamp: string; actor: string; role: string; action: string; details: string }> = [
    {
      id: 'aud-001',
      timestamp: '2026-09-10T08:00:00Z',
      actor: 'Marie Rose Mukamurenzi',
      role: 'FINANCE_OFFICER',
      action: 'GENERATE_SEASON_INVOICES',
      details: 'Generated 2026A baseline invoices for 3 active members.',
    },
    {
      id: 'aud-002',
      timestamp: '2026-10-15T14:00:00Z',
      actor: 'Diane Kayitesi',
      role: 'SCHEME_MANAGER',
      action: 'APPROVE_SCHEDULE',
      details: 'Approved irrigation schedule SCH-2026-0401 for Plot BLK-A-P01.',
    },
  ];

  // Helper middleware for RBAC verification
  function requirePermission(action: any) {
    return (req: Request, res: Response, next: () => void) => {
      const role = currentUser.role;
      if (!hasPermission(role, action)) {
        return res.status(403).json({
          error: `Permission denied. Your current active role [${role}] does not have authority to perform [${action}].`,
        });
      }
      next();
    };
  }

  // Helper to log audit trail
  function recordAudit(action: string, details: string) {
    auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      role: currentUser.role,
      action,
      details,
    });
  }

  // --- API Routes (/api/v1) ---

  // Health check
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'UP',
      scheme: 'GFI Nasho 1',
      district: 'Kirehe District, Rwanda',
      timezone: 'Africa/Kigali',
      version: '1.0.0',
      database: 'PostgreSQL/DRF Specification Scaffolded (Runtime In-Memory State)',
      isDemoMode: true,
    });
  });

  // Auth: Current User & Switch Role
  app.get('/api/v1/auth/me', (_req, res) => {
    res.json({
      user: currentUser,
      availableUsers: INITIAL_USERS,
    });
  });

  app.post('/api/v1/auth/switch-role', (req, res) => {
    const { userId, role } = req.body;
    let target = INITIAL_USERS.find((u) => u.id === userId);
    if (!target && role) {
      target = INITIAL_USERS.find((u) => u.role === role);
    }
    if (target) {
      currentUser = target;
      recordAudit('ROLE_SWITCH', `Switched active user context to ${target.name} (${target.role})`);
      return res.json({ success: true, user: currentUser });
    }
    res.status(400).json({ error: 'User or role not found.' });
  });

  // Dashboard Metrics
  app.get('/api/v1/metrics', (_req, res) => {
    const activeFarmers = farmers.filter((f) => f.membershipStatus === 'ACTIVE').length;
    const registeredPlots = plots.length;
    const cultivatedHectares = plots
      .filter((p) => p.status === 'ACTIVE')
      .reduce((sum, p) => sum + p.areaHectares, 0);
    const upcomingSchedules = schedules.filter((s) => s.status === 'APPROVED' || s.status === 'SUBMITTED').length;
    const reportedInterruptions = complaints.filter((c) => c.category === 'WATER_SHORTAGE' && c.status !== 'RESOLVED').length;
    const outstandingInvoicesRwf = invoices.reduce((sum, i) => sum + i.balanceRwf, 0);
    const recordedPaymentsRwf = payments.reduce((sum, p) => sum + p.amountRwf, 0);
    const openMaintenanceJobs = workOrders.filter((w) => w.status !== 'COMPLETED' && w.status !== 'CANCELLED').length;

    res.json({
      activeFarmers,
      registeredPlots,
      cultivatedHectares: Math.round(cultivatedHectares * 10) / 10,
      upcomingSchedules,
      reportedInterruptions,
      outstandingInvoicesRwf,
      recordedPaymentsRwf,
      openMaintenanceJobs,
      isDemoData: true,
    });
  });

  // Farmers
  app.get('/api/v1/farmers', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const self = farmers.filter((f) => f.id === currentUser.farmerId);
      return res.json(self);
    }
    res.json(farmers);
  });

  app.post('/api/v1/farmers', requirePermission('CREATE_FARMER'), (req, res) => {
    const {
      fullName,
      phone,
      nationalId,
      email,
      village,
      cell,
      sector,
      district,
      cooperativeName,
      membershipStatus,
      totalHectares,
      assignedPlotIds,
      notes,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Farmer full name is required.' });
    }
    if (!phone || !phone.trim() || phone.trim().length < 10) {
      return res.status(400).json({ error: 'Valid phone number is required (e.g. +250788123456).' });
    }

    // Duplicate checks
    const cleanedPhone = phone.trim();
    if (farmers.some((f) => f.phone === cleanedPhone)) {
      return res.status(409).json({ error: `Phone number ${cleanedPhone} is already registered to an existing farmer.` });
    }
    if (nationalId && nationalId.trim() && farmers.some((f) => f.nationalId === nationalId.trim())) {
      return res.status(409).json({ error: `National ID ${nationalId.trim()} is already registered.` });
    }

    const plotIds: string[] = Array.isArray(assignedPlotIds) ? assignedPlotIds : [];

    const newFarmer: Farmer = {
      id: `fmr-${Date.now()}`,
      farmerCode: `NSH-FMR-${String(farmers.length + 101).padStart(4, '0')}`,
      fullName: fullName.trim(),
      phone: cleanedPhone,
      nationalId: nationalId?.trim() || undefined,
      email: email?.trim() || undefined,
      village: village?.trim() || undefined,
      cell: cell?.trim() || undefined,
      sector: sector?.trim() || undefined,
      district: district?.trim() || 'Kirehe',
      cooperativeName: cooperativeName || "Umuryango w'Abakoresha Amazi Nasho (WUO)",
      membershipStatus: membershipStatus || 'ACTIVE',
      registrationDate: new Date().toISOString().split('T')[0],
      totalHectares: Number(totalHectares) || 1.0,
      assignedPlotIds: plotIds,
      notes: notes?.trim() || undefined,
      isDemo: true,
    };

    // Update associated plots in memory
    plotIds.forEach((pId) => {
      const targetPlot = plots.find((p) => p.id === pId);
      if (targetPlot) {
        targetPlot.currentFarmerId = newFarmer.id;
        targetPlot.currentFarmerName = newFarmer.fullName;
      }
    });

    farmers.unshift(newFarmer);
    recordAudit('CREATE_FARMER', `Registered new member ${fullName} (${newFarmer.farmerCode}) with ${plotIds.length} plot(s)`);
    res.status(201).json(newFarmer);
  });

  // Edit / Update existing farmer
  app.put('/api/v1/farmers/:id', requirePermission('CREATE_FARMER'), (req, res) => {
    const farmer = farmers.find((f) => f.id === req.params.id);
    if (!farmer) {
      return res.status(404).json({ error: 'Farmer record not found.' });
    }

    const {
      fullName,
      phone,
      nationalId,
      email,
      village,
      cell,
      sector,
      district,
      cooperativeName,
      membershipStatus,
      totalHectares,
      assignedPlotIds,
      notes,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Farmer full name is required.' });
    }
    if (!phone || !phone.trim() || phone.trim().length < 10) {
      return res.status(400).json({ error: 'Valid phone number is required.' });
    }

    const cleanedPhone = phone.trim();
    if (farmers.some((f) => f.id !== farmer.id && f.phone === cleanedPhone)) {
      return res.status(409).json({ error: `Phone number ${cleanedPhone} is already registered to another farmer.` });
    }
    if (nationalId && nationalId.trim() && farmers.some((f) => f.id !== farmer.id && f.nationalId === nationalId.trim())) {
      return res.status(409).json({ error: `National ID ${nationalId.trim()} is already registered to another farmer.` });
    }

    const newPlotIds: string[] = Array.isArray(assignedPlotIds) ? assignedPlotIds : [];

    // Clear old plot assignments
    farmer.assignedPlotIds.forEach((oldPlotId) => {
      if (!newPlotIds.includes(oldPlotId)) {
        const p = plots.find((plt) => plt.id === oldPlotId);
        if (p && p.currentFarmerId === farmer.id) {
          p.currentFarmerId = undefined;
          p.currentFarmerName = undefined;
        }
      }
    });

    // Update farmer
    farmer.fullName = fullName.trim();
    farmer.phone = cleanedPhone;
    if (nationalId !== undefined) farmer.nationalId = nationalId.trim() || undefined;
    if (email !== undefined) farmer.email = email.trim() || undefined;
    if (village !== undefined) farmer.village = village.trim() || undefined;
    if (cell !== undefined) farmer.cell = cell.trim() || undefined;
    if (sector !== undefined) farmer.sector = sector.trim() || undefined;
    if (district !== undefined) farmer.district = district.trim() || 'Kirehe';
    if (cooperativeName) farmer.cooperativeName = cooperativeName;
    if (membershipStatus) farmer.membershipStatus = membershipStatus;
    if (totalHectares !== undefined) farmer.totalHectares = Number(totalHectares) || 1.0;
    farmer.assignedPlotIds = newPlotIds;
    if (notes !== undefined) farmer.notes = notes.trim() || undefined;

    // Apply new plot assignments
    newPlotIds.forEach((pId) => {
      const p = plots.find((plt) => plt.id === pId);
      if (p) {
        p.currentFarmerId = farmer.id;
        p.currentFarmerName = farmer.fullName;
      }
    });

    recordAudit('UPDATE_FARMER', `Updated farmer profile ${farmer.fullName} (${farmer.farmerCode})`);
    res.json(farmer);
  });

  app.post('/api/v1/farmers/import-csv', requirePermission('IMPORT_FARMERS'), (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows provided for import.' });
    }

    const imported: Farmer[] = [];
    const errors: Array<{ row: number; reason: string }> = [];

    rows.forEach((row, idx) => {
      if (!row.fullName || !row.phone) {
        errors.push({ row: idx + 1, reason: 'Missing required full name or phone.' });
        return;
      }
      // Duplicate detection by phone
      if (farmers.some((f) => f.phone === row.phone) || imported.some((f) => f.phone === row.phone)) {
        errors.push({ row: idx + 1, reason: `Phone number ${row.phone} already registered.` });
        return;
      }

      const f: Farmer = {
        id: `fmr-${Date.now()}-${idx}`,
        farmerCode: `NSH-FMR-${String(farmers.length + imported.length + 101).padStart(4, '0')}`,
        fullName: row.fullName,
        phone: row.phone,
        nationalId: row.nationalId,
        email: row.email,
        cooperativeName: row.cooperativeName || "Umuryango w'Abakoresha Amazi Nasho (WUO)",
        membershipStatus: 'ACTIVE',
        registrationDate: new Date().toISOString().split('T')[0],
        totalHectares: Number(row.totalHectares) || 1.0,
        assignedPlotIds: [],
        notes: row.notes || 'Imported via CSV batch',
        isDemo: true,
      };
      imported.push(f);
    });

    farmers.unshift(...imported);
    recordAudit('IMPORT_FARMERS', `Imported ${imported.length} farmers (${errors.length} failed)`);
    res.json({ importedCount: imported.length, errorCount: errors.length, errors, imported });
  });

  // Plots
  app.get('/api/v1/plots', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const myPlots = plots.filter((p) => p.currentFarmerId === currentUser.farmerId);
      return res.json(myPlots);
    }
    res.json(plots);
  });

  app.post('/api/v1/plots', requirePermission('MANAGE_PLOTS'), (req, res) => {
    const { plotCode, blockCode, areaHectares, irrigationType, currentCrop, currentFarmerId, flowRateM3PerHour } = req.body;
    if (!plotCode || !blockCode) {
      return res.status(400).json({ error: 'Plot code and block code are required.' });
    }
    if (plots.some((p) => p.plotCode.toUpperCase() === plotCode.toUpperCase())) {
      return res.status(400).json({ error: `Plot code "${plotCode}" already exists.` });
    }

    const farmer = farmers.find((f) => f.id === currentFarmerId);

    const newPlot: Plot = {
      id: `plt-${Date.now()}`,
      plotCode,
      blockCode,
      schemeName: 'GFI Nasho 1',
      areaHectares: Number(areaHectares) || 1.0,
      irrigationType: irrigationType || 'CENTER_PIVOT',
      currentCrop: currentCrop || 'Maize',
      status: 'ACTIVE',
      currentFarmerId,
      currentFarmerName: farmer?.fullName,
      flowRateM3PerHour: Number(flowRateM3PerHour) || 120,
      isDemo: true,
    };

    plots.unshift(newPlot);
    if (farmer) {
      farmer.assignedPlotIds.push(newPlot.id);
    }
    recordAudit('CREATE_PLOT', `Created plot ${plotCode} in ${blockCode}`);
    res.status(201).json(newPlot);
  });

  // Schedules
  app.get('/api/v1/schedules', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const mySchedules = schedules.filter((s) => s.farmerId === currentUser.farmerId);
      return res.json(mySchedules);
    }
    res.json(schedules);
  });

  app.post('/api/v1/schedules', requirePermission('CREATE_SCHEDULE'), (req, res) => {
    const { plotId, plannedStartTime, plannedEndTime, plannedVolumeM3, allocationBasis, notes } = req.body;
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) {
      return res.status(400).json({ error: 'Plot not found.' });
    }

    // Overlap conflict detection
    const conflicts = findScheduleConflicts({ plotId, plannedStartTime, plannedEndTime }, schedules);
    if (conflicts.length > 0) {
      return res.status(409).json({
        error: `Schedule conflict detected: Plot ${plot.plotCode} is already scheduled from ${new Date(conflicts[0].plannedStartTime).toLocaleTimeString()} to ${new Date(conflicts[0].plannedEndTime).toLocaleTimeString()}.`,
        conflictingSchedule: conflicts[0],
      });
    }

    const newSchedule: WaterSchedule = {
      id: `sch-${Date.now()}`,
      scheduleCode: `SCH-2026-${String(schedules.length + 401).padStart(4, '0')}`,
      plotId,
      plotCode: plot.plotCode,
      farmerId: plot.currentFarmerId || 'unknown',
      farmerName: plot.currentFarmerName || 'Unassigned Member',
      plannedStartTime,
      plannedEndTime,
      plannedVolumeM3: Number(plannedVolumeM3) || 350,
      status: 'SUBMITTED',
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      allocationBasis: allocationBasis || 'TIME_HOURS',
      notes,
      isDemo: true,
    };

    schedules.unshift(newSchedule);
    recordAudit('DRAFT_SCHEDULE', `Created schedule ${newSchedule.scheduleCode} for ${plot.plotCode}`);
    res.status(201).json(newSchedule);
  });

  app.post('/api/v1/schedules/:id/approve', requirePermission('APPROVE_SCHEDULE'), (req, res) => {
    const schedule = schedules.find((s) => s.id === req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

    if (!isValidScheduleStateTransition(schedule.status, 'APPROVED')) {
      return res.status(400).json({ error: `Cannot transition from ${schedule.status} to APPROVED.` });
    }

    schedule.status = 'APPROVED';
    schedule.approvedBy = currentUser.name;
    schedule.approvedAt = new Date().toISOString();

    // Trigger SMS notification
    const farmer = farmers.find((f) => f.id === schedule.farmerId);
    if (farmer) {
      const sms: SmsNotification = {
        id: `sms-${Date.now()}`,
        recipientPhone: farmer.phone,
        recipientName: farmer.fullName,
        farmerId: farmer.id,
        type: 'SCHEDULE_ALERT',
        language: 'rw',
        message: `GFI Nasho 1: Gahunda yo kuhira umurima wawe ${schedule.plotCode} yemerewe. Gutangira: ${new Date(schedule.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} kugeza ${new Date(schedule.plannedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        provider: 'MOCK_GW',
        isDemo: true,
      };
      notifications.unshift(sms);
    }

    recordAudit('APPROVE_SCHEDULE', `Approved water schedule ${schedule.scheduleCode}`);
    res.json({ success: true, schedule });
  });

  app.post('/api/v1/schedules/:id/deliver', requirePermission('RECORD_DELIVERY'), (req, res) => {
    const schedule = schedules.find((s) => s.id === req.params.id);
    if (!schedule) return res.status(404).json({ error: 'Schedule not found.' });

    const { actualStartTime, actualEndTime, actualVolumeM3, status, interruptionReason } = req.body;
    schedule.actualStartTime = actualStartTime || new Date().toISOString();
    schedule.actualEndTime = actualEndTime || new Date().toISOString();
    schedule.actualVolumeM3 = Number(actualVolumeM3) || schedule.plannedVolumeM3;
    schedule.status = status || 'COMPLETED';
    schedule.interruptionReason = interruptionReason;

    recordAudit('RECORD_DELIVERY', `Recorded delivery for ${schedule.scheduleCode}: ${schedule.actualVolumeM3} m³`);
    res.json({ success: true, schedule });
  });

  // Tariffs
  app.get('/api/v1/tariffs', (_req, res) => {
    res.json(tariffs);
  });

  // Invoices
  app.get('/api/v1/billing/invoices', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const myInvoices = invoices.filter((i) => i.farmerId === currentUser.farmerId);
      return res.json(myInvoices);
    }
    res.json(invoices);
  });

  app.post('/api/v1/billing/invoices', requirePermission('CREATE_INVOICE'), (req, res) => {
    const { farmerId, lineItems, season, dueDate } = req.body;
    const farmer = farmers.find((f) => f.id === farmerId);
    if (!farmer) return res.status(400).json({ error: 'Farmer not found.' });
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Invoice must have at least one line item.' });
    }

    const subtotal = lineItems.reduce((acc, item) => addMoney(acc, Number(item.totalRwf) || 0), 0);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(invoices.length + 44).padStart(4, '0')}`,
      farmerId: farmer.id,
      farmerName: farmer.fullName,
      farmerCode: farmer.farmerCode,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || '2026-11-15',
      lineItems,
      subtotalRwf: subtotal,
      taxRwf: 0,
      totalRwf: subtotal,
      amountPaidRwf: 0,
      balanceRwf: subtotal,
      status: 'ISSUED',
      season: season || '2026A',
      isDemo: true,
    };

    invoices.unshift(newInvoice);
    recordAudit('CREATE_INVOICE', `Created invoice ${newInvoice.invoiceNumber} for ${farmer.fullName} (${subtotal} RWF)`);
    res.status(201).json(newInvoice);
  });

  // Payments & Receipts
  app.get('/api/v1/billing/payments', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const myPayments = payments.filter((p) => p.farmerId === currentUser.farmerId);
      return res.json(myPayments);
    }
    res.json(payments);
  });

  app.post('/api/v1/billing/payments', requirePermission('RECORD_PAYMENT'), (req, res) => {
    const { invoiceId, amountRwf, paymentMethod, transactionReference, idempotencyKey, notes } = req.body;
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return res.status(400).json({ error: 'Invoice not found.' });

    const payAmount = Number(amountRwf);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero.' });
    }

    // Idempotency & duplicate check
    if (isDuplicatePaymentTransaction(idempotencyKey, transactionReference, processedIdempotencyKeys, processedTxRefs)) {
      return res.status(409).json({
        error: `Duplicate payment rejected: Idempotency key "${idempotencyKey}" or reference "${transactionReference}" was already processed.`,
      });
    }

    // Apply payment
    const { newAmountPaid, newBalance, newStatus } = applyPaymentToInvoice(inv.totalRwf, inv.amountPaidRwf, payAmount);
    inv.amountPaidRwf = newAmountPaid;
    inv.balanceRwf = newBalance;
    inv.status = newStatus;

    const receiptNumber = `REC-2026-${String(payments.length + 33).padStart(4, '0')}`;
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      farmerId: inv.farmerId,
      farmerName: inv.farmerName,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amountRwf: payAmount,
      paymentMethod: paymentMethod || 'MTN_MOMO',
      transactionReference: transactionReference?.trim() || `MANUAL-${Date.now()}`,
      idempotencyKey: idempotencyKey || `IDEM-${Date.now()}`,
      recordedBy: currentUser.name,
      recordedAt: new Date().toISOString(),
      isVerified: true,
      notes,
      isDemo: true,
    };

    processedIdempotencyKeys.add(newPayment.idempotencyKey);
    processedTxRefs.add(newPayment.transactionReference.toUpperCase());
    payments.unshift(newPayment);

    // Trigger SMS receipt
    const farmer = farmers.find((f) => f.id === inv.farmerId);
    if (farmer) {
      const sms: SmsNotification = {
        id: `sms-${Date.now()}`,
        recipientPhone: farmer.phone,
        recipientName: farmer.fullName,
        farmerId: farmer.id,
        type: 'PAYMENT_RECEIPT',
        language: 'rw',
        message: `GFI Nasho 1: Twakiriye ubwishyu bwa ${payAmount.toLocaleString()} RWF (${receiptNumber}). Inyemezabwishyu: ${inv.invoiceNumber}. Asigaye: ${newBalance.toLocaleString()} RWF. Murakoze!`,
        sentAt: new Date().toISOString(),
        status: 'DELIVERED',
        provider: 'MOCK_GW',
        isDemo: true,
      };
      notifications.unshift(sms);
    }

    recordAudit('RECORD_PAYMENT', `Verified payment ${receiptNumber} of ${payAmount} RWF for invoice ${inv.invoiceNumber}`);
    res.status(201).json({ payment: newPayment, updatedInvoice: inv });
  });

  // Equipment
  app.get('/api/v1/equipment', (_req, res) => {
    res.json(equipment);
  });

  // Work Orders
  app.get('/api/v1/work-orders', (_req, res) => {
    res.json(workOrders);
  });

  app.post('/api/v1/work-orders', requirePermission('CREATE_WORK_ORDER'), (req, res) => {
    const { equipmentId, title, description, priority, assignedTechnicianName, estimatedCostRwf } = req.body;
    const eq = equipment.find((e) => e.id === equipmentId);
    if (!eq) return res.status(400).json({ error: 'Equipment asset not found.' });

    const newWO: WorkOrder = {
      id: `wo-${Date.now()}`,
      workOrderNumber: `WO-2026-${String(workOrders.length + 20).padStart(4, '0')}`,
      equipmentId: eq.id,
      equipmentCode: eq.assetCode,
      equipmentName: eq.name,
      title: title || 'Inspection and repair',
      description,
      priority: priority || 'MEDIUM',
      status: 'OPEN',
      assignedTechnicianName: assignedTechnicianName || 'Jean Claude Bizimana',
      reportedDate: new Date().toISOString().split('T')[0],
      estimatedCostRwf: Number(estimatedCostRwf) || 25000,
      downtimeHours: 0,
      isDemo: true,
    };

    workOrders.unshift(newWO);
    recordAudit('CREATE_WORK_ORDER', `Created work order ${newWO.workOrderNumber} for ${eq.assetCode}`);
    res.status(201).json(newWO);
  });

  app.put('/api/v1/work-orders/:id', requirePermission('UPDATE_MAINTENANCE'), (req, res) => {
    const wo = workOrders.find((w) => w.id === req.params.id);
    if (!wo) return res.status(404).json({ error: 'Work order not found.' });

    const { status, downtimeHours, actualCostRwf, sparePartsUsed, notes } = req.body;
    if (status) wo.status = status;
    if (downtimeHours !== undefined) wo.downtimeHours = Number(downtimeHours);
    if (actualCostRwf !== undefined) wo.actualCostRwf = Number(actualCostRwf);
    if (sparePartsUsed) wo.sparePartsUsed = sparePartsUsed;
    if (notes) wo.notes = notes;
    if (status === 'COMPLETED' && !wo.completedDate) {
      wo.completedDate = new Date().toISOString().split('T')[0];
    }

    recordAudit('UPDATE_WORK_ORDER', `Updated work order ${wo.workOrderNumber} to status ${wo.status}`);
    res.json({ success: true, workOrder: wo });
  });

  // Complaints / Water Interruption Tickets
  app.get('/api/v1/complaints', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const myComplaints = complaints.filter((c) => c.farmerId === currentUser.farmerId);
      return res.json(myComplaints);
    }
    res.json(complaints);
  });

  app.post('/api/v1/complaints', (req, res) => {
    const { category, description, plotCode } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required.' });

    const farmer = farmers.find((f) => f.id === currentUser.farmerId) || farmers[0];

    const newTicket: Complaint = {
      id: `cmp-${Date.now()}`,
      ticketNumber: `CMP-2026-${String(complaints.length + 47).padStart(4, '0')}`,
      farmerId: farmer.id,
      farmerName: farmer.fullName,
      plotCode,
      category: category || 'WATER_SHORTAGE',
      description,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      isDemo: true,
    };

    complaints.unshift(newTicket);
    recordAudit('SUBMIT_COMPLAINT', `Farmer ${farmer.fullName} filed ticket ${newTicket.ticketNumber}`);
    res.status(201).json(newTicket);
  });

  // SMS Notifications
  app.get('/api/v1/notifications', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const mySms = notifications.filter((n) => n.farmerId === currentUser.farmerId);
      return res.json(mySms);
    }
    res.json(notifications);
  });

  app.post('/api/v1/notifications/send-sms', (req, res) => {
    const { phone, message, farmerId, type, language } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required.' });
    }

    const newSms: SmsNotification = {
      id: `sms-${Date.now()}`,
      recipientPhone: phone,
      recipientName: 'Scheme Member',
      farmerId,
      type: type || 'SCHEDULE_ALERT',
      language: language || 'rw',
      message,
      sentAt: new Date().toISOString(),
      status: 'DELIVERED',
      provider: 'MOCK_GW',
      isDemo: true,
    };

    notifications.unshift(newSms);
    res.status(201).json(newSms);
  });

  // Farmer QR Check-ins API
  app.get('/api/v1/farmer/check-ins', (_req, res) => {
    if (currentUser.role === 'FARMER' && currentUser.farmerId) {
      const myCheckins = checkins.filter((c) => c.farmerId === currentUser.farmerId);
      return res.json(myCheckins);
    }
    res.json(checkins);
  });

  app.post('/api/v1/farmer/check-ins', (req, res) => {
    const { qrData, manualPlotCode } = req.body;
    let finalQrData = qrData;

    // Derive farmer strictly from authenticated session token/user
    let farmer = farmers.find((f) => f.id === currentUser.farmerId);
    if (!farmer) {
      farmer = farmers[0]; // Primary fallback farmer for demo session
    }

    if (!finalQrData && manualPlotCode) {
      const plot = plots.find((p) => p.plotCode === manualPlotCode || p.blockCode.includes(manualPlotCode));
      if (plot) {
        finalQrData = generateBlockQrPayload(plot);
      } else {
        finalQrData = JSON.stringify({
          schema: 'GFI_NASHO_1_SITE_QR',
          scheme: 'GFI_N1',
          plotCode: manualPlotCode,
          signatureToken: 'HASH-NSH1-MANUAL-TOKEN',
        });
      }
    }

    if (!finalQrData) {
      return res.status(400).json({ error: 'QR Code payload or irrigation plot code is required.' });
    }

    const verificationResult = processFarmerCheckinVerification({
      farmer,
      rawQrData: finalQrData,
      plots,
      schedules,
      existingCheckins: checkins,
    });

    if (verificationResult.success && verificationResult.checkin) {
      checkins.unshift(verificationResult.checkin);
      recordAudit(
        'FARMER_CHECKIN_VERIFIED',
        `Farmer ${farmer.fullName} verified site check-in at ${verificationResult.checkin.plotCode} via QR [${verificationResult.checkin.qrCodeId}]`
      );
      return res.status(201).json({
        success: true,
        verificationStatus: 'VERIFIED',
        message: verificationResult.reason,
        checkin: verificationResult.checkin,
        plot: verificationResult.matchedPlot,
        schedule: verificationResult.matchedSchedule,
      });
    }

    recordAudit(
      'FARMER_CHECKIN_REJECTED',
      `Farmer ${farmer.fullName} check-in rejected: ${verificationResult.reason}`
    );

    res.status(400).json({
      success: false,
      verificationStatus: verificationResult.status,
      error: verificationResult.reason,
      message: verificationResult.reason,
    });
  });

  // Offline Synchronization Endpoint
  app.post('/api/v1/sync', (req, res) => {
    const { events } = req.body;
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'events array required.' });
    }

    const results: Array<{ id: string; status: 'SYNCED' | 'FAILED'; error?: string }> = [];

    for (const event of events) {
      const validation = validateOfflineEvent(event);
      if (!validation.valid) {
        results.push({ id: event.id, status: 'FAILED', error: validation.error });
        continue;
      }

      if (event.eventType === 'SUBMIT_COMPLAINT' || event.eventType === 'REPORT_INTERRUPTION') {
        const payload = event.payload;
        const newTicket: Complaint = {
          id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          ticketNumber: `CMP-2026-${String(complaints.length + 50).padStart(4, '0')}`,
          farmerId: currentUser.farmerId || 'fmr-001',
          farmerName: currentUser.name,
          plotCode: payload.plotCode as string,
          category: payload.category || 'WATER_SHORTAGE',
          description: payload.description || 'Offline recorded interruption',
          submittedAt: event.queuedAt || new Date().toISOString(),
          status: 'PENDING',
          isDemo: true,
        };
        complaints.unshift(newTicket);
        results.push({ id: event.id, status: 'SYNCED' });
      } else {
        results.push({ id: event.id, status: 'FAILED', error: 'Unhandled offline event type.' });
      }
    }

    res.json({ processed: results.length, results });
  });

  // QR Poster Templates API
  app.get('/api/v1/qr-templates', (_req, res) => {
    res.json(qrTemplates);
  });

  app.post('/api/v1/qr-templates', requirePermission('MANAGE_PLOTS'), (req, res) => {
    const templateData = req.body as QrPosterTemplate;
    if (!templateData || !templateData.posterTitle) {
      return res.status(400).json({ error: 'Valid QR poster template configuration required.' });
    }

    const updated: QrPosterTemplate = {
      ...templateData,
      updatedAt: new Date().toISOString(),
    };

    const existingIdx = qrTemplates.findIndex((t) => t.id === updated.id);
    if (existingIdx >= 0) {
      qrTemplates[existingIdx] = updated;
    } else {
      qrTemplates.unshift(updated);
    }

    recordAudit('UPDATE_QR_POSTER_TEMPLATE', `Updated QR code poster template "${updated.name || 'Default'}"`);
    res.json({ success: true, template: updated });
  });

  // Quick Logs API
  app.get('/api/v1/irrigation/quick-logs', (_req, res) => {
    const { date, blockCode, status } = _req.query;
    let result = [...quickLogs];

    if (date && typeof date === 'string') {
      result = result.filter((l) => l.reportDate === date);
    }
    if (blockCode && typeof blockCode === 'string') {
      result = result.filter((l) => l.blockCode.toLowerCase().includes(blockCode.toLowerCase()));
    }
    if (status && typeof status === 'string') {
      result = result.filter((l) => l.irrigationStatus === status);
    }

    res.json(result);
  });

  app.post('/api/v1/irrigation/quick-logs', requirePermission('SUBMIT_QUICK_LOG'), (req, res) => {
    const {
      blockId,
      blockCode,
      reportDate,
      reportCategory,
      irrigationStatus,
      notes,
      problemDescription,
      requiresFollowup,
      waterDelivered,
      deliveryStartTime,
      deliveryEndTime,
      waterVolumeM3,
    } = req.body;

    const finalReportDate = reportDate || getKigaliTodayDate();

    // Server-side validation
    const validation = validateQuickLogInput({
      blockCode,
      reportDate: finalReportDate,
      irrigationStatus,
      problemDescription,
    });

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errorRw || validation.errorEn });
    }

    // Server-side duplicate warning
    const isDuplicate = isDuplicateQuickLog(blockCode, finalReportDate, quickLogs);

    // Identity derived strictly from authenticated user context
    const newLog: IrrigationQuickLog = {
      id: `qlog-${Date.now()}`,
      schemeId: 'scheme-nasho-1',
      blockId: blockId || 'plt-001',
      blockCode: blockCode.trim(),
      reportedBy: currentUser.name,
      reporterRole: currentUser.role,
      reportDate: finalReportDate,
      reportCategory: reportCategory || 'Irrigation Status',
      irrigationStatus,
      notes: notes?.trim(),
      problemDescription: problemDescription?.trim(),
      requiresFollowup: Boolean(requiresFollowup) || irrigationStatus === 'PROBLEM_REPORTED' || irrigationStatus === 'INTERRUPTED',
      waterDelivered: Boolean(waterDelivered),
      deliveryStartTime,
      deliveryEndTime,
      waterVolumeM3: waterVolumeM3 ? Number(waterVolumeM3) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDemo: true,
    };

    quickLogs.unshift(newLog);

    const message = newLog.requiresFollowup
      ? 'Raporo yabitswe kandi yashyizwe ku rutonde rw’ibibazo bigomba gukurikiranwa.'
      : 'Raporo yabitswe neza.';

    recordAudit(
      'SUBMIT_QUICK_LOG',
      `Officer ${currentUser.name} logged status [${irrigationStatus}] for ${blockCode} on ${finalReportDate}`
    );

    res.status(201).json({
      success: true,
      log: newLog,
      isDuplicate,
      message,
    });
  });

  // Audit Logs
  app.get('/api/v1/audit-logs', requirePermission('VIEW_AUDIT_LOGS'), (_req, res) => {
    res.json(auditLogs);
  });

  // Mount Vite middleware in development with HMR disabled to prevent WebSocket dropped connection errors
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GFI Nasho 1 Irrigation Management Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
