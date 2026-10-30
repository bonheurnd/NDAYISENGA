import React from 'react';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import type { Language, User, UserRole } from '../types/index.ts';
import { useTheme } from '../context/ThemeContext.tsx';
import { Sun, Moon, Droplets, Bell, Calendar, UserCheck } from 'lucide-react';

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
  const { theme, toggleTheme } = useTheme();

  // Current date formatted for Africa/Kigali
  const kigaliDateStr = new Intl.DateTimeFormat(language === 'rw' ? 'rw-RW' : 'en-US', {
    timeZone: 'Africa/Kigali',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Brand & Scheme Badge */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left cursor-pointer group"
        >
          <div className="p-2 bg-emerald-700 dark:bg-emerald-600 text-white rounded-xl shadow-xs group-hover:bg-emerald-800 transition-colors">
            <Droplets className="w-5 h-5 text-sky-200" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
              GFI Nasho 1
            </div>
            <div className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 leading-tight mt-0.5">
              Imicungire y'Amazi · WUO
            </div>
          </div>
        </button>

        {/* Africa/Kigali Date Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 font-medium">
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-mono text-[11px]">{kigaliDateStr}</span>
        </div>
      </div>

      {/* Top Navigation Links */}
      <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 ${
            currentTab === 'dashboard'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
              : ''
          }`}
        >
          {language === 'rw' ? 'Ibonerana' : 'Dashboard'}
        </button>
        <button
          onClick={() => onSelectTab('schedules')}
          className={`hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 ${
            currentTab === 'schedules'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
              : ''
          }`}
        >
          {language === 'rw' ? 'Gutegeka Amazi' : 'Scheduling'}
        </button>
        <button
          onClick={() => onSelectTab('farmers')}
          className={`hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 ${
            currentTab === 'farmers'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
              : ''
          }`}
        >
          {language === 'rw' ? 'Abahinzi' : 'Farmers'}
        </button>
        <button
          onClick={() => onSelectTab('billing')}
          className={`hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 ${
            currentTab === 'billing'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
              : ''
          }`}
        >
          {language === 'rw' ? 'Ubwishyu' : 'Billing'}
        </button>
        <button
          onClick={() => onSelectTab('farmer-portal')}
          className={`hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer py-1 ${
            currentTab === 'farmer-portal'
              ? 'text-emerald-700 dark:text-emerald-400 font-bold border-b-2 border-emerald-600'
              : ''
          }`}
        >
          {language === 'rw' ? 'Umuhinzi (PWA)' : 'Farmer PWA'}
        </button>
      </nav>

      {/* Action Cluster (User Profile, Notifications, Theme, Role Selector, Language, PWA) */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* User Identity Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-xl">
          <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
          <div className="text-[11px] leading-tight">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">{currentUser.name}</span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium">
              {formatRoleName(currentUser.role)}
            </span>
          </div>
        </div>

        {/* Notifications trigger badge */}
        <button
          onClick={() => onSelectTab('sms')}
          className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Notifications & SMS Logs"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Language switch */}
        <button
          onClick={onToggleLanguage}
          className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition whitespace-nowrap shrink-0"
          title="Toggle English / Ikinyarwanda"
          aria-label={`Switch language from ${language.toUpperCase()}`}
        >
          {language === 'en' ? 'RW' : 'EN'}
        </button>

        {/* Role context dropdown */}
        <div className="flex items-center gap-1">
          <label htmlFor="role-select" className="sr-only">
            Active Role
          </label>
          <select
            id="role-select"
            value={currentUser.id}
            onChange={(e) => onSwitchUser(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 whitespace-nowrap cursor-pointer"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({formatRoleName(u.role)})
              </option>
            ))}
          </select>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton label={language === 'rw' ? 'Shyira' : 'Install'} />
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
