import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Key,
  Database,
  ExternalLink,
  Layers,
} from 'lucide-react';
import type { Language, UserRole } from '../types/index.ts';

interface SettingsViewProps {
  language: Language;
  currentRole: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  currentRole,
}) => {
  const [schemeName, setSchemeName] = useState('GFI Nasho 1');
  const [district, setDistrict] = useState('Kirehe District');
  const [province, setProvince] = useState('Eastern Province, Rwanda');
  const [waterSource, setWaterSource] = useState('Lake Nasho / Lake Cyambwe');
  const [totalHectares, setTotalHectares] = useState('1173');
  const [pivotsCount, setPivotsCount] = useState('24');
  const [pumpStationCapacity, setPumpStationCapacity] = useState('2400');
  const [currency, setCurrency] = useState('RWF (Rwandan Franc)');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {language === 'rw' ? 'Igenamiterere ry\'Umushinga' : 'Scheme Parameters & Production Readiness'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          GFI Nasho 1 infrastructure baseline configuration & external integration credentials checklist
        </p>
      </div>

      {/* Mandatory Validation Disclosure */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-amber-800 block mb-1">
            MANDATORY PRE-PRODUCTION ACTION
          </span>
          Before deploying to live production, require GFI Nasho 1 management to validate the real farmer register, block/plot dimensions, irrigation timing policies, tariffs, approval authority roles, and financial collection workflows. Never invent or fabricate official Rwandan operational rules without WUO board approval.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheme Parameters Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <span>Scheme Operational Parameters</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-500">Configurable Baseline</span>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Scheme Identification</label>
              <input
                type="text"
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Province / Country</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Primary Water Source</label>
              <input
                type="text"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Command Area (Ha)</label>
                <input
                  type="number"
                  value={totalHectares}
                  onChange={(e) => setTotalHectares(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Center Pivots</label>
                <input
                  type="number"
                  value={pivotsCount}
                  onChange={(e) => setPivotsCount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Max Flow (m³/h)</label>
                <input
                  type="number"
                  value={pumpStationCapacity}
                  onChange={(e) => setPumpStationCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Base Currency</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-600 rounded-lg font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Parameters updated successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Save Scheme Settings
              </button>
            </div>
          </form>
        </div>

        {/* Integration Credentials & Architecture Checklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <span>External Service Integration Status</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Security Audit</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* MTN MoMo */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">MTN Rwanda Mobile Money Open API</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Pending Credentials
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Collection API (*182#) requires MTN MoMo Developer Subscription Key and Merchant Account ID. Payment recording currently operates in validated manual / mock mode.
              </p>
            </div>

            {/* Africa's Talking SMS */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Africa's Talking SMS Gateway</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Mock Gateway Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                SMS notifications in Kinyarwanda & English are simulated with delivery receipts and phone simulator. Production requires <code>AFRICASTALKING_API_KEY</code> and RURA Sender ID <code>GFINASHO</code>.
              </p>
            </div>

            {/* PostgreSQL DRF Scaffold */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Django REST Framework & PostgreSQL</span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                  Scaffold Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Complete Django models, migrations, Dockerfile, docker-compose.yml, and setup docs generated in <code>/backend_django/</code>.
              </p>
            </div>

            {/* PWA Offline Sync */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">PWA Manifest & Safe Offline Sync</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Active & Enforcing Rules
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Offline read support active; complaints and water interruption reports queue locally and auto-sync. Financial actions strictly prohibited offline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
