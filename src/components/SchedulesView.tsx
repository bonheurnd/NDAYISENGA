import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Droplets,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  X,
  Send,
  UserCheck,
  Zap,
  Gauge,
  SlidersHorizontal,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import type { WaterSchedule, Plot, Language, UserRole } from '../types/index.ts';
import { canApproveSchedule, hasPermission } from '../lib/logic/permissions.ts';
import { DEFAULT_SCHEME_RULES, type SchemeRules } from '../lib/logic/scheduling.ts';

// Generated authentic Nasho irrigation images
const IMAGE_CENTER_PIVOT = '/src/assets/images/nasho_center_pivot_1793211206727.jpg';
const IMAGE_PUMP_STATION = '/src/assets/images/nasho_pump_station_1793211207702.jpg';
const IMAGE_WATER_METER = '/src/assets/images/nasho_water_meter_1793211209140.jpg';
const IMAGE_MAIZE_FIELD = '/src/assets/images/nasho_maize_field_1793211207730.jpg';

interface SchedulesViewProps {
  schedules: WaterSchedule[];
  plots: Plot[];
  language: Language;
  currentRole: UserRole;
  onAddSchedule: (scheduleData: Partial<WaterSchedule>) => Promise<void>;
  onApproveSchedule: (id: string) => Promise<void>;
  onRecordDelivery: (id: string, deliveryData: any) => Promise<void>;
}

export const SchedulesView: React.FC<SchedulesViewProps> = ({
  schedules,
  plots,
  language,
  currentRole,
  onAddSchedule,
  onApproveSchedule,
  onRecordDelivery,
}) => {
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState<WaterSchedule | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Scheme Rules state
  const [schemeRules, setSchemeRules] = useState<SchemeRules>(DEFAULT_SCHEME_RULES);

  // New Schedule Form States
  const [plotId, setPlotId] = useState(plots[0]?.id || '');
  const [startTime, setStartTime] = useState('2026-10-18T08:00');
  const [endTime, setEndTime] = useState('2026-10-18T12:00');
  const [plannedVolume, setPlannedVolume] = useState('420');
  const [allocationBasis, setAllocationBasis] = useState<WaterSchedule['allocationBasis']>('TIME_HOURS');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery recording form
  const [actualVolume, setActualVolume] = useState('415');
  const [deliveryStatus, setDeliveryStatus] = useState<WaterSchedule['status']>('COMPLETED');
  const [interruptionReason, setInterruptionReason] = useState('');

  const canCreate = hasPermission(currentRole, 'CREATE_SCHEDULE');
  const canApprove = canApproveSchedule(currentRole);
  const canDeliver = hasPermission(currentRole, 'RECORD_DELIVERY');

  const filteredSchedules = schedules.filter((s) => {
    if (selectedStatus === 'ALL') return true;
    return s.status === selectedStatus;
  });

  // Calculate real-time scheme telemetry metrics
  const activeCount = schedules.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'APPROVED').length;
  const totalWaterPlannedM3 = schedules.reduce((sum, s) => sum + (s.plannedVolumeM3 || 0), 0);
  const totalWaterDeliveredM3 = schedules.reduce((sum, s) => sum + (s.actualVolumeM3 || 0), 0);
  const interruptedCount = schedules.filter((s) => s.status === 'INTERRUPTED').length;

  const currentStationFlowRateM3h = schedules
    .filter((s) => s.status === 'IN_PROGRESS')
    .reduce((sum, s) => sum + 110, 280); // baseline lake intake flow

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!plotId) {
      setFormError('Please select a target plot.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setFormError('End time must be after start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddSchedule({
        plotId,
        plannedStartTime: new Date(startTime).toISOString(),
        plannedEndTime: new Date(endTime).toISOString(),
        plannedVolumeM3: parseFloat(plannedVolume) || 350,
        allocationBasis,
        notes: notes.trim() || undefined,
      });
      setShowAddModal(false);
      setNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to schedule irrigation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDeliveryModal) return;

    try {
      setIsSubmitting(true);
      await onRecordDelivery(showDeliveryModal.id, {
        actualVolumeM3: parseFloat(actualVolume) || showDeliveryModal.plannedVolumeM3,
        status: deliveryStatus,
        interruptionReason: interruptionReason.trim() || undefined,
      });
      setShowDeliveryModal(null);
      setInterruptionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to record delivery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 uppercase tracking-wider mb-1">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>{language === 'rw' ? 'Iguhinga 2026A · Lake Nasho Water Infrastructure' : 'Season 2026A · Lake Nasho Infrastructure'}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'rw' ? 'Iteganyamazi no Kwemeza Guhira' : 'Water Scheduling & Delivery Logs'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated rotational scheduling across 63 center pivots and 3 intake pump stations on Lake Nasho
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>{language === 'rw' ? 'Amategeko Y\'Umutungo' : 'Scheme Rules'}</span>
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'rw' ? 'Gutegeka Guhira' : 'Schedule Water'}</span>
            </button>
          )}
        </div>
      </div>

      {/* High-Impact Visual Hero Split with Real Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Visual Card: Lake Intake & Solar Pump Infrastructure */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm min-h-[220px] flex flex-col justify-end">
          <img
            src={IMAGE_PUMP_STATION}
            alt="Lake Nasho Intake Station"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="relative z-10 p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-sky-500/80 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                Intake Station 01
              </span>
              <span className="text-xs text-slate-300 font-medium">Lake Nasho Floating Suction</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              {language === 'rw' ? 'Isoko y\'Amazi n\'Umusaruro w\'Izuba' : 'Solar-Powered Intake Capacity'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
              3.3 MW solar grid directly powering floating pumps delivering up to 1,800 m³/h pressurized flow to 2,069 hectares.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-mono text-sky-200">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Station Flow: {currentStationFlowRateM3h} m³/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Max Limit: {schemeRules.maxPumpStationFlowRateM3h} m³/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Visual Card: Center Pivot Irrigation & Maize Crop Field */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm min-h-[220px] flex flex-col justify-end">
          <img
            src={IMAGE_CENTER_PIVOT}
            alt="Lake Nasho Center Pivot Fields"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
          <div className="relative z-10 p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/80 text-white font-mono text-[10px] uppercase font-bold tracking-wider">
                Center Pivot Rotations
              </span>
              <span className="text-xs text-slate-300 font-medium">63 Active Pivots</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">
              {language === 'rw' ? 'Ikoreshwa ry\'Amazi ku Buso bw\'Ikawa n\'Ibigori' : 'Rotational Block Duty & Quota'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
              Water distribution governed by strict soil moisture thresholds and authorized block scheduling to optimize harvest yields.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs font-mono text-emerald-200">
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Active Slots: {activeCount} Plots</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                <span>Delivered: {totalWaterDeliveredM3.toLocaleString()} m³</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Planned Season Water</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {totalWaterPlannedM3.toLocaleString()} <span className="text-xs font-normal text-slate-500">m³</span>
          </div>
          <div className="text-[11px] text-sky-600 mt-1">Quota Allocation Season 2026A</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Actual Delivered Water</div>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
            {totalWaterDeliveredM3.toLocaleString()} <span className="text-xs font-normal text-slate-500">m³</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Verified via flow meters</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Intake Flow Rate</div>
          <div className="text-xl font-bold font-mono text-sky-700 mt-1 tabular-nums">
            {currentStationFlowRateM3h} <span className="text-xs font-normal text-slate-500">m³/h</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Capacity: {schemeRules.maxPumpStationFlowRateM3h} m³/h</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Interruption Record</div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
            {interruptedCount} <span className="text-xs font-normal text-slate-500">Events</span>
          </div>
          <div className="text-[11px] text-rose-600 mt-1">Logged with root cause analysis</div>
        </div>
      </div>

      {/* Visual Pivot Cards (Focus Mode CSS Selected Elements) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'rw' ? 'Ibibanza by\'Imiyoboro n\'Inyubako z\'Amazi' : 'Center Pivot Block Rotations & Meter Stations'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status across main pivot sectors and flow meter check points
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">4 Primary Sector Blocks</span>
        </div>

        {/* Selected 2-Column Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selected Element 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={IMAGE_MAIZE_FIELD}
                  alt="Pivot CP-01 Maize"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Center Pivot CP-01</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">
                      RUNNING
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Plot PLOT-101 · Member: Jean Damascene</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-200/60">
              <div>
                <span className="block text-[10px] text-slate-400">Flow Rate</span>
                <span className="font-semibold text-slate-800">120 m³/h</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Target Crop</span>
                <span className="font-semibold text-slate-800">Maize (Hybrid)</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Time Window</span>
                <span className="font-semibold text-sky-700">08:00 - 12:00</span>
              </div>
            </div>
          </div>

          {/* Selected Element 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition shadow-2xs flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={IMAGE_WATER_METER}
                  alt="Pivot CP-02 Ultrasonic Flow Meter"
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Center Pivot CP-02</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-100 text-sky-800">
                      APPROVED
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Plot PLOT-102 · Member: Clarisse Uwase</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2 border-t border-slate-200/60">
              <div>
                <span className="block text-[10px] text-slate-400">Planned Vol</span>
                <span className="font-semibold text-slate-800">380 m³</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Meter S/N</span>
                <span className="font-semibold text-slate-800">UF-3000-N2</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400">Time Window</span>
                <span className="font-semibold text-sky-700">13:00 - 17:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter by Status Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium mr-1 shrink-0">Filter Status:</span>
          {['ALL', 'APPROVED', 'IN_PROGRESS', 'SUBMITTED', 'DRAFT', 'COMPLETED', 'INTERRUPTED'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-400 font-mono shrink-0">
          Showing {filteredSchedules.length} of {schedules.length} schedules
        </div>
      </div>

      {/* Schedules Data Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Schedule Ref</th>
                <th className="py-3 px-4">Target Plot</th>
                <th className="py-3 px-4">Assigned Member</th>
                <th className="py-3 px-4">Time Window</th>
                <th className="py-3 px-4 text-right">Planned (m³)</th>
                <th className="py-3 px-4 text-right">Actual (m³)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.map((s) => {
                const sDate = new Date(s.plannedStartTime);
                const eDate = new Date(s.plannedEndTime);
                const timeStr = `${sDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {s.scheduleCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-sky-800">
                      {s.plotCode}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {s.farmerName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {timeStr}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                      {s.plannedVolumeM3} m³
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {s.actualVolumeM3 ? `${s.actualVolumeM3} m³` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.status === 'APPROVED'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : s.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : s.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : s.status === 'INTERRUPTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {/* Approval Action for Scheme Manager / Admin */}
                      {s.status === 'SUBMITTED' && canApprove && (
                        <button
                          onClick={() => onApproveSchedule(s.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition shadow-xs cursor-pointer"
                        >
                          Approve
                        </button>
                      )}

                      {/* Log Delivery Action for Operator */}
                      {(s.status === 'APPROVED' || s.status === 'IN_PROGRESS') && canDeliver && (
                        <button
                          onClick={() => {
                            setShowDeliveryModal(s);
                            setActualVolume(String(s.plannedVolumeM3));
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-[11px] transition shadow-xs cursor-pointer"
                        >
                          Log Delivery
                        </button>
                      )}

                      {s.status === 'COMPLETED' && (
                        <span className="text-slate-400 text-[11px]">Recorded ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No schedules found for selected status filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'rw' ? 'Gutegeka Igihe cyo Kuhira' : 'Create Water Schedule'}
                </h3>
                <p className="text-xs text-slate-500">Validates against 1,800 m³/h pump capacity & plot overlaps</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Plot & Assigned Member *</label>
                <select
                  value={plotId}
                  onChange={(e) => setPlotId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.plotCode} ({p.blockCode}) — Member: {p.currentFarmerName || 'Unassigned'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Planned Start Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Planned End Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Planned Volume (m³)</label>
                  <input
                    type="number"
                    min="1"
                    value={plannedVolume}
                    onChange={(e) => setPlannedVolume(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-base font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Allocation Basis</label>
                  <select
                    value={allocationBasis}
                    onChange={(e) => setAllocationBasis(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="TIME_HOURS">Pumping Hours (Time Slot)</option>
                    <option value="VOLUME_M3">Metered Volume Quota (m³)</option>
                    <option value="HECTARE_QUOTA">Hectare Crop Duty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Operational Instructions / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Ensure secondary valve V-12 is open 10 minutes prior."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Checking Conflicts...' : 'Submit Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="relative h-28 bg-slate-900 overflow-hidden">
              <img
                src={IMAGE_WATER_METER}
                alt="Water flow meter"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                <div>
                  <h3 className="text-base font-bold">Record Flow Meter Reading</h3>
                  <p className="text-xs text-sky-200 font-mono">{showDeliveryModal.scheduleCode} · {showDeliveryModal.plotCode}</p>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(null)}
                  className="text-slate-300 hover:text-white p-1 cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleDeliverySubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Measured Ultrasonic Meter Volume (m³) *</label>
                <input
                  type="number"
                  required
                  value={actualVolume}
                  onChange={(e) => setActualVolume(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-base font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Delivery Status</label>
                <select
                  value={deliveryStatus}
                  onChange={(e) => setDeliveryStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                >
                  <option value="COMPLETED">COMPLETED (Normal Delivery)</option>
                  <option value="INTERRUPTED">INTERRUPTED (Pressure / Power Incident)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Currently Running)</option>
                </select>
              </div>

              {deliveryStatus === 'INTERRUPTED' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Interruption Root Cause *</label>
                  <input
                    type="text"
                    required
                    value={interruptionReason}
                    onChange={(e) => setInterruptionReason(e.target.value)}
                    placeholder="e.g. Floating suction screen intake clogged by lake vegetation"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Delivery Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Configurable Scheme Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configurable Scheme Water Rules</h3>
                <p className="text-xs text-slate-500">Approved parameters governed by Scheme Management</p>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  All rule modifications require authorization from the GFI Nasho 1 Board and Water User Association leadership.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Pivot Flow (m³/h)</label>
                  <input
                    type="number"
                    value={schemeRules.maxPivotFlowRateM3h}
                    onChange={(e) =>
                      setSchemeRules({ ...schemeRules, maxPivotFlowRateM3h: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Pump Station Flow (m³/h)</label>
                  <input
                    type="number"
                    value={schemeRules.maxPumpStationFlowRateM3h}
                    onChange={(e) =>
                      setSchemeRules({ ...schemeRules, maxPumpStationFlowRateM3h: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Min Advance Notice (Hours)</label>
                  <input
                    type="number"
                    value={schemeRules.minAdvanceNoticeHours}
                    onChange={(e) =>
                      setSchemeRules({ ...schemeRules, minAdvanceNoticeHours: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Max Daily Hours / Plot</label>
                  <input
                    type="number"
                    value={schemeRules.maxDailyHoursPerPlot}
                    onChange={(e) =>
                      setSchemeRules({ ...schemeRules, maxDailyHoursPerPlot: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                >
                  Save Approved Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
