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
  const [reportCategory, setReportCategory] = useState<string>('Irrigation Status');
  const [selectedBlockCode, setSelectedBlockCode] = useState<string>('');
  const [irrigationStatus, setIrrigationStatus] = useState<QuickLogStatus>('COMPLETED_SUCCESSFULLY');
  const [notes, setNotes] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [requiresFollowup, setRequiresFollowup] = useState<boolean>(false);
  const [waterDelivered, setWaterDelivered] = useState<boolean>(true);
  const [deliveryStartTime, setDeliveryStartTime] = useState<string>('08:00');
  const [deliveryEndTime, setDeliveryEndTime] = useState<string>('12:00');
  const [waterVolumeM3, setWaterVolumeM3] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Set default selected block code from plots list
  useEffect(() => {
    if (plots.length > 0 && !selectedBlockCode) {
      setSelectedBlockCode(plots[0].blockCode);
    }
  }, [plots, selectedBlockCode]);

  // Set default report date on open
  useEffect(() => {
    if (isOpen) {
      setReportDate(getKigaliTodayDate());
      setMsg(null);
    }
  }, [isOpen]);

  // Auto-flag requiresFollowup if status is problem or interrupted
  useEffect(() => {
    if (irrigationStatus === 'PROBLEM_REPORTED' || irrigationStatus === 'INTERRUPTED') {
      setRequiresFollowup(true);
      if (!problemDescription) {
        setProblemDescription('Water shortage or pressure drop');
      }
    }
  }, [irrigationStatus, problemDescription]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    // Form client-side validation
    const validation = validateQuickLogInput({
      blockCode: selectedBlockCode,
      reportDate,
      irrigationStatus,
      problemDescription,
    });

    if (!validation.isValid) {
      setMsg({
        type: 'error',
        text: language === 'rw' ? validation.errorRw! : validation.errorEn!,
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
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
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
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : msg.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-b border-amber-200'
                : 'bg-rose-50 text-rose-900 border-b border-rose-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {msg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {msg.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              {msg.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <span className="leading-relaxed">{msg.text}</span>
            </div>
            <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-700 ml-2">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Row 1: Itariki & Icyiciro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                <span>Itariki (Date - Africa/Kigali) *</span>
              </label>
              <input
                type="date"
                required
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Icyiciro cya Raporo (Category)
              </label>
              <input
                type="text"
                readOnly
                value={reportCategory}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Row 2: Irrigation Block */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Irrigation Block / Pivot Sector *
            </label>
            <select
              required
              value={selectedBlockCode}
              onChange={(e) => setSelectedBlockCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">-- Hitamo Block yo Kuhira --</option>
              {Array.from(new Set(plots.map((p) => p.blockCode))).map((bCode) => (
                <option key={bCode} value={bCode}>
                  {bCode}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Status Options */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Uko Kuhira Byagenze (Irrigation Status) *
            </label>
            <select
              required
              value={irrigationStatus}
              onChange={(e) => setIrrigationStatus(e.target.value as QuickLogStatus)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="COMPLETED_SUCCESSFULLY">Byagenze neza — Completed successfully</option>
              <option value="IN_PROGRESS">Birakomeje — In progress</option>
              <option value="NOT_STARTED">Ntibiratangira — Not started</option>
              <option value="INTERRUPTED">Byahagaritswe — Interrupted</option>
              <option value="PROBLEM_REPORTED">Habaye ikibazo — Problem reported</option>
            </select>
          </div>

          {/* Conditional Field: Problem Description */}
          {(irrigationStatus === 'INTERRUPTED' || irrigationStatus === 'PROBLEM_REPORTED') && (
            <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl space-y-3">
              <label className="block font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Sobanura ikibazo cyabaye (Describe Reported Issue) *</span>
              </label>

              <select
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full px-3 py-2 border border-rose-300 rounded-xl font-medium text-rose-950 focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Water shortage or pressure drop">Water shortage / Cyangwa ikibazo cy’amazi</option>
                <option value="Pipe blockage or manifold restriction">Pipe blockage / Imiyo yabaye clogged</option>
                <option value="Damaged irrigation equipment or nozzle">Damaged irrigation equipment / Igikoresho cyangiritse</option>
                <option value="Pump failure or power outage">Pump failure / Imashini yabaye ikibazo</option>
                <option value="Unexpected operational interruption">Unexpected interruption / Guhagarara gutunguranye</option>
                <option value="Other operational problems">Other operational problems / Ibindi bibazo</option>
              </select>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Additional details:</label>
                <textarea
                  rows={2}
                  placeholder="E.g. Span 3 pressure dropped below 2.0 bar at 09:30 AM..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-rose-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <label className="flex items-center gap-2 font-semibold text-rose-900 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={requiresFollowup}
                  onChange={(e) => setRequiresFollowup(e.target.checked)}
                  className="rounded text-rose-600 w-4 h-4"
                />
                <span>Shyira ku rutonde rw’ibibazo bigomba gukurikiranwa (Flag for follow-up)</span>
              </label>
            </div>
          )}

          {/* Short Notes (if normal status) */}
          {irrigationStatus !== 'INTERRUPTED' && irrigationStatus !== 'PROBLEM_REPORTED' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ibisobanuro Bigufi (Short Situation Notes)
              </label>
              <textarea
                rows={2}
                placeholder="E.g. Normal pivot rotation completed, moisture level adequate..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

          {/* Optional Water Delivery Info */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waterDelivered}
                  onChange={(e) => setWaterDelivered(e.target.checked)}
                  className="rounded text-sky-600 w-4 h-4"
                />
                <Droplet className="w-4 h-4 text-sky-600 inline" />
                <span>Water was delivered (Amazi yatanzwe)</span>
              </label>
              <span className="text-[10px] text-slate-500 italic">Optional field</span>
            </div>

            {waterDelivered && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={deliveryStartTime}
                    onChange={(e) => setDeliveryStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={deliveryEndTime}
                    onChange={(e) => setDeliveryEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Measured Vol. (m³)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 420"
                    value={waterVolumeM3}
                    onChange={(e) => setWaterVolumeM3(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
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
