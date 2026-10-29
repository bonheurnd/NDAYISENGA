import React, { useState, useMemo } from 'react';
import {
  Droplets,
  Wrench,
  Receipt,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Activity,
  Sparkles,
} from 'lucide-react';
import type { WaterSchedule, WorkOrder, Payment, Language, IrrigationQuickLog } from '../types/index.ts';

export interface RecentActivityFeedProps {
  schedules: WaterSchedule[];
  workOrders: WorkOrder[];
  payments: Payment[];
  quickLogs?: IrrigationQuickLog[];
  language: Language;
  onNavigate: (tab: string) => void;
  maxItems?: number;
}

export type ActivityCategory = 'ALL' | 'QUICK_LOG' | 'SCHEDULE' | 'MAINTENANCE' | 'PAYMENT';

interface UnifiedActivityItem {
  id: string;
  category: 'QUICK_LOG' | 'SCHEDULE' | 'MAINTENANCE' | 'PAYMENT';
  title: string;
  subtitle: string;
  timestampISO: string;
  displayTime: string;
  statusLabel: string;
  statusBadgeClass: string;
  amountOrMetric?: string;
  targetTab: string;
  actorName: string;
  requiresFollowup?: boolean;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  schedules,
  workOrders = [],
  payments,
  quickLogs = [],
  language,
  onNavigate,
  maxItems = 8,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('ALL');

  // Convert disparate items into a unified timeline sorted descending by timestamp
  const unifiedActivities = useMemo(() => {
    const items: UnifiedActivityItem[] = [];

    // 0. Quick Logs Activities
    quickLogs.forEach((ql) => {
      const isRw = language === 'rw';
      let statusBadgeClass = 'bg-slate-50 text-slate-700 border-slate-200';
      if (ql.irrigationStatus === 'COMPLETED_SUCCESSFULLY') {
        statusBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      } else if (ql.irrigationStatus === 'IN_PROGRESS') {
        statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      } else if (ql.irrigationStatus === 'INTERRUPTED' || ql.irrigationStatus === 'PROBLEM_REPORTED') {
        statusBadgeClass = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
      }

      const timeStr = ql.createdAt
        ? new Date(ql.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : ql.reportDate;

      items.push({
        id: `act-ql-${ql.id}`,
        category: 'QUICK_LOG',
        title: `Quick Log · ${ql.blockCode}`,
        subtitle: ql.problemDescription
          ? `Problem: ${ql.problemDescription}`
          : ql.notes || (isRw ? 'Raporo yihuse yaguzwe neza' : 'Field status report submitted'),
        timestampISO: ql.createdAt || `${ql.reportDate}T08:00:00Z`,
        displayTime: timeStr,
        statusLabel: ql.irrigationStatus.replace('_', ' '),
        statusBadgeClass,
        amountOrMetric: ql.waterVolumeM3 ? `${ql.waterVolumeM3} m³` : ql.irrigationStatus,
        targetTab: 'dashboard',
        actorName: `${ql.reportedBy} (${ql.reporterRole})`,
        requiresFollowup: ql.requiresFollowup,
      });
    });

    // 1. Water Schedule Activities
    schedules.forEach((s) => {
      const isRw = language === 'rw';
      let statusBadgeClass = 'bg-sky-50 text-sky-700 border-sky-200';
      if (s.status === 'COMPLETED') statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      if (s.status === 'IN_PROGRESS') statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
      if (s.status === 'INTERRUPTED') statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';

      const timeStr = s.plannedStartTime
        ? new Date(s.plannedStartTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';

      items.push({
        id: `act-sch-${s.id}`,
        category: 'SCHEDULE',
        title: `${s.scheduleCode} · ${s.plotCode}`,
        subtitle: isRw
          ? `Iteganyamazi ryo kuhira mu kigo ${s.plotCode} rya ${s.farmerName}`
          : `Irrigation slot scheduled for plot ${s.plotCode} (${s.farmerName})`,
        timestampISO: s.plannedStartTime || new Date().toISOString(),
        displayTime: timeStr,
        statusLabel: s.status,
        statusBadgeClass,
        amountOrMetric: `${s.plannedVolumeM3} m³`,
        targetTab: 'schedules',
        actorName: s.farmerName || 'Member',
      });
    });

    // 2. Maintenance Work Order Activities
    workOrders.forEach((wo) => {
      const isRw = language === 'rw';
      let statusBadgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      if (wo.status === 'COMPLETED' || wo.status === 'VERIFIED') {
        statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      } else if (wo.priority === 'EMERGENCY' || wo.priority === 'HIGH') {
        statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      }

      const timeStr = wo.reportedDate
        ? new Date(wo.reportedDate).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';

      items.push({
        id: `act-wo-${wo.id}`,
        category: 'MAINTENANCE',
        title: `${wo.workOrderNumber} · ${wo.equipmentCode}`,
        subtitle: isRw
          ? `Gusana icyuma ${wo.equipmentName}: ${wo.title}`
          : `Maintenance ticket for ${wo.equipmentName}: ${wo.title}`,
        timestampISO: wo.reportedDate || new Date().toISOString(),
        displayTime: timeStr,
        statusLabel: `${wo.priority} / ${wo.status}`,
        statusBadgeClass,
        amountOrMetric: `${wo.downtimeHours}h downtime`,
        targetTab: 'maintenance',
        actorName: wo.assignedTechnicianName || 'Maintenance Tech',
      });
    });

    // 3. Payment Receipts
    payments.forEach((p) => {
      const isRw = language === 'rw';
      const timeStr = p.recordedAt
        ? new Date(p.recordedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Recent';

      const methodLabel = p.paymentMethod.replace('_', ' ');

      items.push({
        id: `act-pay-${p.id}`,
        category: 'PAYMENT',
        title: `${p.receiptNumber} · ${p.invoiceNumber}`,
        subtitle: isRw
          ? `Ubwishyu bwemewe bwa ${p.farmerName} binyuze kuri ${methodLabel}`
          : `Verified water fee deposit from ${p.farmerName} via ${methodLabel}`,
        timestampISO: p.recordedAt || new Date().toISOString(),
        displayTime: timeStr,
        statusLabel: 'VERIFIED',
        statusBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        amountOrMetric: `${p.amountRwf.toLocaleString()} RWF`,
        targetTab: 'billing',
        actorName: p.farmerName || 'Payer',
      });
    });

    // Sort descending by ISO timestamp
    return items.sort((a, b) => new Date(b.timestampISO).getTime() - new Date(a.timestampISO).getTime());
  }, [schedules, workOrders, payments, language]);

  // Filter based on active category tab
  const filteredActivities = useMemo(() => {
    if (selectedCategory === 'ALL') return unifiedActivities.slice(0, maxItems);
    return unifiedActivities.filter((a) => a.category === selectedCategory).slice(0, maxItems);
  }, [unifiedActivities, selectedCategory, maxItems]);

  const categoryCounts = useMemo(() => {
    return {
      ALL: unifiedActivities.length,
      SCHEDULE: unifiedActivities.filter((a) => a.category === 'SCHEDULE').length,
      MAINTENANCE: unifiedActivities.filter((a) => a.category === 'MAINTENANCE').length,
      PAYMENT: unifiedActivities.filter((a) => a.category === 'PAYMENT').length,
      QUICK_LOG: unifiedActivities.filter((a) => a.category === 'QUICK_LOG').length,
    };
  }, [unifiedActivities]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'rw' ? 'Ibikorwa Bya Hafi Aha' : 'Recent Scheme Activity Feed'}
            </h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE FEED</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'rw'
              ? 'Ibipimo by\'amazi, ibikorwa byo gusana no kwishyura inyemezabwishyu'
              : 'Real-time telemetry stream of water allocations, equipment repairs, and verified deposits'}
          </p>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
          {(['ALL', 'SCHEDULE', 'MAINTENANCE', 'PAYMENT', 'QUICK_LOG'] as ActivityCategory[]).map((cat) => {
            let label = 'All';
            if (cat === 'SCHEDULE') label = language === 'rw' ? 'Kuhira' : 'Schedules';
            if (cat === 'MAINTENANCE') label = language === 'rw' ? 'Gusana' : 'Maintenance';
            if (cat === 'PAYMENT') label = language === 'rw' ? 'Ubwishyu' : 'Payments';
            if (cat === 'QUICK_LOG') label = language === 'rw' ? 'Raporo' : 'Quick Logs';

            const count = categoryCounts[cat];

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                    selectedCategory === cat ? 'bg-slate-100 text-slate-900 font-bold' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-slate-100">
        {filteredActivities.map((item) => {
          let IconComponent = Droplets;
          let iconContainerClass = 'bg-sky-100 text-sky-700 border-sky-200';

          if (item.category === 'MAINTENANCE') {
            IconComponent = Wrench;
            iconContainerClass = 'bg-amber-100 text-amber-700 border-amber-200';
          } else if (item.category === 'PAYMENT') {
            IconComponent = CreditCard;
            iconContainerClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
          }

          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.targetTab)}
              className="py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/80 p-2 rounded-xl transition cursor-pointer group"
            >
              {/* Left Column: Category Icon & Details */}
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl border ${iconContainerClass} shrink-0 mt-0.5 shadow-2xs`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {item.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${item.statusBadgeClass}`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-snug truncate">
                    {item.subtitle}
                  </p>

                  {/* Unboxed Metadata Line with Bullet Separators */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{item.actorName}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.displayTime}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount / Metric & Arrow Action */}
              <div className="flex items-center gap-3 shrink-0 text-right">
                {item.amountOrMetric && (
                  <div className="text-right">
                    <span className="block font-mono font-bold text-xs text-slate-900 tabular-nums">
                      {item.amountOrMetric}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                  </div>
                )}
                <div className="p-1 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="py-10 text-center text-slate-500 text-xs">
            {language === 'rw'
              ? 'Nta gikorwa kigaragara muri iki kiciro'
              : 'No recent activity recorded for this category filter.'}
          </div>
        )}
      </div>

      {/* Footer link to jump to full audits / reports */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="text-[11px]">
          {language === 'rw'
            ? 'Ibikorwa byose biratunganywa binyuze muri sisitemu ya GFI Nasho 1'
            : 'All events strictly audited and mirrored to Lake Nasho system logs'}
        </span>
        <button
          onClick={() => onNavigate('reports')}
          className="font-semibold text-sky-700 hover:text-sky-800 transition flex items-center gap-1"
        >
          <span>{language === 'rw' ? 'Reba Raporo Zose →' : 'View Full Audit Trail →'}</span>
        </button>
      </div>
    </div>
  );
};
