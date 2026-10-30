import type { Plot, WaterSchedule } from '../../types/index.ts';

export type PlotScheduleStatusCode =
  | 'IN_PROGRESS'  // Blue: Kuhira birakomeje
  | 'UPCOMING font-bold'     // Amber: Gahunda irategerejwe
  | 'SCHEDULED shadow-xs'    // Green: Gahariwe gahunda yo kuhira
  | 'INTERRUPTED'  // Red: Gahunda yahagaritswe
  | 'NO_SCHEDULE'; // Gray: Nta gahunda yo kuhira

export interface PlotScheduleStatusInfo {
  code: PlotScheduleStatusCode;
  labelRw: string;
  labelEn: string;
  badgeBg: string;
  dotBg: string;
  textColor: string;
  matchedSchedule?: WaterSchedule;
}

export function isValidGpsCoordinate(lat?: number, lng?: number): boolean {
  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return false;
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }
  if (isNaN(lat) || isNaN(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function formatGpsCoordinate(val: number): string {
  return val >= 0 ? `+${val.toFixed(6)}` : val.toFixed(6);
}

export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function getPlotScheduleStatus(
  plot: Plot,
  schedules: WaterSchedule[],
  nowMs: number = Date.now()
): PlotScheduleStatusInfo {
  // Find all schedules associated with this plot
  const plotSchedules = schedules.filter(
    (s) => s.plotId === plot.id || s.plotCode === plot.plotCode
  );

  if (plotSchedules.length === 0) {
    return {
      code: 'NO_SCHEDULE',
      labelRw: 'Nta gahunda yo kuhira',
      labelEn: 'No Irrigation Schedule',
      badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
      dotBg: 'bg-slate-400',
      textColor: 'text-slate-700 dark:text-slate-300',
    };
  }

  // Check 1: In progress schedule
  const inProgressSched = plotSchedules.find((s) => {
    if (s.status === 'IN_PROGRESS') return true;
    const start = new Date(s.plannedStartTime).getTime();
    const end = new Date(s.plannedEndTime).getTime();
    return (s.status === 'APPROVED' || s.status === 'SUBMITTED') && nowMs >= start && nowMs <= end;
  });

  if (inProgressSched) {
    return {
      code: 'IN_PROGRESS',
      labelRw: 'Kuhira birakomeje',
      labelEn: 'Irrigation In Progress',
      badgeBg: 'bg-sky-100 dark:bg-sky-950/90 border-sky-300 dark:border-sky-700 font-bold',
      dotBg: 'bg-sky-500 animate-pulse',
      textColor: 'text-sky-900 dark:text-sky-200',
      matchedSchedule: inProgressSched,
    };
  }

  // Check 2: Interrupted or Cancelled
  const interruptedSched = plotSchedules.find(
    (s) => s.status === 'INTERRUPTED' || s.status === 'CANCELLED'
  );

  if (interruptedSched) {
    return {
      code: 'INTERRUPTED',
      labelRw: 'Gahunda yahagaritswe',
      labelEn: 'Schedule Interrupted / Cancelled',
      badgeBg: 'bg-rose-100 dark:bg-rose-950/90 border-rose-300 dark:border-rose-700 font-bold',
      dotBg: 'bg-rose-500',
      textColor: 'text-rose-900 dark:text-rose-200',
      matchedSchedule: interruptedSched,
    };
  }

  // Check 3: Upcoming future schedule
  const upcomingSched = plotSchedules
    .filter((s) => ['APPROVED', 'SUBMITTED', 'DRAFT'].includes(s.status))
    .sort((a, b) => new Date(a.plannedStartTime).getTime() - new Date(b.plannedStartTime).getTime())
    .find((s) => new Date(s.plannedStartTime).getTime() > nowMs);

  if (upcomingSched) {
    return {
      code: 'UPCOMING font-bold',
      labelRw: 'Gahunda irategerejwe',
      labelEn: 'Upcoming Scheduled Delivery',
      badgeBg: 'bg-amber-100 dark:bg-amber-950/90 border-amber-300 dark:border-amber-700 font-bold',
      dotBg: 'bg-amber-500',
      textColor: 'text-amber-900 dark:text-amber-200',
      matchedSchedule: upcomingSched,
    };
  }

  // Check 4: Approved/Scheduled
  const validApprovedSched = plotSchedules.find((s) => s.status === 'APPROVED');
  if (validApprovedSched) {
    return {
      code: 'SCHEDULED shadow-xs',
      labelRw: 'Gahariwe gahunda yo kuhira',
      labelEn: 'Scheduled Water Delivery',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-700 font-bold',
      dotBg: 'bg-emerald-500',
      textColor: 'text-emerald-900 dark:text-emerald-200',
      matchedSchedule: validApprovedSched,
    };
  }

  // Fallback
  return {
    code: 'NO_SCHEDULE',
    labelRw: 'Nta gahunda yo kuhira',
    labelEn: 'No Active Schedule',
    badgeBg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    dotBg: 'bg-slate-400',
    textColor: 'text-slate-700 dark:text-slate-300',
    matchedSchedule: plotSchedules[0],
  };
}
