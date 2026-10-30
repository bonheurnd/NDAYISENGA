import React, { useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  Calendar,
  Building2,
} from 'lucide-react';
import type { Language, UserRole } from '../types/index.ts';
import { hasPermission } from '../lib/logic/permissions.ts';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: Language;
  currentRole: UserRole;
  onOpenQuickLog?: () => void;
}

interface NavGroup {
  id: string;
  titleEn: string;
  titleRw: string;
  items: Array<{
    id: string;
    labelEn: string;
    labelRw: string;
    icon: React.ElementType;
    isAction?: boolean;
    requiredPermission?: Parameters<typeof hasPermission>[1];
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  language,
  currentRole,
  onOpenQuickLog,
}) => {
  const isFarmerRole = currentRole === 'FARMER';

  // Grouped Navigation for Staff Roles
  const staffGroups: NavGroup[] = [
    {
      id: 'overview',
      titleEn: 'Overview',
      titleRw: 'Ibonerana',
      items: [
        {
          id: 'dashboard',
          labelEn: 'Operations Dashboard',
          labelRw: 'Ibonerana ry\'Umushinga',
          icon: LayoutDashboard,
          requiredPermission: 'VIEW_DASHBOARD',
        },
      ],
    },
    {
      id: 'irrigation',
      titleEn: 'Irrigation & Water',
      titleRw: 'Kuhira n\'Kugawa Amazi',
      items: [
        {
          id: 'schedules',
          labelEn: 'Water Scheduling',
          labelRw: 'Gutegeka Amazi',
          icon: Droplets,
          requiredPermission: 'CREATE_SCHEDULE',
        },
        {
          id: 'plots',
          labelEn: 'Irrigation Blocks & Pivots',
          labelRw: 'Imirima na za Pivo',
          icon: Grid3X3,
          requiredPermission: 'MANAGE_PLOTS',
        },
      ],
    },
    {
      id: 'farmers',
      titleEn: 'Farmers & Membership',
      titleRw: 'Abahinzi n\'Umuryango',
      items: [
        {
          id: 'farmers',
          labelEn: 'Farmer Directory (WUO)',
          labelRw: 'Urutonde rw\'Abahinzi',
          icon: Users,
          requiredPermission: 'VIEW_FARMERS',
        },
        {
          id: 'farmer-portal',
          labelEn: 'Farmer PWA & Check-in',
          labelRw: 'Urubuga rw\'Umuhinzi (PWA)',
          icon: Sprout,
        },
      ],
    },
    {
      id: 'finance',
      titleEn: 'Finance & Levy',
      titleRw: 'Ubwishyu n\'Inyemezabwishyu',
      items: [
        {
          id: 'billing',
          labelEn: 'Billing & Payments',
          labelRw: 'Inyemezabwishyu n\'Ubwishyu',
          icon: Receipt,
          requiredPermission: 'CREATE_INVOICE',
        },
      ],
    },
    {
      id: 'operations',
      titleEn: 'Field Operations',
      titleRw: 'Ibikorwa byo mu Murima',
      items: [
        {
          id: 'quick-log',
          labelEn: 'Quick Field Log',
          labelRw: 'Andika Raporo Yihuse',
          icon: ClipboardList,
          isAction: true,
          requiredPermission: 'SUBMIT_QUICK_LOG',
        },
        {
          id: 'maintenance',
          labelEn: 'Equipment & Repairs',
          labelRw: 'Ibikoresho n\'Isana',
          icon: Wrench,
          requiredPermission: 'CREATE_WORK_ORDER',
        },
        {
          id: 'sms',
          labelEn: 'SMS Gateway Console',
          labelRw: 'Ubutumwa bwa SMS',
          icon: Smartphone,
          requiredPermission: 'VIEW_DASHBOARD',
        },
      ],
    },
    {
      id: 'administration',
      titleEn: 'Administration',
      titleRw: 'Ubuyobozi',
      items: [
        {
          id: 'admin-users',
          labelEn: 'Users & Roles (WUO)',
          labelRw: 'Abakoresha n\'Inshingano',
          icon: ShieldCheck,
          requiredPermission: 'MANAGE_USERS',
        },
        {
          id: 'reports',
          labelEn: 'Reports & Audit Logs',
          labelRw: 'Raporo n\'Igenzura',
          icon: FileText,
          requiredPermission: 'VIEW_ALL_REPORTS',
        },
        {
          id: 'settings',
          labelEn: 'Scheme Configuration',
          labelRw: 'Igenamiterere ry\'Umushinga',
          icon: Sliders,
          requiredPermission: 'CONFIG_SCHEME',
        },
      ],
    },
  ];

  // Farmer Portal Navigation Items
  const farmerGroup: NavGroup = {
    id: 'farmer-pwa',
    titleEn: 'Farmer Self-Service',
    titleRw: 'Urubuga rw\'Umuhinzi',
    items: [
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
    ],
  };

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overview: true,
    irrigation: true,
    farmers: true,
    finance: true,
    operations: true,
    administration: true,
    'farmer-pwa': true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const groupsToDisplay = isFarmerRole ? [farmerGroup] : staffGroups;

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs min-h-[calc(100vh-61px)] p-3.5 transition-colors">
      {/* Header Context Indicator */}
      <div className="px-3 py-2 mb-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" />
          <span>
            {isFarmerRole
              ? (language === 'rw' ? 'Umuhinzi · Nasho WUO' : 'Farmer Portal')
              : (language === 'rw' ? 'GFI Nasho 1 · Kirehe' : 'GFI Nasho 1 Scheme')}
          </span>
        </div>
      </div>

      {/* Grouped Sidebar Items */}
      <nav className="flex-1 space-y-3 overflow-y-auto scrollbar-thin pr-1">
        {groupsToDisplay.map((group) => {
          // Check if group has authorized items
          const visibleItems = group.items.filter((item) => {
            if (!item.requiredPermission) return true;
            return hasPermission(currentRole, item.requiredPermission);
          });

          if (visibleItems.length === 0) return null;

          const isExpanded = expandedGroups[group.id] !== false;

          return (
            <div key={group.id} className="space-y-1">
              {/* Category Group Title Button */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer select-none"
              >
                <span>{language === 'rw' ? group.titleRw : group.titleEn}</span>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Group Children */}
              {isExpanded && (
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;

                    const handleClick = () => {
                      if (item.id === 'quick-log') {
                        if (onOpenQuickLog) onOpenQuickLog();
                        else onSelectTab('dashboard');
                      } else {
                        onSelectTab(item.id);
                      }
                    };

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={handleClick}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition text-left cursor-pointer ${
                          isActive
                            ? 'bg-emerald-700 text-white font-bold shadow-xs dark:bg-emerald-600'
                            : item.isAction
                            ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? 'text-white'
                              : item.isAction
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        />
                        <span className="truncate">{language === 'rw' ? item.labelRw : item.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Switch between staff & farmer portal quick jump if staff */}
      {!isFarmerRole && (
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-auto">
          <button
            type="button"
            onClick={() => onSelectTab('farmer-portal')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60 transition cursor-pointer border border-emerald-200/80 dark:border-emerald-800/80"
          >
            <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{language === 'rw' ? 'Reba nk\'Umuhinzi (PWA)' : 'Preview Farmer PWA'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
