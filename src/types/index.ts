/**
 * GFI Nasho 1 Irrigation Scheme Management System
 * Core Data Models and Types
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'SCHEME_MANAGER'
  | 'WATER_OPERATOR'
  | 'FINANCE_OFFICER'
  | 'MAINTENANCE_TECH'
  | 'WUA_OFFICER'
  | 'FARMER'
  | 'AUDITOR';

export type Language = 'en' | 'rw';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  farmerId?: string; // If role === 'FARMER'
  organization?: string;
  isActive: boolean;
}

export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'PROBATIONARY' | 'ARCHIVED';

export interface Farmer {
  id: string;
  farmerCode: string; // e.g. NSH-FMR-0104
  fullName: string;
  phone: string;
  nationalId?: string;
  email?: string;
  village?: string;  // Umudugudu
  cell?: string;     // Akagari
  sector?: string;   // Umurenge
  district?: string; // e.g. Kirehe
  cooperativeName: string; // e.g. "Umuryango w'Abakoresha Amazi Nasho (WUO)"
  membershipStatus: MembershipStatus;
  registrationDate: string;
  totalHectares: number;
  assignedPlotIds: string[];
  notes?: string;
  isDemo?: boolean;
}

export type IrrigationType =
  | 'CENTER_PIVOT'
  | 'SPRINKLER'
  | 'DRAGLINE_SPRINKLER'
  | 'DRIP'
  | 'HOSE';

export type PlotStatus = 'ACTIVE' | 'FALLOW' | 'MAINTENANCE' | 'OFFLINE';

export interface Plot {
  id: string;
  plotCode: string; // e.g. BLK-A-P04
  blockCode: string; // e.g. BLOCK-A (Pivot CP-01)
  schemeName: string;
  areaHectares: number;
  irrigationType: IrrigationType;
  currentCrop?: string;
  status: PlotStatus;
  currentFarmerId?: string;
  currentFarmerName?: string;
  latitude?: number;
  longitude?: number;
  centerPivotId?: string;
  flowRateM3PerHour?: number;
  isDemo?: boolean;
}

export type ScheduleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | 'CANCELLED';

export interface WaterSchedule {
  id: string;
  scheduleCode: string; // e.g. SCH-2026-0412
  plotId: string;
  plotCode: string;
  farmerId: string;
  farmerName: string;
  plannedStartTime: string; // ISO String
  plannedEndTime: string;   // ISO String
  plannedVolumeM3: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualVolumeM3?: number;
  status: ScheduleStatus;
  operatorId?: string;
  operatorName?: string;
  allocationBasis: 'TIME_HOURS' | 'VOLUME_M3' | 'HECTARE_QUOTA';
  interruptionReason?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: string;
  isDemo?: boolean;
}

export type TariffBasis = 'PER_HECTARE_SEASON' | 'PER_M3_WATER' | 'PER_HOUR_PUMPING';

export interface Tariff {
  id: string;
  name: string;
  basis: TariffBasis;
  rateRwf: number;
  effectiveFrom: string;
  effectiveTo?: string;
  description: string;
  isActive: boolean;
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceRwf: number;
  totalRwf: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0038
  farmerId: string;
  farmerName: string;
  farmerCode: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotalRwf: number;
  taxRwf: number;
  totalRwf: number;
  amountPaidRwf: number;
  balanceRwf: number;
  status: InvoiceStatus;
  season: string; // e.g. "2026A"
  isDemo?: boolean;
}

export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'BK_BANK_TRANSFER' | 'CASH';

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. REC-2026-0021
  farmerId: string;
  farmerName: string;
  invoiceId: string;
  invoiceNumber: string;
  amountRwf: number;
  paymentMethod: PaymentMethod;
  transactionReference: string; // External transaction ID from telco / bank
  idempotencyKey: string;
  recordedBy: string;
  recordedAt: string;
  isVerified: boolean;
  notes?: string;
  isDemo?: boolean;
}

export type EquipmentType =
  | 'PUMP_STATION'
  | 'CENTER_PIVOT'
  | 'VALVE'
  | 'HYDRANT'
  | 'FLOW_METER'
  | 'FILTRATION_UNIT'
  | 'CONTROL_PANEL'
  | 'MAIN_PIPELINE';

export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REQUIRES_REPAIR' | 'CRITICAL';

export interface Equipment {
  id: string;
  assetCode: string; // e.g. PIVOT-CP-03, PUMP-STN-01
  name: string;
  type: EquipmentType;
  location: string;
  serialNumber: string;
  installDate: string;
  condition: EquipmentCondition;
  status: 'OPERATIONAL' | 'STANDBY' | 'MAINTENANCE_REQUIRED' | 'DECOMMISSIONED';
  lastInspectionDate: string;
  notes?: string;
  isDemo?: boolean;
}

export type WorkOrderStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CANCELLED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface WorkOrder {
  id: string;
  workOrderNumber: string; // e.g. WO-2026-0012
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  assignedTechnicianName?: string;
  reportedDate: string;
  completedDate?: string;
  estimatedCostRwf: number;
  actualCostRwf?: number;
  downtimeHours: number;
  sparePartsUsed?: string[];
  notes?: string;
  isDemo?: boolean;
}

export type ComplaintStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'REJECTED';

export interface Complaint {
  id: string;
  ticketNumber: string; // e.g. CMP-2026-0089
  farmerId: string;
  farmerName: string;
  plotCode?: string;
  category: 'WATER_SHORTAGE' | 'EQUIPMENT_LEAK' | 'BILLING_DISPUTE' | 'SCHEDULE_CONFLICT' | 'OTHER';
  description: string;
  submittedAt: string;
  status: ComplaintStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  isDemo?: boolean;
}

export interface SmsNotification {
  id: string;
  recipientPhone: string;
  recipientName: string;
  farmerId?: string;
  type: 'SCHEDULE_ALERT' | 'SCHEDULE_CHANGE' | 'PAYMENT_RECEIPT' | 'DUE_REMINDER' | 'INTERRUPTION_ALERT';
  language: Language;
  message: string;
  sentAt: string;
  status: 'DELIVERED' | 'PENDING' | 'FAILED';
  provider: 'MOCK_GW' | 'AFRICAS_TALKING' | 'RWANDA_TELCO';
  isDemo?: boolean;
}

export interface OfflineSyncEvent {
  id: string;
  eventType: 'SUBMIT_COMPLAINT' | 'REPORT_INTERRUPTION' | 'UPDATE_PROFILE_NOTE';
  payload: Record<string, unknown>;
  queuedAt: string;
  status: 'QUEUED' | 'SYNCED' | 'FAILED';
  errorMessage?: string;
}

export interface SchemeMetrics {
  activeFarmers: number;
  registeredPlots: number;
  cultivatedHectares: number;
  upcomingSchedules: number;
  reportedInterruptions: number;
  outstandingInvoicesRwf: number;
  recordedPaymentsRwf: number;
  openMaintenanceJobs: number;
  isDemoData: boolean;
}

export type CheckinVerificationStatus = 'VERIFIED' | 'REJECTED' | 'PENDING';

export interface FarmerCheckin {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerCode: string;
  blockId: string;
  blockCode: string;
  plotCode: string;
  qrCodeId: string;
  checkinTime: string; // ISO String
  verificationStatus: CheckinVerificationStatus;
  verificationReason?: string;
  scheduleId?: string;
  seasonId?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface QrPosterTemplate {
  id: string;
  name: string;
  organizationName: string;
  logoDataUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
  footerColor: string;
  posterTitle: string;
  posterSubtitle: string;
  instructionsRw: string;
  footerText: string;
  contactInfo: string;
  paperSize: 'A4_PORTRAIT' | 'A4_LANDSCAPE' | 'COMPACT';
  qrSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  showBlockCode: boolean;
  borderStyle: 'NONE' | 'SOLID' | 'DASHED';
  borderWidth: number;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_KINYARWANDA_INSTRUCTIONS = `UKO MUSIKANA QR CODE
1. Fungura camera ya telefone yawe cyangwa igikoresho gisoma QR code.
2. Erekeza camera kuri QR code iri kuri iki cyapa.
3. Kanda ku butumwa bugaragara kuri telefone yawe.
4. Injira muri konti yawe niba utarayinjiramo.
5. Emeza ko wageze kuri site yagenewe kuhira.
6. Tegereza ubutumwa bukubwira niba byemejwe.

Icyitonderwa: Ugomba kuba ufite uburenganzira bwo gukoresha iyo site. QR code yonyine ntisimbura kwemeza ko wahageze.`;

export const DEFAULT_POSTER_TEMPLATE: QrPosterTemplate = {
  id: 'template-default',
  name: 'Standard GFI Nasho 1 Template',
  organizationName: 'GFI Nasho 1 · Umuryango w’Abakoresha Amazi (WUO)',
  primaryColor: '#0f172a',
  secondaryColor: '#0284c7',
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  headerColor: '#0f172a',
  footerColor: '#f8fafc',
  posterTitle: 'ICYEMEZO CYO KWEMEZA KO WAHAGEZE KU MURIMA',
  posterSubtitle: 'OFFICIAL SITE ARRIVAL CHECK-IN TAG',
  instructionsRw: DEFAULT_KINYARWANDA_INSTRUCTIONS,
  footerText: 'Official Water Users Organization (WUO) Security Verification Stamp',
  contactInfo: 'Inquiries: +250 788 310 920 | support@gfinasho.rw | Kirehe District, Eastern Province',
  paperSize: 'A4_PORTRAIT',
  qrSize: 'MEDIUM',
  showBlockCode: true,
  borderStyle: 'SOLID',
  borderWidth: 2,
  isDefault: true,
  createdBy: 'Scheme Administrator',
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
};

export type QuickLogStatus =
  | 'COMPLETED_SUCCESSFULLY'
  | 'IN_PROGRESS'
  | 'NOT_STARTED'
  | 'INTERRUPTED'
  | 'PROBLEM_REPORTED';

export interface IrrigationQuickLog {
  id: string;
  schemeId: string;
  blockId: string;
  blockCode: string;
  reportedBy: string;
  reporterRole: UserRole;
  reportDate: string; // Africa/Kigali YYYY-MM-DD
  reportCategory: string; // e.g. "Irrigation Status"
  irrigationStatus: QuickLogStatus;
  notes?: string;
  problemDescription?: string;
  requiresFollowup: boolean;
  waterDelivered?: boolean;
  deliveryStartTime?: string;
  deliveryEndTime?: string;
  waterVolumeM3?: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}


