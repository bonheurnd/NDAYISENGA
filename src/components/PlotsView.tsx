import React, { useState } from 'react';
import {
  Grid3X3,
  Plus,
  Compass,
  Layers,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Droplet,
  QrCode,
  Printer,
  FileText,
  Settings,
  Palette,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { Plot, Farmer, Language, UserRole, QrPosterTemplate } from '../types/index.ts';
import { DEFAULT_POSTER_TEMPLATE } from '../types/index.ts';
import { hasPermission } from '../lib/logic/permissions.ts';
import { generateBlockQrPayload } from '../lib/logic/checkin.ts';
import { BlockQrPosterModal } from './BlockQrPosterModal.tsx';
import { QrPosterConfigModal } from './QrPosterConfigModal.tsx';

interface PlotsViewProps {
  plots: Plot[];
  farmers: Farmer[];
  language: Language;
  currentRole: UserRole;
  onAddPlot: (plotData: Partial<Plot>) => Promise<void>;
  posterTemplate?: QrPosterTemplate;
  onSavePosterTemplate?: (template: QrPosterTemplate) => Promise<void>;
}

export const PlotsView: React.FC<PlotsViewProps> = ({
  plots,
  farmers,
  language,
  currentRole,
  onAddPlot,
  posterTemplate,
  onSavePosterTemplate,
}) => {
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'pivot-map'>('pivot-map');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);

  // Form states
  const [plotCode, setPlotCode] = useState('');
  const [blockCode, setBlockCode] = useState('BLOCK-A (Center Pivot 01)');
  const [areaHectares, setAreaHectares] = useState('1.5');
  const [irrigationType, setIrrigationType] = useState<Plot['irrigationType']>('CENTER_PIVOT');
  const [currentCrop, setCurrentCrop] = useState('Hybrid Maize');
  const [currentFarmerId, setCurrentFarmerId] = useState('');
  const [flowRate, setFlowRate] = useState('140');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManagePlots = hasPermission(currentRole, 'MANAGE_PLOTS');

  const filteredPlots = plots.filter((p) => {
    if (selectedBlock === 'ALL') return true;
    return p.blockCode.includes(selectedBlock);
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!plotCode.trim()) {
      setFormError('Plot code is required (e.g. BLK-A-P09).');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddPlot({
        plotCode: plotCode.trim().toUpperCase(),
        blockCode,
        areaHectares: parseFloat(areaHectares) || 1.2,
        irrigationType,
        currentCrop,
        currentFarmerId: currentFarmerId || undefined,
        flowRateM3PerHour: parseFloat(flowRate) || 140,
      });
      setShowAddModal(false);
      setPlotCode('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create plot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'rw' ? 'Imirima n\'Imashini za Center Pivot' : 'Plots & Center Pivot Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GFI Nasho 1 · Lake Nasho Irrigation System Blocks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Mode Switch */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('pivot-map')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'pivot-map'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pivot Spatial Layout
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer whitespace-nowrap shrink-0 ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Table
            </button>
          </div>

          {/* QR Posters Tool Button */}
          <button
            onClick={() => setShowPosterModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-600" />
            <span>{language === 'rw' ? 'Sohora Inyandiko za QR (PDF)' : 'Generate QR Posters (PDF)'}</span>
          </button>

          {/* QR Code Poster Customization Button */}
          {canManagePlots && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              title={language === 'rw' ? "Tegura imiterere n'ibirango by'ibyapa bya QR" : "Configure QR poster branding and layout"}
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span>{language === 'rw' ? "Tegura Imiterere y'Ibyapa bya QR" : "Configure QR Poster Template"}</span>
            </button>
          )}

          {canManagePlots && (
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'rw' ? 'Ongeraho Umurima' : 'Add Plot'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Block Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-medium mr-1">Filter Block:</span>
        {['ALL', 'BLOCK-A', 'BLOCK-B', 'BLOCK-C'].map((b) => (
          <button
            key={b}
            onClick={() => setSelectedBlock(b)}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              selectedBlock === b
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {b === 'ALL' ? 'All Blocks' : b}
          </button>
        ))}
      </div>

      {/* Interactive Pivot Spatial Representation (Visual Center Pivot Circle Schematic) */}
      {viewMode === 'pivot-map' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-600" />
                <span>Lake Nasho Center Pivot Spatial Architecture</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Schematic view of 50-hectare circular pivot spans in Block A & B, with lake water intake.
              </p>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Coordinates: 2°03'45"S 30°44'17"E
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Pivot CP-01 (Block A) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-800 mb-2">
                Pivot CP-01 (Block A · 50 Ha Total Radius)
              </span>

              {/* Center Pivot Circle Diagram */}
              <div className="relative w-64 h-64 flex items-center justify-center my-2">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-45">
                  {/* Outer circle */}
                  <circle cx="100" cy="100" r="90" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2" />
                  {/* Inner concentric track rings */}
                  <circle cx="100" cy="100" r="65" fill="none" stroke="#bae6fd" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="40" fill="none" stroke="#bae6fd" strokeWidth="1" strokeDasharray="3 3" />
                  
                  {/* Pivot Sectors (Quadrant Plots) */}
                  <path
                    d="M100,100 L100,10 A90,90 0 0,1 190,100 Z"
                    fill="#38bdf8"
                    fillOpacity="0.4"
                    className="hover:fill-opacity-80 transition cursor-pointer"
                    onClick={() => setSelectedPlot(plots.find((p) => p.plotCode === 'BLK-A-P01') || null)}
                  />
                  <path
                    d="M100,100 L190,100 A90,90 0 0,1 100,190 Z"
                    fill="#38bdf8"
                    fillOpacity="0.5"
                    className="hover:fill-opacity-80 transition cursor-pointer"
                    onClick={() => setSelectedPlot(plots.find((p) => p.plotCode === 'BLK-A-P02') || null)}
                  />
                  <path
                    d="M100,100 L100,190 A90,90 0 0,1 10,100 Z"
                    fill="#38bdf8"
                    fillOpacity="0.3"
                    className="hover:fill-opacity-80 transition cursor-pointer"
                    onClick={() => setSelectedPlot(plots.find((p) => p.plotCode === 'BLK-A-P03') || null)}
                  />
                  <path
                    d="M100,100 L10,100 A90,90 0 0,1 100,10 Z"
                    fill="#0284c7"
                    fillOpacity="0.2"
                    className="hover:fill-opacity-80 transition cursor-pointer"
                  />

                  {/* Center pivot tower base */}
                  <circle cx="100" cy="100" r="7" fill="#0369a1" />
                  <line x1="100" y1="100" x2="165" y2="35" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-xs text-slate-600 text-center space-y-1">
                <div>
                  <span className="font-semibold text-sky-800">Plots:</span> BLK-A-P01, BLK-A-P02, BLK-A-P03
                </div>
                <div className="text-[11px] text-slate-500">
                  Click any quadrant above to inspect plot tenancy & soil moisture.
                </div>
              </div>
            </div>

            {/* Pivot CP-02 (Block B) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col items-center">
              <span className="text-xs font-bold text-slate-800 mb-2">
                Pivot CP-02 (Block B · 45 Ha Total Radius)
              </span>

              {/* Center Pivot Circle Diagram */}
              <div className="relative w-64 h-64 flex items-center justify-center my-2">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-12">
                  <circle cx="100" cy="100" r="90" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="#bbf7d0" strokeWidth="1" strokeDasharray="3 3" />
                  
                  {/* Quadrant Plots */}
                  <path
                    d="M100,100 L100,10 A90,90 0 0,1 190,100 Z"
                    fill="#4ade80"
                    fillOpacity="0.4"
                    className="hover:fill-opacity-80 transition cursor-pointer"
                    onClick={() => setSelectedPlot(plots.find((p) => p.plotCode === 'BLK-B-P01') || null)}
                  />
                  <path
                    d="M100,100 L190,100 A90,90 0 0,1 100,190 Z"
                    fill="#4ade80"
                    fillOpacity="0.5"
                    className="hover:fill-opacity-80 transition cursor-pointer"
                    onClick={() => setSelectedPlot(plots.find((p) => p.plotCode === 'BLK-B-P02') || null)}
                  />
                  <circle cx="100" cy="100" r="7" fill="#15803d" />
                  <line x1="100" y1="100" x2="160" y2="40" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>

              <div className="text-xs text-slate-600 text-center space-y-1">
                <div>
                  <span className="font-semibold text-emerald-800">Plots:</span> BLK-B-P01, BLK-B-P02
                </div>
                <div className="text-[11px] text-slate-500">
                  Dedicated soybean seed multiplication rotation.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plots Table (Visible in grid mode or below map) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Plot Code</th>
                <th className="py-3 px-4">Block / Pivot Location</th>
                <th className="py-3 px-4">Irrigation Method</th>
                <th className="py-3 px-4">Current Crop</th>
                <th className="py-3 px-4">Current Farmer</th>
                <th className="py-3 px-4 text-right">Area (Ha)</th>
                <th className="py-3 px-4 text-right">Flow (m³/h)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPlots.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedPlot(p)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 font-mono font-bold text-sky-800">
                    {p.plotCode}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {p.blockCode}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {p.irrigationType.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {p.currentCrop || 'Fallow'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {p.currentFarmerName || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                    {p.areaHectares} Ha
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                    {p.flowRateM3PerHour || 120} m³/h
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-semibold ${
                        p.status === 'ACTIVE'
                          ? 'text-emerald-700'
                          : p.status === 'MAINTENANCE'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Plot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {language === 'rw' ? 'Kwandika Umurima Mushya' : 'Add New Irrigation Plot'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Plot Code *</label>
                  <input
                    type="text"
                    required
                    value={plotCode}
                    onChange={(e) => setPlotCode(e.target.value)}
                    placeholder="e.g. BLK-A-P05"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Block / Center Pivot</label>
                  <select
                    value={blockCode}
                    onChange={(e) => setBlockCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="BLOCK-A (Center Pivot 01)">BLOCK-A (Center Pivot 01)</option>
                    <option value="BLOCK-B (Center Pivot 02)">BLOCK-B (Center Pivot 02)</option>
                    <option value="BLOCK-C (Dragline Sector)">BLOCK-C (Dragline Sector)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Area in Hectares (Ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={areaHectares}
                    onChange={(e) => setAreaHectares(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Irrigation Method</label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="CENTER_PIVOT">Center Pivot</option>
                    <option value="SPRINKLER">Solid-Set Sprinkler</option>
                    <option value="DRAGLINE_SPRINKLER">Dragline Sprinkler</option>
                    <option value="DRIP">Drip Irrigation</option>
                    <option value="HOSE">Hose Reel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Assigned Farmer Member</label>
                  <select
                    value={currentFarmerId}
                    onChange={(e) => setCurrentFarmerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.fullName} ({f.farmerCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Current Crop</label>
                  <input
                    type="text"
                    value={currentCrop}
                    onChange={(e) => setCurrentCrop(e.target.value)}
                    placeholder="e.g. Hybrid Maize"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plot Detail Modal */}
      {selectedPlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedPlot.plotCode}</h3>
                <p className="text-xs text-slate-500">{selectedPlot.blockCode}</p>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Area:</span>
                <span className="font-semibold text-slate-800">{selectedPlot.areaHectares} Hectares</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Irrigation Method:</span>
                <span className="font-medium text-slate-800">{selectedPlot.irrigationType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Current Farmer:</span>
                <span className="font-semibold text-sky-800">{selectedPlot.currentFarmerName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Current Crop:</span>
                <span className="text-slate-800">{selectedPlot.currentCrop || 'Fallow'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Flow Rate:</span>
                <span className="font-mono text-slate-800">{selectedPlot.flowRateM3PerHour || 120} m³/h</span>
              </div>
              {selectedPlot.latitude && (
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">GPS Coordinates:</span>
                  <span className="font-mono text-slate-700">{selectedPlot.latitude}, {selectedPlot.longitude}</span>
                </div>
              )}

              {/* Official Site Arrival QR Code Tag */}
              <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl space-y-2 text-center">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>Official Site Arrival QR Tag</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <QRCodeSVG value={generateBlockQrPayload(selectedPlot)} size={140} level="H" />
                </div>
                <span className="font-mono text-[11px] font-bold text-sky-900">{selectedPlot.plotCode}</span>
                <span className="text-[10px] text-slate-400">Scan via Farmer Dashboard "Kwemeza Ko Nahageze"</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print QR Sign</span>
              </button>
              <button
                onClick={() => setSelectedPlot(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable PDF Poster Generator Tool Modal */}
      <BlockQrPosterModal
        isOpen={showPosterModal}
        onClose={() => setShowPosterModal(false)}
        plots={plots}
        template={posterTemplate || DEFAULT_POSTER_TEMPLATE}
        language={language}
      />

      {/* QR Code Poster Configuration Modal */}
      <QrPosterConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        activeTemplate={posterTemplate || DEFAULT_POSTER_TEMPLATE}
        onSaveTemplate={async (updated) => {
          if (onSavePosterTemplate) {
            await onSavePosterTemplate(updated);
          }
        }}
        samplePlot={plots[0] || {
          id: 'plt-001',
          plotCode: 'BLK-A-P01',
          blockCode: 'BLOCK-A (Center Pivot 01)',
          schemeName: 'GFI Nasho 1',
          areaHectares: 1.2,
          irrigationType: 'CENTER_PIVOT',
          currentCrop: 'Hybrid Maize',
          status: 'ACTIVE',
        }}
        language={language}
      />
    </div>
  );
};
