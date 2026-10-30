import React, { useState } from 'react';
import {
  Users,
  Grid3X3,
  Calendar,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  Wrench,
  TrendingUp,
  Info,
  Droplets,
  ClipboardList,
  PlusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { Language, SchemeMetrics, WaterSchedule, Invoice, Payment, WorkOrder, IrrigationQuickLog, Plot, UserRole } from '../types/index.ts';
import { RecentActivityFeed } from './RecentActivityFeed.tsx';
import { IrrigationCalendar } from './IrrigationCalendar.tsx';
import { QuickLogModal } from './QuickLogModal.tsx';
import { hasPermission } from '../lib/logic/permissions.ts';

interface DashboardViewProps {
  metrics: SchemeMetrics;
  schedules: WaterSchedule[];
  invoices: Invoice[];
  payments: Payment[];
  workOrders?: WorkOrder[];
  quickLogs?: IrrigationQuickLog[];
  plots?: Plot[];
  currentRole?: UserRole;
  language: Language;
  onNavigate: (tab: string) => void;
  onSubmitQuickLog?: (data: Partial<IrrigationQuickLog>) => Promise<{
    success: boolean;
    log?: IrrigationQuickLog;
    isDuplicate?: boolean;
    message?: string;
    error?: string;
  }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  schedules,
  invoices,
  payments,
  workOrders = [],
  quickLogs = [],
  plots = [],
  currentRole,
  language,
  onNavigate,
  onSubmitQuickLog,
}) => {
  const [selectedSeason, setSelectedSeason] = useState('2026A');
  const [showQuickLogModal, setShowQuickLogModal] = useState(false);

  const canSubmitQuickLog = currentRole ? hasPermission(currentRole, 'SUBMIT_QUICK_LOG') : false;

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalRwf, 0);
  const totalCollected = payments.reduce((sum, p) => sum + p.amountRwf, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Calculate schedules today
  const todayStr = new Date().toISOString().split('T')[0];
  const scheduledTodayCount = schedules.filter((s) => {
    const sDate = new Date(s.plannedStartTime).toISOString().split('T')[0];
    return sDate === todayStr || s.status === 'IN_PROGRESS' || s.status === 'APPROVED';
  }).length;

  const completedTodayCount = schedules.filter((s) => s.status === 'COMPLETED').length;

  // Africa/Kigali current date string for display
  const kigaliDateFormatted = new Intl.DateTimeFormat(language === 'rw' ? 'rw-RW' : 'en-US', {
    timeZone: 'Africa/Kigali',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Mandatory Demo Data Notice Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mr-2">
            [DEMO DATA NOTICE]
          </span>
          {language === 'rw'
            ? 'Imibare yose igaragara hano ni iy\'icyitegererezo (DEMO). Politiki z\'amazi za GFI Nasho 1 mu Karere ka Kirehe, imirima, abanyamuryango n\'ibiciro byo kuhira bigomba kubanza kwemezwa n\'ubuyobozi mbere yo gutangiza ku mugaragaro.'
            : 'All statistics, farmer profiles, tariffs, and schedules shown below are simulated demonstration data. Operational policies, farmer rolls, block dimensions, and water tariffs must be verified with GFI Nasho 1 management before production.'}
        </div>
      </div>

      {/* Hero Welcome Banner with Agricultural Backdrop Image */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border border-emerald-900/20 bg-emerald-950 text-white min-h-[160px] flex items-center">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0 opacity-35 bg-cover bg-center mix-blend-luminosity" style={{ backgroundImage: `url('/src/assets/images/nasho_center_pivot_1793211206727.jpg')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/90 to-emerald-900/70 z-0" />

        {/* Content Overlay */}
        <div className="relative z-10 p-6 sm:p-8 w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Umuryango w’Abakoresha Amazi (WUO) · Kirehe, Rwanda</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {language === 'rw'
                ? 'Murakaza neza muri GFI Nasho 1 — Imicungire ya gahunda yo kuhira n\'abakoresha amazi.'
                : 'Welcome to GFI Nasho 1 — Irrigation Scheme & Water Users Organization'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{kigaliDateFormatted}</span>
              <span>•</span>
              <span>Season {selectedSeason}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {canSubmitQuickLog && (
              <button
                onClick={() => setShowQuickLogModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md transition-colors cursor-pointer"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Quick Log — Andika Raporo</span>
              </button>
            )}

            <div className="flex items-center gap-2 bg-emerald-900/80 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs">
              <label htmlFor="season-select" className="text-emerald-200 font-medium whitespace-nowrap">
                {language === 'rw' ? 'Igihe:' : 'Season:'}
              </label>
              <select
                id="season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-hidden cursor-pointer"
              >
                <option value="2026A" className="bg-emerald-950 text-white">Season 2026A</option>
                <option value="2025B" className="bg-emerald-950 text-white">Season 2025B</option>
                <option value="ALL" className="bg-emerald-950 text-white">All Seasons</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Summary Cards (6 High-Impact Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Active Farmers */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs transition hover:border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'rw' ? 'Abahinzi Bakora' : 'Active Farmers'}
            </span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.activeFarmers}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Registered WUO members
          </div>
        </div>

        {/* Card 2: Active Blocks */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs transition hover:border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'rw' ? 'Imirima / Pivo' : 'Active Blocks'}
            </span>
            <Grid3X3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.registeredPlots}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across 3 Pivot Blocks
          </div>
        </div>

        {/* Card 3: Scheduled Today */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs transition hover:border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'rw' ? 'Guhira ku wa Leo' : 'Scheduled Today'}
            </span>
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {scheduledTodayCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active water delivery cycles
          </div>
        </div>

        {/* Card 4: Completed Today */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs transition hover:border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'rw' ? 'Yarangiye' : 'Completed Cycles'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {completedTodayCount}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Verified completed runs
          </div>
        </div>

        {/* Card 5: Outstanding Balance */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs transition hover:border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'rw' ? 'Ibirarane' : 'Outstanding Dues'}
            </span>
            <Receipt className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {(metrics.outstandingInvoicesRwf / 1000).toFixed(0)}k <span className="text-xs font-semibold">RWF</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Unsettled seasonal levies
          </div>
        </div>

        {/* Card 6: Open Maintenance */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs transition hover:border-emerald-500">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {language === 'rw' ? 'Gusana Gukorwa' : 'Open Maintenance'}
            </span>
            <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {metrics.openMaintenanceJobs}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active repair work orders
          </div>
        </div>
      </div>

      {/* Operational Quick Action Shortcuts Strip */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{language === 'rw' ? 'Njyaho Yihuse (Quick Shortcuts)' : 'Operational Quick Shortcuts'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onNavigate('schedules')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 rounded-xl transition text-left cursor-pointer group"
          >
            <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'rw' ? 'Gutegeka Amazi' : 'Schedule Water'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Add delivery cycle</div>
            </div>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('irrigation-calendar');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-sky-300 rounded-xl transition text-left cursor-pointer group"
          >
            <div className="p-2 bg-sky-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'rw' ? 'Reba Kalendari' : 'View Calendar'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">See 7-day schedule</div>
            </div>
          </button>

          {canSubmitQuickLog && (
            <button
              onClick={() => setShowQuickLogModal(true)}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 rounded-xl transition text-left cursor-pointer group"
            >
              <div className="p-2 bg-amber-600 text-white rounded-lg group-hover:scale-105 transition-transform">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {language === 'rw' ? 'Quick Log' : 'Quick Log'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Field status report</div>
              </div>
            </button>
          )}

          <button
            onClick={() => onNavigate('farmers')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-300 rounded-xl transition text-left cursor-pointer group"
          >
            <div className="p-2 bg-emerald-700 text-white rounded-lg group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'rw' ? 'Kwandika Umuhinzi' : 'Register Farmer'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Add WUO member</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('maintenance')}
            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 rounded-xl transition text-left cursor-pointer group"
          >
            <div className="p-2 bg-rose-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'rw' ? 'Ibibazo by\'Ibyuma' : 'Maintenance'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Pivot work orders</div>
            </div>
          </button>
        </div>
      </div>

      {/* PROMINENT COMPACT IRRIGATION CALENDAR COMPONENT */}
      <div id="irrigation-calendar">
        <IrrigationCalendar
          schedules={schedules}
          language={language}
          onNavigate={onNavigate}
        />
      </div>

      {/* Real-Time Recent Activity Feed & Financial Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-Time Recent Activity Feed Component */}
        <RecentActivityFeed
          schedules={schedules}
          workOrders={workOrders}
          payments={payments}
          quickLogs={quickLogs}
          language={language}
          onNavigate={onNavigate}
          maxItems={6}
        />

        {/* Financial Revenue Collection & Reconciliation Health */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'rw'
                    ? 'Ubwishyu bwakiriwe n\'Ibirarane (WUO Levy Reconciliation)'
                    : 'Revenue Collection & Financial Reconciliation'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Seasonal water levy recovery rate
                </p>
              </div>
              <button
                onClick={() => onNavigate('billing')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer flex items-center gap-1"
              >
                <span>View Invoices</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                <span>Seasonal Levy Collection Progress</span>
                <span className="font-mono text-slate-900 dark:text-white">{collectionRate}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-600 dark:bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono tabular-nums">
                <span>Collected: {totalCollected.toLocaleString()} RWF</span>
                <span>Invoiced: {totalInvoiced.toLocaleString()} RWF</span>
              </div>
            </div>

            {/* Tariff and payment rules breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Center Pivot Seasonal Tariff</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">45,000 RWF / Ha</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-600 dark:text-slate-400 font-medium">WUO Infrastructure Levy</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-200">5,000 RWF / Ha</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Mobile Money Code</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">MTN MoMo (*182#)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Log Modal */}
      <QuickLogModal
        isOpen={showQuickLogModal}
        onClose={() => setShowQuickLogModal(false)}
        plots={plots}
        language={language}
        onSubmitLog={onSubmitQuickLog}
      />
    </div>
  );
};
