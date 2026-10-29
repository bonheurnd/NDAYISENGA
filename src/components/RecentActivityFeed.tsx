import React, { useMemo, useState } from 'react';
import {
  Droplets,
  Wrench,
  CreditCard,
  ChevronRight,
  Clock,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import type { WaterSchedule, WorkOrder, Payment, Language, IrrigationQuickLog } from '../types/index.ts';

interface ActivityItem {
  id: string;
  category: 'SCHEDULE' | 'MAINTENANCE' | 'PAYMENT' | 'QUICK_LOG';
  title: string;
  subtitle: string;
  timestampISO: string;
  displayTime: string;
  statusLabel: string;
  statusBadgeClass: string;
  amountOrMetric?: string;
  targetTab: string;
  actorName: string;
}

type ActivityCategory = 'ALL' | 'SCHEDULE' | 'MAINTENANCE' | 'PAYMENT' | 'QUICK_LOG';

interface RecentActivityFeedProps {
  schedules: WaterSchedule[];
  workOrders: WorkOrder[];
  payments: Payment[];
  quickLogs?: IrrigationQuickLog[];
  language: Language;
  onNavigate: (tab: string) => void;
  maxItems?: number;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  schedules,
  workOrders,
  payments,
  quickLogs = [],
  language,
  onNavigate,
  maxItems = 6,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('ALL');

  // Convert raw domain objects into unified timeline feed
  const unifiedActivities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Map Quick Logs
    quickLogs.forEach((ql) => {
      items.push({
        id: `ql-${ql.id}`,
        category: 'QUICK_LOG',
        title: `Quick Log · ${ql.blockCode}`,
        subtitle: ql.problemDescription
          ? `Problem: ${ql.problemDescription}`
          : ql.notes
          ? ql.notes
          : `Irrigation Status: ${ql.irrigationStatus}`,
        timestampISO: ql.createdAt || new Date().toISOString(),
        displayTime: new Date(ql.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        statusLabel: ql.requiresFollowup ? 'FOLLOW-UP NEEDED' : ql.irrigationStatus,
        statusBadgeClass: ql.requiresFollowup
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
        amountOrMetric: ql.waterVolumeM3 ? `${ql.waterVolumeM3} m³` : undefined,
        targetTab: 'dashboard',
        actorName: `${ql.reportedBy} (${ql.reporterRole})`,
      });
    });

    // Map Schedules
    schedules.forEach((s) => {
      let badgeClass = 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200';
      if (s.status === 'COMPLETED') badgeClass = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
      if (s.status === 'IN_PROGRESS') badgeClass = 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200';
      if (s.status === 'INTERRUPTED' || s.status === 'CANCELLED') badgeClass = 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200';

      items.push({
        id: `sched-${s.id}`,
        category: 'SCHEDULE',
        title: `Water Shift · ${s.plotCode}`,
        subtitle: `${s.farmerName} · Planned Volume: ${s.plannedVolumeM3} m³`,
        timestampISO: s.plannedStartTime,
        displayTime: new Date(s.plannedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        statusLabel: s.status.replace('_', ' '),
        statusBadgeClass: badgeClass,
        amountOrMetric: `${s.plannedVolumeM3} m³`,
        targetTab: 'schedules',
        actorName: s.approvedBy ? `Approved na ${s.approvedBy}` : 'Scheduled Allocation',
      });
    });

    // Map Work Orders
    workOrders.forEach((w) => {
      let badgeClass = 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200';
      if (w.status === 'COMPLETED') badgeClass = 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';
      if (w.status === 'IN_PROGRESS') badgeClass = 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200';

      items.push({
        id: `wo-${w.id}`,
        category: 'MAINTENANCE',
        title: `${w.title} (${w.equipmentCode})`,
        subtitle: w.description,
        timestampISO: w.reportedDate || new Date().toISOString(),
        displayTime: new Date(w.reportedDate || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        statusLabel: w.status.replace('_', ' '),
        statusBadgeClass: badgeClass,
        amountOrMetric: w.estimatedCostRwf ? `${(w.estimatedCostRwf / 1000).toFixed(0)}k RWF` : 'Inspected',
        targetTab: 'maintenance',
        actorName: w.assignedTechnicianName || 'Unassigned Tech',
      });
    });

    // Map Payments
    payments.forEach((p) => {
      items.push({
        id: `pay-${p.id}`,
        category: 'PAYMENT',
        title: `MoMo Deposit · ${p.paymentMethod || 'MTN MoMo'}`,
        subtitle: `Ref: ${p.transactionReference || p.receiptNumber} · Invoice #${p.invoiceNumber || p.invoiceId || 'DIRECT'}`,
        timestampISO: p.recordedAt || new Date().toISOString(),
        displayTime: new Date(p.recordedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        statusLabel: 'VERIFIED',
        statusBadgeClass: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200',
        amountOrMetric: `${p.amountRwf.toLocaleString()} RWF`,
        targetTab: 'billing',
        actorName: p.farmerName || 'Payer',
      });
    });

    // Sort descending by ISO timestamp
    return items.sort((a, b) => new Date(b.timestampISO).getTime() - new Date(a.timestampISO).getTime());
  }, [schedules, workOrders, payments, quickLogs, language]);

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
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs space-y-4 transition-colors">
      {/* Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'rw' ? 'Ibikorwa Bya Hafi Aha' : 'Recent Scheme Activity Feed'}
            </h2>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE FEED</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {language === 'rw'
              ? 'Ibipimo by\'amazi, ibikorwa byo gusana no kwishyura inyemezabwishyu'
              : 'Real-time telemetry stream of water allocations, equipment repairs, and verified deposits'}
          </p>
        </div>

        {/* Category Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs overflow-x-auto">
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
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                    selectedCategory === cat
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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
      <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
        {filteredActivities.map((item) => {
          let IconComponent = Droplets;
          let iconContainerClass = 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';

          if (item.category === 'MAINTENANCE') {
            IconComponent = Wrench;
            iconContainerClass = 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
          } else if (item.category === 'PAYMENT') {
            IconComponent = CreditCard;
            iconContainerClass = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
          } else if (item.category === 'QUICK_LOG') {
            IconComponent = ClipboardList;
            iconContainerClass = 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
          }

          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.targetTab)}
              className="py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 p-2 rounded-xl transition cursor-pointer group"
            >
              {/* Left Column: Category Icon & Details */}
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl border ${iconContainerClass} shrink-0 mt-0.5 shadow-2xs`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono border ${item.statusBadgeClass}`}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug truncate">
                    {item.subtitle}
                  </p>

                  {/* Unboxed Metadata Line with Bullet Separators */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{item.actorName}</span>
                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      <span>{item.displayTime}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Amount / Metric & Arrow Action */}
              <div className="flex items-center gap-3 shrink-0 text-right">
                {item.amountOrMetric && (
                  <div className="text-right">
                    <span className="block font-mono font-bold text-xs text-slate-900 dark:text-white tabular-nums">
                      {item.amountOrMetric}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                      {item.category}
                    </span>
                  </div>
                )}
                <div className="p-1 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
