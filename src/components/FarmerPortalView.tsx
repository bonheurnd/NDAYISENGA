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
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Eye,
  ArrowRight,
  Info,
  Grid3X3,
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
} from '../lib/services/offlineSync.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { FarmerCheckinCard } from './FarmerCheckinCard.tsx';
import type { FarmerCheckin } from '../types/index.ts';
import {
  isValidGpsCoordinate,
  formatGpsCoordinate,
  generateGoogleMapsUrl,
  getPlotScheduleStatus,
} from '../lib/logic/plotVisualization.ts';

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
  const [selectedDetailPlot, setSelectedDetailPlot] = useState<Plot | null>(null);
  const [copiedPlotId, setCopiedPlotId] = useState<string | null>(null);

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

  const handleCopyGps = (plot: Plot) => {
    if (isValidGpsCoordinate(plot.latitude, plot.longitude)) {
      const coordStr = `${plot.latitude}, ${plot.longitude}`;
      navigator.clipboard.writeText(coordStr);
      setCopiedPlotId(plot.id);
      setTimeout(() => setCopiedPlotId(null), 2500);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!description.trim()) {
      setFormMsg({ text: 'Please enter details describing the issue.', type: 'error' });
      return;
    }

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
      <div className="p-5 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-2xl shadow-sm border border-emerald-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-emerald-700/80 px-2.5 py-0.5 rounded-full text-emerald-100 uppercase tracking-wider">
                {farmer.cooperativeName}
              </span>
              {!isOnline && (
                <span className="text-[11px] font-bold bg-amber-500/90 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline PWA
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold mt-1 text-white">
              {language === 'rw' ? 'Murakaza Neza' : 'Welcome'}, {farmer.fullName}
            </h1>
            <p className="text-xs text-emerald-200 font-mono mt-0.5">
              Member Code: {farmer.farmerCode} · Phone: {farmer.phone}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton label={language === 'rw' ? 'Koresha PWA' : 'Install PWA'} />
          </div>
        </div>
      </div>

      {/* Touch-Friendly Mobile Tab Bar */}
      <div className="grid grid-cols-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-center">
        <button
          onClick={() => setActiveTab('overview')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'overview' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Imirima Yanjye' : 'My Plots'}
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'schedules' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Guhira' : 'Schedules'}
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'invoices' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Ubwishyu' : 'Bills'}
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`py-2 rounded-lg transition cursor-pointer min-h-[44px] flex items-center justify-center ${
            activeTab === 'complaints' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          {language === 'rw' ? 'Ibibazo' : 'Tickets'}
        </button>
      </div>

      {/* Tab 1: Overview & "Imirima Yanjye" (My Plots Visualization) */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Quick Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Total Farmland</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {farmer.totalHectares} Ha
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block font-bold">Assigned Plots</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {myPlots.length}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Unpaid Seasonal Balance</span>
              <span className={`text-xl font-black font-mono tabular-nums ${totalDue > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
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

          {/* --- SECTION: IMIRIMA YANJYE (MY PLOTS VISUALIZATION) --- */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{language === 'rw' ? 'Imirima Yanjye' : 'My Registered Plots & Location'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  GFI Nasho 1 Surveyed Plots · Live Irrigation Schedule Status & GPS Coordinates
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
                {myPlots.length} Plot(s) Linked
              </span>
            </div>

            {/* Schedule Status Color Legend */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                {language === 'rw' ? 'Ubusobanuro bw\'Amabara y\'Iteganyamazi (Status Legend):' : 'Schedule Status Legend:'}
              </span>
              <div className="flex flex-wrap gap-2 sm:gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-700 text-sky-900 dark:text-sky-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                  <span>Kuhira birakomeje (In Progress)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Gahunda irategerejwe (Upcoming)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Gahariwe gahunda (Scheduled)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Yahagaritswe (Interrupted)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Nta gahunda (No Schedule)</span>
                </span>
              </div>
            </div>

            {/* Plot Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPlots.map((plot) => {
                const statusInfo = getPlotScheduleStatus(plot, schedules);
                const hasValidGps = isValidGpsCoordinate(plot.latitude, plot.longitude);

                return (
                  <div
                    key={plot.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                  >
                    {/* Card Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                            {plot.plotCode}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {plot.areaHectares} Ha
                          </span>
                        </div>

                        {/* Schedule Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${statusInfo.badgeBg} ${statusInfo.textColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotBg}`} />
                          <span>{language === 'rw' ? statusInfo.labelRw : statusInfo.labelEn}</span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {plot.blockCode}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px]">
                          <span>Crop: <strong>{plot.currentCrop || 'Maize'}</strong></span>
                          <span>Method: <strong>{plot.irrigationType.replace('_', ' ')}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* GPS Coordinates & Location Section */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>GPS Location</span>
                        </span>

                        {hasValidGps ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Surveyed
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            GPS ntirashyirwaho
                          </span>
                        )}
                      </div>

                      {hasValidGps ? (
                        <div className="space-y-1 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Latitude:</span>
                            <span className="font-bold">{formatGpsCoordinate(plot.latitude!)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Longitude:</span>
                            <span className="font-bold">{formatGpsCoordinate(plot.longitude!)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          GPS mapping pending physical boundary field survey.
                        </p>
                      )}

                      {/* Map / Copy Actions */}
                      {hasValidGps && (
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={generateGoogleMapsUrl(plot.latitude!, plot.longitude!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-[11px] transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Fungura ku Karita</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopyGps(plot)}
                            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                            title="Copy GPS coordinates to clipboard"
                          >
                            {copiedPlotId === plot.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Kopiya</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailPlot(plot)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ibisobanuro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('schedules')}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer flex items-center gap-1"
                      >
                        <span>Reba Iteganyamazi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {myPlots.length === 0 && (
                <div className="col-span-2 py-10 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <Grid3X3 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nta murima wanditswe ku izina ryawe.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Please contact GFI Nasho 1 WUO management to link your registered irrigation plots.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interruption report CTA banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {language === 'rw' ? 'Ufite ikibazo cy\'amazi cyangwa pivo idakora?' : 'Experiencing low water pressure or broken sprinkler?'}
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                Report interruptions immediately even without network connection.
              </p>
            </div>
            <button
              onClick={() => {
                setShowComplaintModal(true);
                setFormMsg(null);
              }}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs"
            >
              Report Issue
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Schedules */}
      {activeTab === 'schedules' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'rw' ? 'Gahunda Yanjye yo Kuhira (My Water Schedule)' : 'Irrigation Delivery Calendar'}
            </h2>
            <span className="text-[11px] font-bold font-mono text-emerald-700 dark:text-emerald-400">Season 2026A</span>
          </div>

          <div className="space-y-3">
            {mySchedules.map((sch) => {
              const sDate = new Date(sch.plannedStartTime);
              const eDate = new Date(sch.plannedEndTime);
              return (
                <div key={sch.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-xs">{sch.plotCode}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        sch.status === 'APPROVED'
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 border-sky-300'
                          : sch.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                          : sch.status === 'COMPLETED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                      }`}
                    >
                      {sch.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-bold">
                    {sDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}: {sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {eDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-mono tabular-nums">
                    <span>Planned Quota: {sch.plannedVolumeM3} m³</span>
                    {sch.actualVolumeM3 && <span>Actual Delivered: {sch.actualVolumeM3} m³</span>}
                  </div>
                </div>
              );
            })}

            {mySchedules.length === 0 && (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                No active irrigation deliveries currently scheduled for your plots.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Bills & Receipts */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'rw' ? 'Inyemezabwishyu n\'Amafaranga Asigaye' : 'Invoices & Balances'}
            </h2>

            <div className="space-y-3">
              {myInvoices.map((inv) => (
                <div key={inv.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{inv.invoiceNumber}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${inv.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                    <span>Total: {inv.totalRwf.toLocaleString()} RWF</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">Due: {inv.balanceRwf.toLocaleString()} RWF</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Issue: {inv.issueDate}</span>
                    <span>Deadline: {inv.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            {!isOnline && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Notice: Mobile money payments and bank settlements cannot be approved offline. When connectivity is restored, pay via MTN MoMo (*182#) or Airtel Money.
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'rw' ? 'Inyemezabwishyu Zemejwe (Receipts)' : 'Verified Payment Receipts'}
            </h2>

            <div className="space-y-2">
              {myPayments.map((p) => (
                <div key={p.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 block">{p.receiptNumber}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{p.transactionReference}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">{p.amountRwf.toLocaleString()} RWF</span>
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
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {language === 'rw' ? 'Ibibazo n\'Amakosa Byatangiwe' : 'My Support Tickets & Fault Reports'}
            </h2>
            <button
              onClick={() => {
                setShowComplaintModal(true);
                setFormMsg(null);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
            >
              Report New Issue
            </button>
          </div>

          {offlineEvents.length > 0 && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Pending Offline Sync Queue ({offlineEvents.length})</span>
              </span>
              <div className="space-y-1.5 text-xs">
                {offlineEvents.map((ev) => (
                  <div key={ev.id} className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-amber-200/80 dark:border-amber-700/80 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ev.eventType}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
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

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="space-y-3">
              {myComplaints.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{c.ticketNumber}</span>
                    <span
                      className={`text-[11px] font-bold ${
                        c.status === 'RESOLVED'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : c.status === 'INVESTIGATING'
                          ? 'text-sky-700 dark:text-sky-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-semibold">
                    Category: {c.category.replace('_', ' ')} · Plot: {c.plotCode || 'General'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px]">
                    {c.description}
                  </p>
                  {c.resolutionNotes && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <strong>Operator Response:</strong> {c.resolutionNotes}
                    </div>
                  )}
                </div>
              ))}

              {myComplaints.length === 0 && (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                  No complaints filed. Tap "Report New Issue" above to submit water or equipment faults.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plot Details Panel / Modal */}
      {selectedDetailPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-700 rounded-xl">
                  <Grid3X3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {selectedDetailPlot.plotCode}
                  </h3>
                  <p className="text-xs text-emerald-200 font-mono">
                    GFI Nasho 1 · Surveyed Plot File
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDetailPlot(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Ubuso (Area):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{selectedDetailPlot.areaHectares} Ha</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Igihingwa (Crop):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDetailPlot.currentCrop || 'Maize'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Block Code:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedDetailPlot.blockCode}</span>
                </div>
              </div>

              {/* Schedule Status Detail */}
              {(() => {
                const statusInfo = getPlotScheduleStatus(selectedDetailPlot, schedules);
                return (
                  <div className="p-3.5 rounded-xl border space-y-2 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Irrigation Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusInfo.badgeBg} ${statusInfo.textColor}`}>
                        {language === 'rw' ? statusInfo.labelRw : statusInfo.labelEn}
                      </span>
                    </div>

                    {statusInfo.matchedSchedule ? (
                      <div className="space-y-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between">
                          <span>Schedule Code:</span>
                          <span className="font-bold">{statusInfo.matchedSchedule.scheduleCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Start Time:</span>
                          <span>{new Date(statusInfo.matchedSchedule.plannedStartTime).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>End Time:</span>
                          <span>{new Date(statusInfo.matchedSchedule.plannedEndTime).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Planned Volume:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{statusInfo.matchedSchedule.plannedVolumeM3} m³</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                        No scheduled water deliveries for this plot currently.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* GPS Coordinates Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>GPS Field Coordinates</span>
                </span>

                {isValidGpsCoordinate(selectedDetailPlot.latitude, selectedDetailPlot.longitude) ? (
                  <div className="space-y-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Latitude:</span>
                      <span className="font-bold">{formatGpsCoordinate(selectedDetailPlot.latitude!)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">Longitude:</span>
                      <span className="font-bold">{formatGpsCoordinate(selectedDetailPlot.longitude!)}</span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <a
                        href={generateGoogleMapsUrl(selectedDetailPlot.latitude!, selectedDetailPlot.longitude!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Fungura ku Karita (Google Maps)</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    GPS ntirashyirwaho. Boundary survey pending field verification.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedDetailPlot(null);
                  setActiveTab('schedules');
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Reba Iteganyamazi (Go to Calendar)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setSelectedDetailPlot(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-xs cursor-pointer ml-auto"
              >
                Funga (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-emerald-950 text-white">
              <div>
                <h3 className="text-base font-bold text-white">
                  {language === 'rw' ? 'Gutangaza Ikibazo cy\'Amazi' : 'Report Water / Equipment Issue'}
                </h3>
                {!isOnline && (
                  <span className="text-[11px] text-amber-300 font-bold flex items-center gap-1 mt-0.5">
                    <WifiOff className="w-3 h-3" /> Offline Mode (Will safely queue)
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowComplaintModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleComplaintSubmit} className="p-5 space-y-4 text-xs">
              {formMsg && (
                <div
                  className={`p-3 rounded-xl flex items-center gap-2 font-semibold ${
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
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="WATER_SHORTAGE">Water Shortage / Low Pressure</option>
                  <option value="EQUIPMENT_LEAK">Sprinkler Leak / Broken Pipe</option>
                  <option value="SCHEDULE_CONFLICT">Water Timing Overlap</option>
                  <option value="BILLING_DISPUTE">Billing or Invoice Question</option>
                  <option value="OTHER">Other Operational Issue</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Plot Location</label>
                <select
                  value={targetPlotCode}
                  onChange={(e) => setTargetPlotCode(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {myPlots.map((p) => (
                    <option key={p.id} value={p.plotCode}>
                      {p.plotCode} ({p.currentCrop || 'Maize'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Description / Details *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. End gun nozzle is spraying low pressure water since 08:00 AM."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
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
