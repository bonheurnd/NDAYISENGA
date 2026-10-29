import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { Plot, Language } from '../types/index.ts';
import { generateBlockQrPayload } from '../lib/logic/checkin.ts';

interface QrCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (qrData: string, manualPlotCode?: string) => Promise<void>;
  farmerPlots: Plot[];
  language: Language;
}

export const QrCodeScannerModal: React.FC<QrCodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  farmerPlots,
  language,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'select'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlotCode, setSelectedPlotCode] = useState(farmerPlots[0]?.plotCode || 'BLK-A-P01');

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-viewport';

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  const stopCameraStream = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
        html5QrcodeRef.current.clear();
      } catch (e) {
        console.warn('Camera stream cleanup notice:', e);
      } finally {
        html5QrcodeRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startCameraScanner = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      await stopCameraStream();

      const html5Qrcode = new Html5Qrcode(scannerContainerId);
      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Successfully scanned QR code
          await stopCameraStream();
          handleScannedData(decodedText);
        },
        (_errorMessage) => {
          // Frame parse failure - continue scanning silently
        }
      );
    } catch (err: any) {
      setIsScanning(false);
      const errMsg = err.message || String(err);

      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
        setCameraError(
          language === 'rw'
            ? 'Uruhushya rwo gukoresha kamera rwanzwe. Nyamuneka yemerere mushakisha gukoresha kamera cyangwa hitamo umurima hasi.'
            : 'Camera permission denied. Please allow camera access in browser settings or use manual site selection below.'
        );
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('Requested device not found')) {
        setCameraError(
          language === 'rw'
            ? 'Nta kamera yabonywe kuri iyi telefoni/mudasobwa. Koresha uburyo bwo guhitamo umurima wawe.'
            : 'No active camera detected. Please use the site block selection mode below.'
        );
      } else {
        setCameraError(
          language === 'rw'
            ? `Ntabwo kamera ibashije gutangira: ${errMsg}`
            : `Camera initialization error: ${errMsg}`
        );
      }
    }
  };

  const handleScannedData = async (rawQr: string, manualCode?: string) => {
    try {
      setIsProcessing(true);
      await onScanComplete(rawQr, manualCode);
      onClose();
    } catch (e: any) {
      console.error('Scan processing error:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    const matched = farmerPlots.find((p) => p.plotCode === selectedPlotCode) || farmerPlots[0];
    const generatedQr = generateBlockQrPayload(matched || { plotCode: selectedPlotCode, blockCode: 'BLOCK-A', id: 'plt-001' } as Plot);
    await handleScannedData(generatedQr, selectedPlotCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-600 rounded-xl">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'rw' ? 'Sikana QR Code y\'Umurima' : 'Scan Block Arrival QR Code'}
              </h3>
              <p className="text-xs text-sky-200 font-mono">
                GFI Nasho 1 · Water Users Organization (WUO)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          <button
            onClick={() => {
              setActiveMode('camera');
              setCameraError(null);
            }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeMode === 'camera'
                ? 'border-sky-600 bg-white text-sky-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{language === 'rw' ? 'Kamera (Camera)' : 'Live Camera'}</span>
          </button>
          <button
            onClick={() => {
              stopCameraStream();
              setActiveMode('select');
            }}
            className={`flex-1 py-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              activeMode === 'select'
                ? 'border-sky-600 bg-white text-sky-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{language === 'rw' ? 'Hitamo Umurima (Simulator)' : 'Site Selection Mode'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeMode === 'camera' && (
            <div className="space-y-4">
              {/* Camera Preview Viewport */}
              <div className="relative w-full aspect-square max-w-[320px] mx-auto bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex flex-col items-center justify-center shadow-inner">
                <div id={scannerContainerId} className="w-full h-full object-cover" />

                {!isScanning && !cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-white space-y-3">
                    <QrCode className="w-12 h-12 text-sky-400 animate-pulse" />
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {language === 'rw' ? 'Kanda "Tangira Gusikana"' : 'Ready to Scan Site Sign'}
                      </h4>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {language === 'rw'
                          ? 'Gukoresha kamera bizagusaba uruhushya mbere yo gutangira.'
                          : 'Press button below to request camera permission and start live QR scan.'}
                      </p>
                    </div>
                    <button
                      onClick={startCameraScanner}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{language === 'rw' ? 'Tangira Gusikana' : 'Start Camera Scan'}</span>
                    </button>
                  </div>
                )}

                {isScanning && (
                  <div className="absolute inset-x-0 bottom-3 text-center">
                    <span className="text-[10px] font-bold bg-slate-900/80 text-sky-300 px-3 py-1 rounded-full border border-sky-500/40 shadow-sm backdrop-blur-xs">
                      {language === 'rw' ? 'Shyira QR Code mu kagozi...' : 'Align site QR code inside frame...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Camera Errors & Retry */}
              {cameraError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{cameraError}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={startCameraScanner}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{language === 'rw' ? 'Ongera Ugerageze' : 'Retry Camera'}</span>
                    </button>
                    <button
                      onClick={() => setActiveMode('select')}
                      className="px-3 py-1.5 bg-white border border-rose-300 text-rose-900 hover:bg-rose-100/60 font-semibold rounded-lg cursor-pointer"
                    >
                      {language === 'rw' ? 'Koresha Guhitamo Umurima' : 'Switch to Site Selection'}
                    </button>
                  </div>
                </div>
              )}

              {/* Stop Stream Button when scanning */}
              {isScanning && (
                <div className="flex justify-center">
                  <button
                    onClick={stopCameraStream}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>{language === 'rw' ? 'Hagarika Kamera' : 'Stop Camera'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeMode === 'select' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-sky-900 leading-relaxed space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-sky-950">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  <span>{language === 'rw' ? 'Kugenzura Umurima Wahawe' : 'Assigned Site Block Verification'}</span>
                </span>
                <p className="text-[11px] text-sky-800">
                  {language === 'rw'
                    ? 'Select your current physical location at GFI Nasho 1 to test or verify site arrival credentials.'
                    : 'Select your assigned irrigation pivot section below. The system will cryptographically sign and verify your site check-in.'}
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {language === 'rw' ? 'Umurima Wahawe (Block Code) *' : 'Assigned Irrigation Block Code *'}
                </label>
                <select
                  value={selectedPlotCode}
                  onChange={(e) => setSelectedPlotCode(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {farmerPlots.map((p) => (
                    <option key={p.id} value={p.plotCode}>
                      {p.plotCode} — {p.blockCode} ({p.currentCrop || 'Crop'})
                    </option>
                  ))}
                  {farmerPlots.length === 0 && (
                    <option value="BLK-A-P01">BLK-A-P01 — BLOCK-A (Center Pivot 01)</option>
                  )}
                </select>
              </div>

              <button
                onClick={handleManualSubmit}
                disabled={isProcessing}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>
                  {language === 'rw'
                    ? 'Emeza Ko Ugeze ku Murima'
                    : 'Verify Arrival at Selected Block'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 shrink-0">
          <span>Official WUO Site Verification</span>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg cursor-pointer"
          >
            {language === 'rw' ? 'Funga' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
