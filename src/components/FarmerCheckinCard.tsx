import React, { useState } from 'react';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import type { FarmerCheckin, Plot, Language } from '../types/index.ts';
import { QrCodeScannerModal } from './QrCodeScannerModal.tsx';

interface FarmerCheckinCardProps {
  checkins: FarmerCheckin[];
  farmerPlots: Plot[];
  language: Language;
  onVerifyCheckin: (qrData: string, manualPlotCode?: string) => Promise<{
    success: boolean;
    message: string;
    checkin?: FarmerCheckin;
  }>;
}

export const FarmerCheckinCard: React.FC<FarmerCheckinCardProps> = ({
  checkins,
  farmerPlots,
  language,
  onVerifyCheckin,
}) => {
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCheckinResult, setLastCheckinResult] = useState<{
    success: boolean;
    status: string;
    message: string;
    checkin?: FarmerCheckin;
  } | null>(null);

  // Recent verified check-in for this farmer
  const latestCheckin = checkins[0];

  const handleScanSubmit = async (qrData: string, manualPlotCode?: string) => {
    try {
      setIsSubmitting(true);
      setLastCheckinResult(null);

      const res = await onVerifyCheckin(qrData, manualPlotCode);
      setLastCheckinResult({
        success: res.success,
        status: res.success ? 'VERIFIED' : 'REJECTED',
        message: res.message,
        checkin: res.checkin,
      });
    } catch (e: any) {
      setLastCheckinResult({
        success: false,
        status: 'REJECTED',
        message: e.message || 'Error executing QR check-in verification.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {language === 'rw' ? 'Kwemeza Ko Nahageze' : 'Site Arrival QR Check-in'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'rw'
                ? 'Sikana QR code y\'umurima wawe kugira ngo wemeze ko wageze ku pivo'
                : 'Scan assigned block QR code to log and verify your physical arrival on site'}
            </p>
          </div>
        </div>

        {/* Primary Scan Button */}
        <button
          onClick={() => {
            setShowScannerModal(true);
          }}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <QrCode className="w-4 h-4" />
          )}
          <span>{language === 'rw' ? 'Sikana QR Code' : 'Sikana QR Code'}</span>
        </button>
      </div>

      {/* Latest Check-in Result or Alert Box */}
      {lastCheckinResult && (
        <div
          className={`p-4 rounded-xl border space-y-2 text-xs transition-all ${
            lastCheckinResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              {lastCheckinResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>
                {lastCheckinResult.success
                  ? language === 'rw'
                    ? 'Ubwishyu/Ubwemerere Bwemejwe (VERIFIED)'
                    : 'Arrival Successfully Verified'
                  : language === 'rw'
                  ? 'Gusobanuza Byanzwe (REJECTED)'
                  : 'Check-in Rejected'}
              </span>
            </div>

            <button
              onClick={() => setShowScannerModal(true)}
              className="text-[11px] font-semibold underline hover:no-underline text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{language === 'rw' ? 'Ongera Ugerageze' : 'Retry Scan'}</span>
            </button>
          </div>

          <p className="leading-relaxed font-medium">{lastCheckinResult.message}</p>

          {lastCheckinResult.checkin && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 font-mono text-[11px]">
              <div>
                <span className="text-emerald-800 block text-[10px] uppercase">Irrigation Block:</span>
                <span className="font-bold text-emerald-950">{lastCheckinResult.checkin.plotCode}</span>
              </div>
              <div>
                <span className="text-emerald-800 block text-[10px] uppercase">Verified Timestamp:</span>
                <span className="font-bold text-emerald-950">
                  {new Date(lastCheckinResult.checkin.checkinTime).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest Verified Arrival Overview */}
      {latestCheckin && !lastCheckinResult && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {language === 'rw' ? 'Aho Heruka Kwemezwa' : 'Latest Verified Site Arrival'}
              </span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              {latestCheckin.verificationStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <span className="text-slate-500 block text-[11px]">Block Code:</span>
              <span className="font-mono font-bold text-sky-800 text-sm">{latestCheckin.plotCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Check-in Date & Time:</span>
              <span className="font-mono font-medium text-slate-800">
                {new Date(latestCheckin.checkinTime).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">QR Tag ID:</span>
              <span className="font-mono text-slate-600 text-[11px]">{latestCheckin.qrCodeId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Check-in History List */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'rw' ? 'Urutonde rw\'Ibyemezo Biheruka' : 'Recent Arrival History'}</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Total: {checkins.length}</span>
        </div>

        <div className="space-y-2">
          {checkins.slice(0, 3).map((chk) => (
            <div
              key={chk.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    chk.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {chk.verificationStatus === 'VERIFIED' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <span className="font-mono font-bold text-slate-900 block">{chk.plotCode}</span>
                  <span className="text-[11px] text-slate-500">{chk.blockCode}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-slate-700 block font-medium">
                  {new Date(chk.checkinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(chk.checkinTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}

          {checkins.length === 0 && (
            <div className="py-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              {language === 'rw'
                ? 'Nta byemezo by\'amagesho birakorwa. Kanda "Sikana QR Code" haruguru.'
                : 'No arrival check-ins recorded yet. Tap "Sikana QR Code" above to log site arrival.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup */}
      <QrCodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanComplete={handleScanSubmit}
        farmerPlots={farmerPlots}
        language={language}
      />
    </div>
  );
};
