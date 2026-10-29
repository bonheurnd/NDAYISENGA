import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Droplet,
  ShieldCheck,
  Send,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import type { Plot, Language, QuickLogStatus, IrrigationQuickLog } from '../types/index.ts';
import { getKigaliTodayDate, validateQuickLogInput } from '../lib/logic/quicklog.ts';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: Plot[];
  language: Language;
  onSubmitLog?: (logData: Partial<IrrigationQuickLog>) => Promise<{
    success: boolean;
    log?: IrrigationQuickLog;
    isDuplicate?: boolean;
    message?: string;
    error?: string;
  }>;
}

export const QuickLogModal: React.FC<QuickLogModalProps> = ({
  isOpen,
  onClose,
  plots,
  language,
  onSubmitLog,
}) => {
  const [reportDate, setReportDate] = useState<string>(getKigaliTodayDate());
  const [reportCategory] = useState<string>('Irrigation Status');
  const [selectedBlockCode, setSelectedBlockCode] = useState<string>('');
  const [irrigationStatus, setIrrigationStatus] = useState<QuickLogStatus>('COMPLETED_SUCCESSFULLY');
  const [notes, setNotes] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [requiresFollowup, setRequiresFollowup] = useState<boolean>(false);

  // Optional Water Delivery Metrics
  const [waterDelivered, setWaterDelivered] = useState<boolean>(false);
  const [deliveryStartTime, setDeliveryStartTime] = useState<string>('08:00');
  const [deliveryEndTime, setDeliveryEndTime] = useState<string>('12:00');
  const [waterVolumeM3, setWaterVolumeM3] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Auto-preselect first plot block code
  useEffect(() => {
    if (plots.length > 0 && !selectedBlockCode) {
      setSelectedBlockCode(plots[0].blockCode || plots[0].plotCode);
    }
  }, [plots, selectedBlockCode]);

  // Reset or clear message when modal opens
  useEffect(() => {
    if (isOpen) {
      setMsg(null);
      setReportDate(getKigaliTodayDate());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requiresProblemInput =
    irrigationStatus === 'INTERRUPTED' || irrigationStatus === 'PROBLEM_REPORTED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const val = validateQuickLogInput({
      reportDate,
      blockCode: selectedBlockCode,
      irrigationStatus,
      problemDescription,
    });

    if (!val.isValid) {
      setMsg({
        type: 'error',
        text: (language === 'rw' ? val.errorRw : val.errorEn) || (language === 'rw' ? 'Reba amakuru utaruzuza neza.' : 'Please check required fields.'),
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const matchedPlot = plots.find((p) => p.blockCode === selectedBlockCode || p.plotCode === selectedBlockCode);

      const payload: Partial<IrrigationQuickLog> = {
        blockId: matchedPlot?.id || 'plt-001',
        blockCode: selectedBlockCode,
        reportDate,
        reportCategory,
        irrigationStatus,
        notes: notes.trim() || undefined,
        problemDescription: problemDescription.trim() || undefined,
        requiresFollowup,
        waterDelivered,
        deliveryStartTime: waterDelivered ? deliveryStartTime : undefined,
        deliveryEndTime: waterDelivered ? deliveryEndTime : undefined,
        waterVolumeM3: waterVolumeM3 ? parseFloat(waterVolumeM3) : undefined,
      };

      if (!onSubmitLog) {
        setIsSubmitting(false);
        return;
      }

      const res = await onSubmitLog(payload);

      if (res.success) {
        if (res.isDuplicate) {
          setMsg({
            type: 'warning',
            text: language === 'rw'
              ? 'Raporo isa n’iyi isanzwe iriho kuri iyi block uyu munsi. Reba niba ushaka kongera kohereza.'
              : 'A similar log already exists for this block today.',
          });
        } else {
          setMsg({
            type: 'success',
            text: res.message || (language === 'rw' ? 'Raporo yabitswe neza.' : 'Quick log saved successfully.'),
          });
          // Close after short delay
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        setMsg({
          type: 'error',
          text: res.error || (language === 'rw' ? 'Reba amakuru utaruzuza neza.' : 'Validation error occurred.'),
        });
      }
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: language === 'rw'
          ? 'Raporo ntiyoherejwe kubera ikibazo cy’umuyoboro. Ongera ugerageze.'
          : 'Network error. Report was not submitted. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-5">
      <div className="w-full max-w-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 rounded-xl">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Quick Log — Andika Raporo Yihuse
              </h2>
              <p className="text-xs text-sky-200">
                GFI Nasho 1 · Daily Irrigation Field Status Update
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message Bar */}
        {msg && (
          <div
            className={`px-4 py-3 text-xs font-semibold flex items-center justify-between shrink-0 ${
              msg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800'
                : msg.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-b border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {msg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
              {msg.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
              {msg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Row 1: Itariki & Icyiciro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Itariki (Date - Africa/Kigali) *</span>
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Icyiciro cya Raporo (Category)
              </label>
              <input
                type="text"
                readOnly
                value={reportCategory}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 2: Irrigation Block */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Irrigation Block / Pivot Sector *
            </label>
            <select
              required
              value={selectedBlockCode}
              onChange={(e) => setSelectedBlockCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-bold focus:ring-2 focus:ring-sky-500"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.blockCode || p.plotCode} className="dark:bg-slate-800">
                  {p.blockCode || p.plotCode} — {p.schemeName} ({p.areaHectares} Ha)
                </option>
              ))}
              <option value="BLOCK-A (Center Pivot 01)" className="dark:bg-slate-800">BLOCK-A (Center Pivot 01)</option>
              <option value="BLOCK-B (Center Pivot 02)" className="dark:bg-slate-800">BLOCK-B (Center Pivot 02)</option>
              <option value="BLOCK-C (Dragline Sector 01)" className="dark:bg-slate-800">BLOCK-C (Dragline Sector 01)</option>
            </select>
          </div>

          {/* Row 3: Status Selector */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Uko kuhira byagenze (Irrigation Status) *
            </label>
            <select
              value={irrigationStatus}
              onChange={(e) => setIrrigationStatus(e.target.value as QuickLogStatus)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="COMPLETED_SUCCESSFULLY" className="dark:bg-slate-800">Byagenze neza — Completed successfully</option>
              <option value="IN_PROGRESS" className="dark:bg-slate-800">Birakomeje — In progress</option>
              <option value="NOT_STARTED" className="dark:bg-slate-800">Ntibiratangira — Not started</option>
              <option value="INTERRUPTED" className="dark:bg-slate-800">Byahagaritswe — Interrupted</option>
              <option value="PROBLEM_REPORTED" className="dark:bg-slate-800">Habaye ikibazo — Problem reported</option>
            </select>
          </div>

          {/* Conditional Field: Required Problem Description if INTERRUPTED or PROBLEM_REPORTED */}
          {requiresProblemInput && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl space-y-2">
              <label className="block font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sobanura ikibazo cyabaye (Problem Description) *</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Sobanura neza ikibazo cyatumye kuhira bihagarara cyangwa bitagenda neza..."
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-amber-950 dark:text-amber-100 placeholder-amber-700/50 dark:placeholder-amber-400/50 focus:ring-2 focus:ring-amber-500"
              />

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={requiresFollowup}
                  onChange={(e) => setRequiresFollowup(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <span className="font-semibold text-amber-900 dark:text-amber-200 text-xs">
                  Bisaba gukurikiranwa n'ishami ry'abatekinisiye (Requires Maintenance Follow-up)
                </span>
              </label>
            </div>
          )}

          {/* Short Notes */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Ibisobanuro bigufi (Optional Short Notes)
            </label>
            <input
              type="text"
              placeholder="Andika ibisobanuro byongeyeho..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Optional Water Delivery Section Toggle */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Andika ingano y'amazi n'isaha (Optional Water Metrics)</span>
              </span>
              <input
                type="checkbox"
                checked={waterDelivered}
                onChange={(e) => setWaterDelivered(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
            </label>

            {waterDelivered && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={deliveryStartTime}
                    onChange={(e) => setDeliveryStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">End Time</label>
                  <input
                    type="time"
                    value={deliveryEndTime}
                    onChange={(e) => setDeliveryEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">Measured Vol. (m³)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 420"
                    value={waterVolumeM3}
                    onChange={(e) => setWaterVolumeM3(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs cursor-pointer"
          >
            Kureka (Cancel)
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer text-xs"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Bika Raporo...' : 'Bika Raporo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
