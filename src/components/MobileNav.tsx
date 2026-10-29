import React from 'react';
import { LayoutDashboard, Users, Droplets, Receipt, Sprout } from 'lucide-react';
import type { Language, UserRole } from '../types/index.ts';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  currentRole: UserRole;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  language,
  currentRole,
}) => {
  const isFarmer = currentRole === 'FARMER';

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto">
        <button
          onClick={() => onSelectTab(isFarmer ? 'farmer-portal' : 'dashboard')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition ${
            currentTab === 'dashboard' || currentTab === 'farmer-portal'
              ? 'text-sky-700 font-semibold'
              : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label={isFarmer ? 'Home' : 'Dashboard'}
        >
          {isFarmer ? <Sprout className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}
          <span className="text-[10px] font-medium tracking-tight mt-1">
            {isFarmer ? (language === 'rw' ? 'Ahabanza' : 'Home') : (language === 'rw' ? 'Ibonerana' : 'Dashboard')}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('farmers')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition ${
            currentTab === 'farmers' ? 'text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Farmers"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            {language === 'rw' ? 'Abahinzi' : 'Farmers'}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('schedules')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition ${
            currentTab === 'schedules' ? 'text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Water Scheduling"
        >
          <Droplets className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            {language === 'rw' ? 'Amazi' : 'Water'}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('billing')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition ${
            currentTab === 'billing' ? 'text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Billing"
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            {language === 'rw' ? 'Ubwishyu' : 'Billing'}
          </span>
        </button>

        <button
          onClick={() => onSelectTab('farmer-portal')}
          className={`min-h-[48px] flex flex-col items-center justify-center transition ${
            currentTab === 'farmer-portal' ? 'text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-800'
          }`}
          aria-label="Farmer Portal"
        >
          <Sprout className="w-5 h-5 text-emerald-600" />
          <span className="text-[10px] font-medium tracking-tight mt-1">
            {language === 'rw' ? 'PWA' : 'Farmer PWA'}
          </span>
        </button>
      </div>
    </nav>
  );
};
