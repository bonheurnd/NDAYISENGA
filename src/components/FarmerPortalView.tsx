import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Droplets,
  Receipt,
  AlertTriangle,
  Clock,
  WifiOff,
  CheckCircle2,
  Calendar,
  X,
  Send,
  HelpCircle,
  FileText,
} from 'lucide-react';
import type {
  Farmer,
  Plot,
  WaterSchedule,
  Invoice,
  Payment,
  Complaint,
  Language,
} from '../types/index.ts';
import { useOnlineStatus } from '../lib/hooks/useOnlineStatus.ts';
import {
  enqueueOfflineEvent,
  getOfflineQueue,
  flushOfflineQueue,
} from '../lib/services/offlineSync.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { FarmerCheckinCard } from './FarmerCheckinCard.tsx';
import type { FarmerCheckin } from '../types/index.ts';

interface FarmerPortalViewProps {
  farmer: Farmer;
  plots: Plot[];
  schedules: WaterSchedule[];
  invoices: Invoice[];
  payments: Payment[];
  complaints: Complaint[];
  checkins?: FarmerCheckin[];
  language: Language;
  onRefreshData: () => void;
  onSubmitComplaintOnline: (complaintData: any) => Promise<void>;
  onVerifyCheckin: (qrData: string, manualPlotCode?: string) => Promise<{
    success: boolean;
    message: string;
    checkin?: FarmerCheckin;
  }>;
}

export const FarmerPortalView: React.FC<FarmerPortalViewProps> = ({
  farmer,
  plots,
  schedules,
  invoices,
  payments,
  complaints,
  checkins = [],
  language,
  onRefreshData,
  onSubmitComplaintOnline,
  onVerifyCheckin,
}) => {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<'overview' | 'schedules' | 'invoices' | 'complaints'>('overview');
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Complaint Form States
  const [category, setCategory] = useState<Complaint['category']>('WATER_SHORTAGE');
  const [description, setDescription] = useState('');
  const [targetPlotCode, setTargetPlotCode] = useState(plots[0]?.plotCode || 'BLK-A-P01');
  const [formMsg, setFormMsg] = useState<{ text: string; type: 'success' | 'queued' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offlineEvents, setOfflineEvents] = useState(getOfflineQueue());

  useEffect(() => {
    setOfflineEvents(getOfflineQueue());
  }, [showComplaintModal]);

  // Farmer's assigned plots
  const myPlots = plots.filter((p) => farmer.assignedPlotIds.includes(p.id) || p.currentFarmerId === farmer.id);
  // Farmer's schedules
  const mySchedules = schedules.filter((s) => s.farmerId === farmer.id);
  // Farmer's invoices
  const myInvoices = invoices.filter((i) => i.farmerId === farmer.id);
  const totalDue = myInvoices.reduce((sum, i) => sum + i.balanceRwf, 0);
  // Farmer's verified payments
  const myPayments = payments.filter((p) => p.farmerId === farmer.id);
  // Farmer's filed complaints
  const myComplaints = complaints.filter((c) => c.farmerId === farmer.id);

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!description.trim()) {
      setFormMsg({ text: 'Please enter details describing the issue.', type: 'error' });
      return;
    }

    // Check online status: if offline, safely enqueue non-financial mutation
    if (!isOnline) {
      const res = enqueueOfflineEvent('REPORT_INTERRUPTION', {
        category,
        description: description.trim(),
        plotCode: targetPlotCode,
      });

      if (res.success) {
        setFormMsg({
          text: language === 'rw'
            ? 'Nta murongo uriho. Ikirego cyawe kibitswe muri telefoni, kizoherezwa interineti nigaruka.'
            : 'You are offline. Your complaint is safely queued on your device and will auto-sync when network returns.',
          type: 'queued',
        });
        setDescription('');
        setOfflineEvents(getOfflineQueue());
        setTimeout(() => setShowComplaintModal(false), 2500);
      } else {
        setFormMsg({ text: res.error || 'Failed to queue offline action.', type: 'error' });
      }
      return;
    }

    // Online submission
    try {
      setIsSubmitting(true);
      await onSubmitComplaintOnline({
        category,
        description: description.trim(),
        plotCode: targetPlotCode,
      });
      setFormMsg({
        text: language === 'rw'
          ? 'Ikirego cyakiriwe neza n\'ubuyobozi bw\'amazi.'
          : 'Complaint successfully received by water scheme management.',
        type: 'success',
      });
      setDescription('');
      setTimeout(() => setShowComplaintModal(false), 2000);
    } catch (err: any) {
      setFormMsg({ text: err.message || 'Error submitting complaint.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Farmer Welcome & Offline Banner */}
      <div className="p-5 bg-gradient-to-r from-sky-800 to-sky-950 text-white rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold bg-sky-700/80 px-2.5 py-0.5 rounded text-sky-100 uppercase tracking-wider">
                {farmer.cooperativeName}
              </span>
              {!isOnline && (
                <span className="text-[11px] font-semibold bg-amber-500/90 text-white px-2 py-0.5 rounded flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline PWA
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold mt-1 text-white">
              {language === 'rw' ? 'Murakaza Neza' : 'Welcome'}, {farmer.fullName}
            </h1>
            <p className="text-xs text-sky-200 font-mono mt-0.5">
              Member Code: {farmer.farmerCode} · Phone: {farmer.phone}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton label={language === 'rw' ? 'Koresha PWA' : 'Install PWA'} />
          </div>
        </div>
      </div>

      {/* Touch-Friendly Mobile Tab Bar */}
      <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-center">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Imirima' : 'My Plots'}
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'schedules' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Guhira' : 'Schedules'}
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Ubwishyu' : 'Bills'}
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'complaints' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Ibibazo' : 'Tickets'}
        </button>
      </div>

      {/* Tab 1: Overview & Assigned Plots */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Total Farmland</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {farmer.totalHectares} Ha
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-500 font-medium block">Assigned Plots</span>
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {myPlots.length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 font-medium block">Unpaid Seasonal Balance</span>
              <span className={`text-xl font-bold font-mono tabular-nums ${totalDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {totalDue.toLocaleString()} RWF
              </span>
            </div>
          </div>

          {/* Site Arrival QR Check-in Card (Kwemeza Ko Nahageze) */}
          <FarmerCheckinCard
            checkins={checkins}
            farmerPlots={myPlots}
            language={language}
            onVerifyCheckin={onVerifyCheckin}
          />

          {/* Plots List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'rw' ? 'Imirima Yanjye n\'Uburyo bwo Kuhira' : 'My Registered Plots & Irrigation Equipment'}
            </h2>

            <div className="space-y-3">
              {myPlots.map((plot) => (
                <div key={plot.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-800 text-sm">{plot.plotCode}</span>
                    <span className="text-[11px] font-semibold text-emerald-700">{plot.status}</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-medium text-slate-900">Crop: {plot.currentCrop}</span> · {plot.areaHectares} Hectares
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Location: {plot.blockCode} · Method: {plot.irrigationType.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interruption report CTA button */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                {language === 'rw' ? 'Ufite ikibazo cy\'amazi cyangwa pivo idakora?' : 'Experiencing low water pressure or broken sprinkler?'}
              </h3>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Report interruptions immediately even without network connection.
              </p>
            </div>
            <button
              onClick={() => {
                setShowComplaintModal(true);
                setFormMsg(null);
              }}
              className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
            >
              Report Issue
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Schedules */}
      {activeTab === 'schedules' && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'rw' ? 'Gahunda Yanjye yo Kuhira' : 'Irrigation Delivery Calendar'}
            </h2>
            <span className="text-[11px] text-slate-500">Season 2026A</span>
          </div>

          <div className="space-y-3">
            {mySchedules.map((sch) => {
              const sDate = new Date(sch.plannedStartTime);
              const eDate = new Date(sch.plannedEndTime);
              return (
                <div key={sch.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-800 text-xs">{sch.plotCode}</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        sch.status === 'APPROVED'
                          ? 'text-sky-700'
                          : sch.status === 'IN_PROGRESS'
                          ? 'text-amber-700'
                          : sch.status === 'COMPLETED'
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">
                    {sDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}: {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between font-mono tabular-nums">
                    <span>Planned Quota: {sch.plannedVolumeM3} m³</span>
                    {sch.actualVolumeM3 && <span>Actual Delivered: {sch.actualVolumeM3} m³</span>}
                  </div>
                </div>
              );
            })}

            {mySchedules.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">
                No active irrigation deliveries currently scheduled for your plots.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Bills & Receipts */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'rw' ? 'Inyemezabwishyu n\'Amafaranga Asigaye' : 'Invoices & Balances'}
            </h2>

            <div className="space-y-3">
              {myInvoices.map((inv) => (
                <div key={inv.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-xs">{inv.invoiceNumber}</span>
                    <span className={`text-[11px] font-semibold ${inv.status === 'PAID' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-700 font-mono tabular-nums">
                    <span>Total: {inv.totalRwf.toLocaleString()} RWF</span>
                    <span className="font-bold text-rose-700">Due: {inv.balanceRwf.toLocaleString()} RWF</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Issue: {inv.issueDate}</span>
                    <span>Deadline: {inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Offline payment notice */}
            {!isOnline && (
              <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                Notice: Mobile money payments and bank settlements cannot be approved offline. When connectivity is restored, pay via MTN MoMo (*182#) or Airtel Money.
              </div>
            )}
          </div>

          {/* Verified Receipts List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'rw' ? 'Inyemezabwishyu Zemejwe (Receipts)' : 'Verified Payment Receipts'}
            </h2>

            <div className="space-y-2">
              {myPayments.map((p) => (
                <div key={p.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-800 block">{p.receiptNumber}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{p.transactionReference}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 block">{p.amountRwf.toLocaleString()} RWF</span>
                    <span className="text-[10px] text-slate-400">{new Date(p.recordedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Complaints & Offline Sync Queue */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              {language === 'rw' ? 'Ibibazo n\'Amakosa Byatangiwe' : 'My Support Tickets & Fault Reports'}
            </h2>
            <button
              onClick={() => {
                setShowComplaintModal(true);
                setFormMsg(null);
              }}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Report New Issue
            </button>
          </div>

          {/* Offline Queue Items if any */}
          {offlineEvents.length > 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Offline Sync Queue ({offlineEvents.length})</span>
              </span>
              <div className="space-y-1.5 text-xs">
                {offlineEvents.map((ev) => (
                  <div key={ev.id} className="p-2.5 bg-white rounded-lg border border-amber-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{ev.eventType}</span>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">
                        {(ev.payload as any).description || 'Offline ticket'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synchronized Complaints List */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="space-y-3">
              {myComplaints.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{c.ticketNumber}</span>
                    <span
                      className={`text-[11px] font-semibold ${
                        c.status === 'RESOLVED'
                          ? 'text-emerald-700'
                          : c.status === 'INVESTIGATING'
                          ? 'text-sky-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">
                    Category: {c.category.replace('_', ' ')} · Plot: {c.plotCode || 'General'}
                  </div>
                  <p className="text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-100 text-[11px]">
                    {c.description}
                  </p>
                  {c.resolutionNotes && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-100">
                      <strong>Operator Response:</strong> {c.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}

              {myComplaints.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No complaints filed. Tap "Report New Issue" above to submit water or equipment faults.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Complaint Modal (With Offline Support) */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'rw' ? 'Gutangaza Ikibazo cy\'Amazi' : 'Report Water / Equipment Issue'}
                </h3>
                {!isOnline && (
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                    <WifiOff className="w-3 h-3" /> Offline Mode (Will safely queue)
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComplaintSubmit} className="p-5 space-y-4 text-xs">
              {formMsg && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    formMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : formMsg.type === 'queued'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {formMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{formMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="WATER_SHORTAGE">Water Shortage / Low Pressure</option>
                  <option value="EQUIPMENT_LEAK">Sprinkler Leak / Broken Pipe</option>
                  <option value="SCHEDULE_CONFLICT">Water Timing Overlap</option>
                  <option value="BILLING_DISPUTE">Billing or Invoice Question</option>
                  <option value="OTHER">Other Operational Issue</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Plot Location</label>
                <select
                  value={targetPlotCode}
                  onChange={(e) => setTargetPlotCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                >
                  {myPlots.map((p) => (
                    <option key={p.id} value={p.plotCode}>
                      {p.plotCode} ({p.currentCrop})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description / Details *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. End gun nozzle is spraying low pressure water since 08:00 AM."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Submitting...' : isOnline ? 'Submit Ticket' : 'Queue in Offline Storage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
