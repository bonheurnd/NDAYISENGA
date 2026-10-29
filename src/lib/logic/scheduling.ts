export interface SchemeRules {
  maxPivotFlowRateM3h: number; // e.g. 450 m³/h
  maxPumpStationFlowRateM3h: number; // e.g. 1800 m³/h total intake
  minAdvanceNoticeHours: number; // e.g. 12 hours minimum booking in advance
  maxDailyHoursPerPlot: number; // e.g. 10 hours
  requireManagerApproval: boolean; // default true
  allowPartialDelivery: boolean; // default true
  approvedByManagement: boolean; // default true
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export interface IrrigationSeason {
  id: string;
  seasonCode: string; // e.g., "2026A", "2026B"
  name: string;
  startDate: string;
  endDate: string;
  totalQuotaM3: number;
  allocatedVolumeM3: number;
  deliveredVolumeM3: number;
  isActive: boolean;
}

export type WaterScheduleStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | 'CANCELLED';

export interface WaterScheduleItem {
  id: string;
  scheduleCode: string;
  seasonId: string;
  blockCode: string;
  plotId: string;
  plotCode: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  plannedStartTime: string;
  plannedEndTime: string;
  plannedVolumeM3: number;
  allocationBasis: 'TIME_HOURS' | 'VOLUME_M3' | 'HECTARE_QUOTA';
  flowRateM3h: number; // calculated flow rate requirement
  status: WaterScheduleStatus;
  actualStartTime?: string;
  actualEndTime?: string;
  actualVolumeM3?: number;
  rejectionReason?: string;
  interruptionReason?: string;
  interruptionDurationMins?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ScheduleConflict {
  type: 'TIME_OVERLAP' | 'PIVOT_CAPACITY_EXCEEDED' | 'PUMP_STATION_CAPACITY_EXCEEDED' | 'ADVANCE_NOTICE_VIOLATION';
  message: string;
  conflictingScheduleCodes: string[];
}

export interface ScheduleHistoryEntry {
  id: string;
  scheduleId: string;
  scheduleCode: string;
  previousStatus: WaterScheduleStatus;
  newStatus: WaterScheduleStatus;
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface FarmerNotification {
  id: string;
  scheduleId: string;
  farmerId: string;
  farmerPhone: string;
  language: 'en' | 'rw';
  title: string;
  message: string;
  status: 'SENT' | 'PENDING';
  timestamp: string;
}

export const DEFAULT_SCHEME_RULES: SchemeRules = {
  maxPivotFlowRateM3h: 450,
  maxPumpStationFlowRateM3h: 1800,
  minAdvanceNoticeHours: 12,
  maxDailyHoursPerPlot: 10,
  requireManagerApproval: true,
  allowPartialDelivery: true,
  approvedByManagement: true,
  lastUpdatedBy: 'Scheme Director',
  updatedAt: new Date().toISOString(),
};

/**
 * Validates a water schedule against resource capacities, overlapping windows, and scheme rules.
 */
export function validateScheduleRequest(
  newSchedule: Partial<WaterScheduleItem>,
  existingSchedules: WaterScheduleItem[],
  rules: SchemeRules = DEFAULT_SCHEME_RULES,
  requestTimeMs: number = Date.now()
): { isValid: boolean; conflicts: ScheduleConflict[] } {
  const conflicts: ScheduleConflict[] = [];

  if (!newSchedule.plannedStartTime || !newSchedule.plannedEndTime || !newSchedule.plotId) {
    return {
      isValid: false,
      conflicts: [
        {
          type: 'TIME_OVERLAP',
          message: 'Planned start time, end time, and plot ID are required.',
          conflictingScheduleCodes: [],
        },
      ],
    };
  }

  const newStart = new Date(newSchedule.plannedStartTime).getTime();
  const newEnd = new Date(newSchedule.plannedEndTime).getTime();

  if (newEnd <= newStart) {
    conflicts.push({
      type: 'TIME_OVERLAP',
      message: 'End time must be strictly after start time.',
      conflictingScheduleCodes: [],
    });
    return { isValid: false, conflicts };
  }

  // 1. Advance Notice Rule
  const advanceHours = (newStart - requestTimeMs) / (1000 * 60 * 60);
  if (advanceHours < rules.minAdvanceNoticeHours) {
    conflicts.push({
      type: 'ADVANCE_NOTICE_VIOLATION',
      message: `Schedule must be submitted at least ${rules.minAdvanceNoticeHours} hours in advance. Provided advance: ${advanceHours.toFixed(1)}h.`,
      conflictingScheduleCodes: [],
    });
  }

  // Active schedules to check against
  const activeSchedules = existingSchedules.filter(
    (s) => s.id !== newSchedule.id && s.status !== 'CANCELLED'
  );

  // 2. Direct Same Plot Overlap Check
  const directOverlaps = activeSchedules.filter((s) => {
    if (s.plotId !== newSchedule.plotId) return false;
    const sStart = new Date(s.plannedStartTime).getTime();
    const sEnd = new Date(s.plannedEndTime).getTime();
    return newStart < sEnd && newEnd > sStart;
  });

  if (directOverlaps.length > 0) {
    conflicts.push({
      type: 'TIME_OVERLAP',
      message: `Plot ${newSchedule.plotCode || newSchedule.plotId} already has a conflicting active schedule window.`,
      conflictingScheduleCodes: directOverlaps.map((s) => s.scheduleCode),
    });
  }

  // 3. Pivot / Block Capacity Check
  const newBlock = newSchedule.blockCode || 'CP-01';
  const durationHours = (newEnd - newStart) / (1000 * 60 * 60);
  const newPlannedVol = newSchedule.plannedVolumeM3 || 420;
  const newFlowRate = newPlannedVol / (durationHours || 1);

  // Find concurrent schedules on the same block/pivot
  const concurrentBlockSchedules = activeSchedules.filter((s) => {
    if (s.blockCode !== newBlock) return false;
    const sStart = new Date(s.plannedStartTime).getTime();
    const sEnd = new Date(s.plannedEndTime).getTime();
    return newStart < sEnd && newEnd > sStart;
  });

  const concurrentBlockFlow = concurrentBlockSchedules.reduce((sum, s) => {
    const sDur = (new Date(s.plannedEndTime).getTime() - new Date(s.plannedStartTime).getTime()) / (1000 * 60 * 60);
    return sum + (s.flowRateM3h || s.plannedVolumeM3 / (sDur || 1));
  }, 0);

  if (concurrentBlockFlow + newFlowRate > rules.maxPivotFlowRateM3h) {
    conflicts.push({
      type: 'PIVOT_CAPACITY_EXCEEDED',
      message: `Pivot/Block ${newBlock} flow rate capacity exceeded (${(concurrentBlockFlow + newFlowRate).toFixed(0)} m³/h > ${rules.maxPivotFlowRateM3h} m³/h max).`,
      conflictingScheduleCodes: concurrentBlockSchedules.map((s) => s.scheduleCode),
    });
  }

  // 4. Total Pump Station Flow Capacity Check
  const concurrentAllSchedules = activeSchedules.filter((s) => {
    const sStart = new Date(s.plannedStartTime).getTime();
    const sEnd = new Date(s.plannedEndTime).getTime();
    return newStart < sEnd && newEnd > sStart;
  });

  const totalIntakeFlow = concurrentAllSchedules.reduce((sum, s) => {
    const sDur = (new Date(s.plannedEndTime).getTime() - new Date(s.plannedStartTime).getTime()) / (1000 * 60 * 60);
    return sum + (s.flowRateM3h || s.plannedVolumeM3 / (sDur || 1));
  }, 0);

  if (totalIntakeFlow + newFlowRate > rules.maxPumpStationFlowRateM3h) {
    conflicts.push({
      type: 'PUMP_STATION_CAPACITY_EXCEEDED',
      message: `Lake Nasho main pump station flow rate capacity exceeded (${(totalIntakeFlow + newFlowRate).toFixed(0)} m³/h > ${rules.maxPumpStationFlowRateM3h} m³/h limit).`,
      conflictingScheduleCodes: concurrentAllSchedules.map((s) => s.scheduleCode),
    });
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
  };
}

/**
 * Validates status transitions in the water scheduling lifecycle.
 */
export function transitionScheduleStatus(
  current: WaterScheduleItem,
  targetStatus: WaterScheduleStatus,
  userRole: string,
  userEmail: string,
  reason?: string
): { updatedSchedule: WaterScheduleItem; historyEntry: ScheduleHistoryEntry; notification: FarmerNotification } {
  const allowedTransitions: Record<WaterScheduleStatus, WaterScheduleStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'INTERRUPTED', 'CANCELLED'],
    INTERRUPTED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const allowed = allowedTransitions[current.status] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `Invalid status transition from ${current.status} to ${targetStatus}.`
    );
  }

  // Permission check for approval
  if (targetStatus === 'APPROVED' && !['SCHEME_MANAGER', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'WUA_LEADER', 'WUA_OFFICER', 'WUO_LEADER', 'WUO_OFFICER'].includes(userRole)) {
    throw new Error('Only Scheme Management or WUO Leaders can approve irrigation schedules.');
  }

  const now = new Date().toISOString();
  const updated: WaterScheduleItem = {
    ...current,
    status: targetStatus,
    ...(targetStatus === 'APPROVED' ? { approvedBy: userEmail, approvedAt: now } : {}),
    ...(targetStatus === 'INTERRUPTED' ? { interruptionReason: reason || 'Operational Interruption' } : {}),
    ...(targetStatus === 'CANCELLED' ? { rejectionReason: reason || 'Cancelled by user' } : {}),
  };

  const historyEntry: ScheduleHistoryEntry = {
    id: `HIST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    scheduleId: current.id,
    scheduleCode: current.scheduleCode,
    previousStatus: current.status,
    newStatus: targetStatus,
    changedBy: userEmail,
    reason,
    timestamp: now,
  };

  const notification = generateFarmerNotification(updated, targetStatus);

  return { updatedSchedule: updated, historyEntry, notification };
}

/**
 * Records actual delivered water volume and updates delivery status metrics.
 */
export function calculateDeliveryMetrics(
  plannedM3: number,
  actualM3: number,
  plannedStartISO: string,
  plannedEndISO: string,
  actualEndISO?: string
) {
  const plannedDurationHrs =
    (new Date(plannedEndISO).getTime() - new Date(plannedStartISO).getTime()) / (1000 * 60 * 60);
  
  const actualEndMs = actualEndISO ? new Date(actualEndISO).getTime() : Date.now();
  const actualDurationHrs =
    (actualEndMs - new Date(plannedStartISO).getTime()) / (1000 * 60 * 60);

  const volumeVarianceM3 = actualM3 - plannedM3;
  const volumeVariancePercent = plannedM3 > 0 ? (volumeVarianceM3 / plannedM3) * 100 : 0;
  const averageFlowRateM3h = actualDurationHrs > 0 ? actualM3 / actualDurationHrs : actualM3;

  return {
    plannedDurationHrs: parseFloat(plannedDurationHrs.toFixed(2)),
    actualDurationHrs: parseFloat(actualDurationHrs.toFixed(2)),
    volumeVarianceM3: parseFloat(volumeVarianceM3.toFixed(2)),
    volumeVariancePercent: parseFloat(volumeVariancePercent.toFixed(1)),
    averageFlowRateM3h: parseFloat(averageFlowRateM3h.toFixed(1)),
  };
}

/**
 * Generates clear bilingual farmer notification for SMS/Push alerts.
 */
export function generateFarmerNotification(
  schedule: WaterScheduleItem,
  newStatus: WaterScheduleStatus
): FarmerNotification {
  const isRw = true; // bilingual prompt
  let titleEn = '';
  let msgEn = '';
  let titleRw = '';
  let msgRw = '';

  const dateStr = new Date(schedule.plannedStartTime).toLocaleDateString();
  const startStr = new Date(schedule.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  switch (newStatus) {
    case 'APPROVED':
      titleEn = `Water Schedule Approved: ${schedule.scheduleCode}`;
      msgEn = `Hello ${schedule.farmerName}, your irrigation window for plot ${schedule.plotCode} is APPROVED for ${dateStr} at ${startStr}. Volume: ${schedule.plannedVolumeM3}m3.`;
      titleRw = `Guhira Kwenmejwe: ${schedule.scheduleCode}`;
      msgRw = `Muraho ${schedule.farmerName}, igihe cyo kuhira umurima ${schedule.plotCode} CYEMEWE ku ya ${dateStr} saa ${startStr}. Ingano: ${schedule.plannedVolumeM3}m3.`;
      break;
    case 'IN_PROGRESS':
      titleEn = `Irrigation Started: ${schedule.plotCode}`;
      msgEn = `Pumps activated for plot ${schedule.plotCode}. Please monitor your field valves.`;
      titleRw = `Guhira Bitangiye: ${schedule.plotCode}`;
      msgRw = `Umusaruro w'amazi utangiye gutemba ku murima ${schedule.plotCode}. Baza umukoresha w'umuyoboro.`;
      break;
    case 'COMPLETED':
      titleEn = `Irrigation Completed: ${schedule.plotCode}`;
      msgEn = `Water delivery complete for ${schedule.plotCode}. Recorded volume: ${schedule.actualVolumeM3 || schedule.plannedVolumeM3}m3. Thank you.`;
      titleRw = `Kuhira Byarangiye: ${schedule.plotCode}`;
      msgRw = `Guhira murima ${schedule.plotCode} birangiye. Amazi yapimwe: ${schedule.actualVolumeM3 || schedule.plannedVolumeM3}m3. Murakoze.`;
      break;
    case 'INTERRUPTED':
      titleEn = `Water Delivery Interrupted: ${schedule.plotCode}`;
      msgEn = `Notice: Irrigation for ${schedule.plotCode} was interrupted (${schedule.interruptionReason || 'System pressure drop'}). Support team notified.`;
      titleRw = `Guhira Byagize Ikibazo: ${schedule.plotCode}`;
      msgRw = `Incamake: Kuhira kuri ${schedule.plotCode} bihagaritswe (${schedule.interruptionReason || 'Igabanuka ry\'igipimo'}). Ekipi y\'abatekinisiye irabikurikirana.`;
      break;
    default:
      titleEn = `Schedule Updated: ${schedule.scheduleCode}`;
      msgEn = `Your irrigation schedule ${schedule.scheduleCode} status changed to ${newStatus}.`;
      titleRw = `Iteganyamazi Ryahinduwe: ${schedule.scheduleCode}`;
      msgRw = `Igihe cyawe cyo kuhira ${schedule.scheduleCode} gihindutse ${newStatus}.`;
      break;
  }

  return {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    scheduleId: schedule.id,
    farmerId: schedule.farmerId,
    farmerPhone: schedule.farmerPhone || '+250788000000',
    language: 'rw',
    title: `${titleRw} / ${titleEn}`,
    message: `${msgRw}\n\n[EN]: ${msgEn}`,
    status: 'SENT',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks if two date-time ISO interval ranges overlap.
 */
export function doIntervalsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && e1 > s2;
}

/**
 * Finds all existing active schedules on the same plot that overlap in time with the candidate schedule.
 */
export function findScheduleConflicts(
  candidate: { plotId: string; plannedStartTime: string; plannedEndTime: string; id?: string },
  existingSchedules: any[]
): any[] {
  return existingSchedules.filter((s) => {
    if (s.id && candidate.id && s.id === candidate.id) return false;
    if (s.status === 'CANCELLED') return false;
    if (s.plotId !== candidate.plotId) return false;
    return doIntervalsOverlap(
      candidate.plannedStartTime,
      candidate.plannedEndTime,
      s.plannedStartTime,
      s.plannedEndTime
    );
  });
}

/**
 * Validates whether a state transition from `from` to `to` is allowed in the scheduling workflow.
 */
export function isValidScheduleStateTransition(
  from: WaterScheduleStatus,
  to: WaterScheduleStatus
): boolean {
  const allowedTransitions: Record<WaterScheduleStatus, WaterScheduleStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['APPROVED', 'CANCELLED'],
    APPROVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'INTERRUPTED', 'CANCELLED'],
    INTERRUPTED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  const allowed = allowedTransitions[from] || [];
  return allowed.includes(to);
}

/**
 * Checks if a requested flow rate exceeds the maximum pump capacity.
 */
export function checkPumpCapacityViolation(
  requestedM3h: number,
  maxCapacityM3h: number = 500
): boolean {
  return requestedM3h > maxCapacityM3h;
}

