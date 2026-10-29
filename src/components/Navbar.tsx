import React from 'react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import type { Language, User, UserRole } from '../types/index.ts';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  availableUsers: User[];
  language: Language;
  onToggleLanguage: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onSwitchUser,
  availableUsers,
  language,
  onToggleLanguage,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
      >
        GFI Nasho 1
      </button>

      {/* Zone 2: 4–5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'dashboard' ? 'text-sky-700 font-semibold border-b-2 border-sky-600 pb-0.5' : ''
          }`}
        >
          {language === 'rw' ? 'Ibonerana' : 'Dashboard'}
        </button>
        <button
          onClick={() => onSelectTab('farmers')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'farmers' ? 'text-sky-700 font-semibold border-b-2 border-sky-600 pb-0.5' : ''
          }`}
        >
          {language === 'rw' ? 'Abahinzi' : 'Farmers'}
        </button>
        <button
          onClick={() => onSelectTab('schedules')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'schedules' ? 'text-sky-700 font-semibold border-b-2 border-sky-600 pb-0.5' : ''
          }`}
        >
          {language === 'rw' ? 'Gutegeka Amazi' : 'Scheduling'}
        </button>
        <button
          onClick={() => onSelectTab('billing')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'billing' ? 'text-sky-700 font-semibold border-b-2 border-sky-600 pb-0.5' : ''
          }`}
        >
          {language === 'rw' ? 'Ubwishyu' : 'Billing'}
        </button>
        <button
          onClick={() => onSelectTab('farmer-portal')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentTab === 'farmer-portal' ? 'text-sky-700 font-semibold border-b-2 border-sky-600 pb-0.5' : ''
          }`}
        >
          {language === 'rw' ? 'Umuhinzi (PWA)' : 'Farmer Portal'}
        </button>
      </nav>

      {/* Zone 3: 1 primary action cluster (Role switch, Language & PWA Install) */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Language switch */}
        <button
          onClick={onToggleLanguage}
          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition whitespace-nowrap shrink-0"
          title="Toggle English / Ikinyarwanda"
          aria-label={`Switch language from ${language.toUpperCase()}`}
        >
          {language === 'en' ? 'RW (Kinyarwanda)' : 'EN (English)'}
        </button>

        {/* Role context dropdown */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="role-select" className="sr-only">
            Active Role
          </label>
          <select
            id="role-select"
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 whitespace-nowrap"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({formatRoleName(u.role)})
              </option>
            ))}
          </select>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton label={language === 'rw' ? 'Shyira muri Telefoni' : 'Install PWA'} />
      </div>
    </header>
  );
};

function formatRoleName(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'SCHEME_MANAGER':
      return 'Scheme Manager';
    case 'WATER_OPERATOR':
      return 'Water Operator';
    case 'FINANCE_OFFICER':
      return 'Finance Officer';
    case 'MAINTENANCE_TECH':
      return 'Technician';
    case 'WUA_OFFICER':
      return 'WUO Officer';
    case 'FARMER':
      return 'Farmer';
    case 'AUDITOR':
      return 'Auditor';
    default:
      return role;
  }
}
