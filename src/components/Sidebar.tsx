import React from 'react';
import {
  LayoutDashboard,
  Users,
  Grid3X3,
  Droplets,
  Receipt,
  Wrench,
  FileText,
  Smartphone,
  Sliders,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import type { Language, UserRole } from '../types/index.ts';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  currentRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  language,
  currentRole,
}) => {
  const isFarmerRole = currentRole === 'FARMER';

  const staffNavItems = [
    {
      id: 'dashboard',
      labelEn: 'Dashboard',
      labelRw: 'Ibonerana',
      icon: LayoutDashboard,
    },
    {
      id: 'farmers',
      labelEn: 'Farmers & Members',
      labelRw: 'Abahinzi n\'Abanyamuryango',
      icon: Users,
    },
    {
      id: 'plots',
      labelEn: 'Plots & Pivots',
      labelRw: 'Imirima na za Pivo',
      icon: Grid3X3,
    },
    {
      id: 'schedules',
      labelEn: 'Water Scheduling',
      labelRw: 'Gutegeka Amazi',
      icon: Droplets,
    },
    {
      id: 'billing',
      labelEn: 'Billing & Payments',
      labelRw: 'Ubwishyu n\'Inyemezabwishyu',
      icon: Receipt,
    },
    {
      id: 'maintenance',
      labelEn: 'Equipment & Repairs',
      labelRw: 'Ibikoresho n\'Isana',
      icon: Wrench,
    },
    {
      id: 'reports',
      labelEn: 'Reports & Audit Logs',
      labelRw: 'Raporo n\'Igenzura',
      icon: FileText,
    },
    {
      id: 'sms',
      labelEn: 'SMS Gateway Console',
      labelRw: 'Ubutumwa bwa SMS',
      icon: Smartphone,
    },
    {
      id: 'settings',
      labelEn: 'Scheme Settings & Specs',
      labelRw: 'Igenamiterere ry\'Umushinga',
      icon: Sliders,
    },
  ];

  const farmerNavItems = [
    {
      id: 'farmer-portal',
      labelEn: 'My Farm & Plots',
      labelRw: 'Umurima Wanjye',
      icon: Sprout,
    },
    {
      id: 'farmer-schedules',
      labelEn: 'Water Schedule',
      labelRw: 'Gahunda yo Kuhira',
      icon: Droplets,
    },
    {
      id: 'farmer-invoices',
      labelEn: 'Invoices & Receipts',
      labelRw: 'Inyemezabwishyu Zanjye',
      icon: Receipt,
    },
    {
      id: 'farmer-complaints',
      labelEn: 'Report Issue / Leak',
      labelRw: 'Tanga Ikibazo cy\'Amazi',
      icon: ShieldAlert,
    },
  ];

  const items = isFarmerRole ? farmerNavItems : staffNavItems;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200 bg-slate-50/50 min-h-[calc(100vh-57px)] p-4">
      <div className="px-3 py-2 mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
          {isFarmerRole
            ? (language === 'rw' ? 'Urubuga rw\'Umuhinzi' : 'Farmer Self-Service')
            : (language === 'rw' ? 'Ubuyobozi bw\'Umushinga' : 'Scheme Operations')}
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition text-left cursor-pointer ${
                isActive
                  ? 'bg-sky-100/80 text-sky-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-700' : 'text-slate-600'}`} />
              <span className="truncate">{language === 'rw' ? item.labelRw : item.labelEn}</span>
            </button>
          );
        })}
      </nav>

      {/* Switch between staff & farmer portal quick jump if staff */}
      {!isFarmerRole && (
        <div className="pt-4 border-t border-slate-200 mt-auto">
          <button
            onClick={() => onSelectTab('farmer-portal')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 transition"
          >
            <Sprout className="w-4 h-4 text-emerald-600" />
            <span>{language === 'rw' ? 'Reba nk\'Umuhinzi (PWA)' : 'Preview Farmer PWA'}</span>
          </button>
        </div>
      )}

      {isFarmerRole && (
        <div className="pt-4 border-t border-slate-200 mt-auto">
          <div className="text-[11px] text-slate-600 leading-normal">
            {language === 'rw'
              ? 'Ubu uri kureba nk\'umuhinzi Jean Bosco Mugisha (Umuryango w’Abakoresha Amazi Nasho WUO).'
              : 'Logged in as Member: Jean Bosco Mugisha (Nasho WUO).'}
          </div>
        </div>
      )}
    </aside>
  );
};
