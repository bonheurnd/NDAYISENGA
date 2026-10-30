import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Building2,
  Key,
  CheckCircle2,
  AlertCircle,
  Search,
  UserCheck,
  Lock,
  Layers,
  Settings,
} from 'lucide-react';
import type { User, UserRole, Language } from '../types/index.ts';
import { hasPermission } from '../lib/logic/permissions.ts';

interface AdminUsersViewProps {
  currentUser: User;
  availableUsers: User[];
  onSwitchUser: (userId: string) => void;
  language: Language;
}

const ROLE_DESCRIPTIONS_EN: Record<UserRole, string> = {
  SUPER_ADMIN: 'Full system authorization, infrastructure baseline configuration, and user management.',
  SCHEME_MANAGER: 'Water distribution policy approval, tariff configuration, and scheme reporting.',
  WATER_OPERATOR: 'Daily pump station operation, valve control, and water delivery execution.',
  FINANCE_OFFICER: 'Levy invoicing, MTN MoMo deposit verification, and financial reconciliation.',
  MAINTENANCE_TECH: 'Center pivot repairs, pump station servicing, and equipment work orders.',
  WUA_OFFICER: 'Water Users Organization (WUO) member rolls, plot tenure, and farmer support.',
  FARMER: 'Self-service plot arrival verification, water allocation calendar, and invoice payment.',
  AUDITOR: 'Read-only financial, operational, and system audit trail inspection.',
};

const ROLE_DESCRIPTIONS_RW: Record<UserRole, string> = {
  SUPER_ADMIN: 'Uburenganzira bwose mu gukoresha sisitemu n’Igenamiterere ry’umushinga.',
  SCHEME_MANAGER: 'Kwemeza gahunda zo kuhira, ibiciro by’amazi n’uko kugawa ku bahinzi.',
  WATER_OPERATOR: 'Gukoresha za pompe, gufungura no gufunga za pivo mu mirima.',
  FINANCE_OFFICER: 'Kwandika inyemezabwishyu n’ibyo abahinzi bishyuye kuri MTN MoMo.',
  MAINTENANCE_TECH: 'Gusana za pivo, gukurikirana ibikoresho n’amapompe arimo ikibazo.',
  WUA_OFFICER: 'Kwandika abanyamuryango ba WUO, kwandika imirima n’uburenganzira.',
  FARMER: 'Gusoma QR code yo kwemeza ko wageze ku murima, kureba no kwishyura inyemezabwishyu.',
  AUDITOR: 'Kureba raporo z’ubwisungane n’uburyo amatsinda akora bila guhindura amakuru.',
};

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({
  currentUser,
  availableUsers,
  onSwitchUser,
  language,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  const filteredUsers = availableUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {language === 'rw'
                ? 'Ubuyobozi bw’Abakoresha Sisitemu n’Inshingano (Users & Roles)'
                : 'System User Directory & Role Authorization'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            GFI Nasho 1 Water Users Organization (WUO) Role-Based Access Control (RBAC) Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
            {availableUsers.length} Active System Accounts
          </span>
        </div>
      </div>

      {/* WUO Organization Governance Summary Banner */}
      <div className="p-4 bg-emerald-900 text-white rounded-xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Umuryango w’Abakoresha Amazi Nasho 1 (WUO) — Governance Board</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded uppercase">
            RURA Approved
          </span>
        </div>
        <p className="text-xs text-emerald-100 leading-relaxed">
          System access strictly mirrors authorized operational roles at GFI Nasho 1 Irrigation Scheme in Kirehe District. All financial transactions, water allocations, and maintenance changes generate permanent audit logs tied to the verified staff or member profile.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={
              language === 'rw'
                ? 'Shakisha izina, emeyili, cyangwa inshingano...'
                : 'Search users by name, email, or role...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={selectedRoleFilter}
          onChange={(e) => setSelectedRoleFilter(e.target.value)}
          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          <option value="ALL" className="dark:bg-slate-800">All Authorized Roles</option>
          <option value="SUPER_ADMIN" className="dark:bg-slate-800">Super Admin</option>
          <option value="SCHEME_MANAGER" className="dark:bg-slate-800">Scheme Manager</option>
          <option value="WATER_OPERATOR" className="dark:bg-slate-800">Water Operator</option>
          <option value="FINANCE_OFFICER" className="dark:bg-slate-800">Finance Officer</option>
          <option value="MAINTENANCE_TECH" className="dark:bg-slate-800">Technician</option>
          <option value="WUA_OFFICER" className="dark:bg-slate-800">WUO Officer</option>
          <option value="FARMER" className="dark:bg-slate-800">Farmer</option>
          <option value="AUDITOR" className="dark:bg-slate-800">Auditor</option>
        </select>
      </div>

      {/* User Accounts Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Role Description & Scope</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Switch Active Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredUsers.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/40 font-medium'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-700/40'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.email}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                        <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{u.role}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-md">
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                        {language === 'rw' ? ROLE_DESCRIPTIONS_RW[u.role] : ROLE_DESCRIPTIONS_EN[u.role]}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                          Active Account
                        </span>
                      ) : (
                        <button
                          onClick={() => onSwitchUser(u.id)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                        >
                          {language === 'rw' ? 'Koresha konti' : 'Switch Role'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No users found matching your search term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
