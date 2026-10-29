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
  Sun,
  Moon,
} from 'lucide-react';
import type { Language, UserRole } from '../types/index.ts';
import { useTheme } from '../context/ThemeContext.tsx';

interface SettingsViewProps {
  language: Language;
  currentRole: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  currentRole,
}) => {
  const { theme, setTheme } = useTheme();

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
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'rw' ? 'Igenamiterere ry\'Umushinga' : 'Scheme Parameters & Production Readiness'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          GFI Nasho 1 infrastructure baseline configuration & external integration credentials checklist
        </p>
      </div>

      {/* Theme Settings Section (Imiterere y'Amabara) */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>Imiterere y'Amabara (Appearance)</span>
          </h2>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
            {theme === 'dark' ? 'Dark Mode Active' : 'Light Mode Active'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Light Mode / Dark Mode
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Hitamo amabara akorohera kureba muri system.
            </p>

            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={theme === 'light'}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-pressed={theme === 'dark'}
              >
                <Moon className="w-4 h-4 text-sky-400" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Validation Disclosure */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
            MANDATORY PRE-PRODUCTION ACTION
          </span>
          Before deploying to live production, require GFI Nasho 1 management to validate the real farmer register, block/plot dimensions, irrigation timing policies, tariffs, approval authority roles, and financial collection workflows. Never invent or fabricate official Rwandan operational rules without WUO board approval.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheme Parameters Form */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Scheme Operational Parameters</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Configurable Baseline</span>
          </div>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Scheme Identification</label>
              <input
                type="text"
                value={schemeName}
                onChange={(e) => setSchemeName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Province / Country</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Primary Water Source</label>
              <input
                type="text"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Command Area (Ha)</label>
                <input
                  type="number"
                  value={totalHectares}
                  onChange={(e) => setTotalHectares(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Center Pivots</label>
                <input
                  type="number"
                  value={pivotsCount}
                  onChange={(e) => setPivotsCount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Max Flow (m³/h)</label>
                <input
                  type="number"
                  value={pumpStationCapacity}
                  onChange={(e) => setPumpStationCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Base Currency</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 rounded-lg font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess && (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Parameters updated successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-4 py-2 bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Save Scheme Settings
              </button>
            </div>
          </form>
        </div>

        {/* Integration Credentials & Architecture Checklist */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>External Service Integration Status</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Security Audit</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* MTN MoMo */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">MTN Rwanda Mobile Money Open API</span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                  Pending Credentials
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Collection API (*182#) requires MTN MoMo Developer Subscription Key and Merchant Account ID. Payment recording currently operates in validated manual / mock mode.
              </p>
            </div>

            {/* Africa's Talking SMS */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">Africa's Talking SMS Gateway</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                  Mock Gateway Active
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                SMS notifications in Kinyarwanda & English are simulated with delivery receipts and phone simulator. Production requires <code>AFRICASTALKING_API_KEY</code> and RURA Sender ID <code>GFINASHO</code>.
              </p>
            </div>

            {/* PostgreSQL DRF Scaffold */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">Django REST Framework & PostgreSQL</span>
                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded">
                  Scaffold Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete Django models, migrations, Dockerfile, docker-compose.yml, and setup docs generated in <code>/backend_django/</code>.
              </p>
            </div>

            {/* PWA Offline Sync */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">PWA Manifest & Safe Offline Sync</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                  Active & Enforcing Rules
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Offline read support active; complaints and water interruption reports queue locally and auto-sync. Financial actions strictly prohibited offline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
