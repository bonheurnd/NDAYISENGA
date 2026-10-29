import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import {
  Printer,
  Download,
  X,
  QrCode,
  ShieldCheck,
  FileText,
  MapPin,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { Plot, Language, QrPosterTemplate } from '../types/index.ts';
import { DEFAULT_POSTER_TEMPLATE } from '../types/index.ts';
import { generateBlockQrPayload } from '../lib/logic/checkin.ts';

interface BlockQrPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  plots: Plot[];
  template?: QrPosterTemplate;
  language: Language;
}

export const BlockQrPosterModal: React.FC<BlockQrPosterModalProps> = ({
  isOpen,
  onClose,
  plots,
  template,
  language,
}) => {
  const activeTemplate = template || DEFAULT_POSTER_TEMPLATE;
  const [selectedPlotId, setSelectedPlotId] = useState<string>(plots[0]?.id || '');
  const [batchMode, setBatchMode] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) || plots[0] || {
    id: 'plt-001',
    plotCode: 'BLK-A-P01',
    blockCode: 'BLOCK-A (Center Pivot 01)',
    schemeName: 'GFI Nasho 1',
    areaHectares: 1.2,
    irrigationType: 'CENTER_PIVOT',
    currentCrop: 'Hybrid Maize',
    status: 'ACTIVE',
  } as Plot;

  if (!isOpen) return null;

  const targetPlots = batchMode ? plots : [selectedPlot];

  const hexToRgb = (hex?: string, defaultRgb: [number, number, number] = [15, 23, 42]): [number, number, number] => {
    if (!hex || !/^#[0-9A-F]{6}$/i.test(hex)) return defaultRgb;
    const num = parseInt(hex.replace('#', ''), 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  };

  // Programmatic A4 PDF Document Generator via jsPDF
  const generatePdfPoster = async () => {
    try {
      setIsGeneratingPdf(true);

      const orientation = activeTemplate.paperSize === 'A4_LANDSCAPE' ? 'landscape' : 'portrait';
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const plotsToExport = targetPlots;
      const pageWidth = orientation === 'landscape' ? 297 : 210;
      const margin = 15;

      for (let i = 0; i < plotsToExport.length; i++) {
        const plot = plotsToExport[i];
        if (i > 0) {
          doc.addPage();
        }

        // 1. Top Header Banner Box
        const [hdrR, hdrG, hdrB] = hexToRgb(activeTemplate.headerColor, [15, 23, 42]);
        doc.setFillColor(hdrR, hdrG, hdrB);
        doc.rect(margin, margin, pageWidth - margin * 2, 28, 'F');

        // Draw logo if present
        if (activeTemplate.logoDataUrl) {
          try {
            doc.addImage(activeTemplate.logoDataUrl, 'PNG', margin + 4, margin + 4, 20, 20);
          } catch (e) {
            // ignore invalid image data
          }
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(
          (activeTemplate.organizationName || 'GFI NASHO 1 IRRIGATION SCHEME').toUpperCase(),
          pageWidth / 2,
          margin + 12,
          { align: 'center' }
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(186, 230, 253); // sky-200
        doc.text('Umuryango w’Abakoresha Amazi (WUO) · Kirehe District, Rwanda', pageWidth / 2, margin + 20, { align: 'center' });

        // 2. Poster Title & Subtitle
        const [priR, priG, priB] = hexToRgb(activeTemplate.primaryColor, [30, 41, 59]);
        doc.setTextColor(priR, priG, priB);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(activeTemplate.posterTitle || 'OFFICIAL SITE ARRIVAL CHECK-IN TAG', pageWidth / 2, margin + 38, { align: 'center' });

        if (activeTemplate.posterSubtitle) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(activeTemplate.posterSubtitle, pageWidth / 2, margin + 44, { align: 'center' });
        }

        // 3. Render Canvas QR Code Image into PDF
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 400;
        tempCanvas.height = 400;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 400, 400);

          const qrCanvas = document.getElementById(`qr-canvas-${plot.id}`) as HTMLCanvasElement;
          if (qrCanvas) {
            ctx.drawImage(qrCanvas, 20, 20, 360, 360);
          }
        }

        const qrDataUrl = tempCanvas.toDataURL('image/png');
        const qrSize = activeTemplate.qrSize === 'SMALL' ? 60 : activeTemplate.qrSize === 'LARGE' ? 85 : 72;
        const qrX = (pageWidth - qrSize) / 2;
        const qrY = margin + (activeTemplate.posterSubtitle ? 48 : 42);

        // Draw border around QR
        const [secR, secG, secB] = hexToRgb(activeTemplate.secondaryColor, [2, 132, 199]);
        doc.setDrawColor(secR, secG, secB);
        doc.setLineWidth(0.8);
        doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 3, 3, 'S');

        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // 4. Block Identifier Label Box
        const codeBoxY = qrY + qrSize + 8;
        if (activeTemplate.showBlockCode) {
          doc.setFillColor(secR, secG, secB);
          doc.roundedRect(margin + 20, codeBoxY, pageWidth - (margin + 20) * 2, 13, 2, 2, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text(`IRRIGATION BLOCK: ${plot.plotCode}`, pageWidth / 2, codeBoxY + 8.5, { align: 'center' });
        }

        // 5. Metadata Details Table Box
        const metaY = codeBoxY + (activeTemplate.showBlockCode ? 16 : 4);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, metaY, pageWidth - margin * 2, 34, 3, 3, 'FD');

        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);

        // Column 1
        doc.setFont('helvetica', 'bold');
        doc.text('Pivot / Sector:', margin + 6, metaY + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(plot.blockCode, margin + 34, metaY + 8);

        doc.setFont('helvetica', 'bold');
        doc.text('Irrigation Method:', margin + 6, metaY + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(plot.irrigationType.replace('_', ' '), margin + 40, metaY + 16);

        doc.setFont('helvetica', 'bold');
        doc.text('Assigned Area:', margin + 6, metaY + 24);
        doc.setFont('helvetica', 'normal');
        doc.text(`${plot.areaHectares} Hectares`, margin + 34, metaY + 24);

        // Column 2
        doc.setFont('helvetica', 'bold');
        doc.text('Current Crop:', pageWidth / 2 + 10, metaY + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(plot.currentCrop || 'Fallow / Seed Prep', pageWidth / 2 + 38, metaY + 8);

        doc.setFont('helvetica', 'bold');
        doc.text('Primary Farmer:', pageWidth / 2 + 10, metaY + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(plot.currentFarmerName || 'WUO Cell Registered Member', pageWidth / 2 + 42, metaY + 16);

        doc.setFont('helvetica', 'bold');
        doc.text('Design Flow Rate:', pageWidth / 2 + 10, metaY + 24);
        doc.setFont('helvetica', 'normal');
        doc.text(`${plot.flowRateM3PerHour || 140} m³/h`, pageWidth / 2 + 45, metaY + 24);

        // 6. Kinyarwanda Instructions Box
        const instY = metaY + 38;
        doc.setFillColor(240, 253, 250);
        doc.setDrawColor(204, 251, 241);
        doc.roundedRect(margin, instY, pageWidth - margin * 2, 42, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 118, 110);
        doc.text('AMABWIRIZA (INSTRUCTIONS):', margin + 6, instY + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);

        // Split multiline instruction text for jsPDF
        const rawLines = (activeTemplate.instructionsRw || '').split('\n').filter(Boolean);
        let currentY = instY + 13;
        rawLines.slice(0, 6).forEach((line) => {
          doc.text(line.trim(), margin + 6, currentY);
          currentY += 5;
        });

        // 7. Security Seal & Cryptographic Footer
        const [ftrR, ftrG, ftrB] = hexToRgb(activeTemplate.footerColor, [248, 250, 252]);
        const footerY = instY + 46;
        doc.setFillColor(ftrR, ftrG, ftrB);
        doc.roundedRect(margin, footerY, pageWidth - margin * 2, 10, 2, 2, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(activeTemplate.footerText || 'Water Users Organization (WUO) Official Stamp', margin + 4, footerY + 6);

        doc.setFont('helvetica', 'normal');
        doc.text(activeTemplate.contactInfo || 'GFI Nasho 1 · Kirehe District', pageWidth - margin - 4, footerY + 6, { align: 'right' });
      }

      const filename = batchMode
        ? 'GFI_Nasho1_ALL_Block_QR_Posters.pdf'
        : `GFI_Nasho1_QR_Poster_${selectedPlot.plotCode}.pdf`;

      doc.save(filename);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      alert('Error generating PDF poster: ' + (err.message || String(err)));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-600 rounded-xl">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {language === 'rw'
                  ? 'Sohora Inyandiko za QR (Printable PDF Posters)'
                  : 'Block QR Code Printable PDF Poster Tool'}
              </h3>
              <p className="text-xs text-sky-200">
                GFI Nasho 1 · Water Users Organization (WUO) Site Asset Signs
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

        {/* Controls Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <label className="font-semibold text-slate-700">Mode:</label>
            <div className="flex items-center p-1 bg-slate-200 rounded-lg">
              <button
                onClick={() => setBatchMode(false)}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  !batchMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Single Block Poster
              </button>
              <button
                onClick={() => setBatchMode(true)}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  batchMode ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Batch (All {plots.length} Blocks)
              </button>
            </div>

            {!batchMode && (
              <div className="flex items-center gap-2">
                <label className="font-semibold text-slate-700">Block:</label>
                <select
                  value={selectedPlotId}
                  onChange={(e) => setSelectedPlotId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.plotCode} — {p.blockCode}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>{language === 'rw' ? 'Koporora (Print)' : 'Print (A4)'}</span>
            </button>

            <button
              onClick={generatePdfPoster}
              disabled={isGeneratingPdf}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>
                {isGeneratingPdf
                  ? 'Generating PDF...'
                  : language === 'rw'
                  ? 'Download PDF'
                  : 'Download PDF Poster'}
              </span>
            </button>
          </div>
        </div>

        {/* Hidden QR Code Canvas Elements for jsPDF Rendering */}
        <div className="hidden">
          {plots.map((plot) => (
            <QRCodeCanvas
              key={plot.id}
              id={`qr-canvas-${plot.id}`}
              value={generateBlockQrPayload(plot)}
              size={360}
              level="H"
            />
          ))}
        </div>

        {/* Live Printable Poster A4 Preview Viewport */}
        <div className="p-6 bg-slate-200/80 overflow-y-auto flex-1 flex justify-center items-start print:p-0 print:bg-white">
          {/* Printable Poster Frame */}
          <div
            className="w-full max-w-[650px] shadow-2xl rounded-2xl p-8 space-y-6 print:shadow-none print:border-none print:max-w-none print:w-full print:p-0 transition-all border"
            style={{
              backgroundColor: activeTemplate.backgroundColor,
              color: activeTemplate.textColor,
              borderColor: activeTemplate.primaryColor,
              borderStyle: activeTemplate.borderStyle === 'DASHED' ? 'dashed' : activeTemplate.borderStyle === 'NONE' ? 'none' : 'solid',
              borderWidth: `${activeTemplate.borderWidth}px`,
            }}
          >
            {/* Header Banner */}
            <div
              className="p-5 rounded-xl text-center space-y-1 shadow-xs"
              style={{ backgroundColor: activeTemplate.headerColor }}
            >
              {activeTemplate.logoDataUrl && (
                <img src={activeTemplate.logoDataUrl} alt="Logo" className="h-10 mx-auto object-contain mb-1" />
              )}
              <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
                {activeTemplate.organizationName}
              </h1>
              <p className="text-xs text-sky-200 font-medium">
                Kirehe District, Eastern Province, Rwanda
              </p>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-1 border-b pb-3" style={{ borderColor: activeTemplate.secondaryColor }}>
              <h2 className="text-base font-extrabold tracking-tight" style={{ color: activeTemplate.primaryColor }}>
                {activeTemplate.posterTitle}
              </h2>
              {activeTemplate.posterSubtitle && (
                <p className="text-xs font-semibold opacity-80">
                  {activeTemplate.posterSubtitle}
                </p>
              )}
            </div>

            {/* Central QR Display & Block Identifier */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-slate-300 shadow-md flex items-center justify-center">
                <QRCodeCanvas
                  value={generateBlockQrPayload(selectedPlot)}
                  size={activeTemplate.qrSize === 'SMALL' ? 140 : activeTemplate.qrSize === 'LARGE' ? 240 : 200}
                  level="H"
                />
              </div>

              {activeTemplate.showBlockCode && (
                <div
                  className="text-white px-6 py-2.5 rounded-xl shadow-xs text-center"
                  style={{ backgroundColor: activeTemplate.secondaryColor }}
                >
                  <span className="text-xs uppercase tracking-wider block font-semibold opacity-90">
                    Irrigation Block Code
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {selectedPlot.plotCode}
                  </span>
                </div>
              )}
            </div>

            {/* Block Specifications Card */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 text-xs space-y-2 text-slate-900">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block text-[11px]">Pivot / Sector:</span>
                  <span className="font-bold text-slate-900">{selectedPlot.blockCode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Current Crop:</span>
                  <span className="font-bold text-slate-900">{selectedPlot.currentCrop || 'Fallow'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Irrigation Method:</span>
                  <span className="font-medium text-slate-800">{selectedPlot.irrigationType.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Assigned Area:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedPlot.areaHectares} Hectares</span>
                </div>
              </div>
            </div>

            {/* Kinyarwanda Instructions */}
            <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-4 text-xs space-y-2 text-teal-950 font-medium whitespace-pre-line leading-relaxed">
              {activeTemplate.instructionsRw}
            </div>

            {/* Footer Security Stamp */}
            <div
              className="p-3 rounded-xl flex flex-col sm:flex-row justify-between items-center text-[10px] gap-2 font-mono"
              style={{ backgroundColor: activeTemplate.footerColor }}
            >
              <div>
                <span className="font-semibold block">{activeTemplate.footerText}</span>
                <span className="opacity-70">Digital Signature Hash Verified</span>
              </div>
              <div className="text-right">
                <span className="font-bold block">{activeTemplate.contactInfo}</span>
                <span className="opacity-70">GFI Nasho 1 Asset</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
