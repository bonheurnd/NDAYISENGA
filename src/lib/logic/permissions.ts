/**
 * Role-Based Access Control (RBAC) Matrix for GFI Nasho 1.
 */

import type { UserRole } from '../../types/index.ts';

export type PermissionAction =
  | 'VIEW_DASHBOARD'
  | 'MANAGE_USERS'
  | 'CONFIG_SCHEME'
  | 'VIEW_FARMERS'
  | 'CREATE_FARMER'
  | 'EDIT_FARMER'
  | 'IMPORT_FARMERS'
  | 'MANAGE_PLOTS'
  | 'CREATE_SCHEDULE'
  | 'APPROVE_SCHEDULE'
  | 'RECORD_DELIVERY'
  | 'RECORD_INTERRUPTION'
  | 'CREATE_INVOICE'
  | 'RECORD_PAYMENT'
  | 'RECONCILE_FINANCES'
  | 'CREATE_WORK_ORDER'
  | 'UPDATE_MAINTENANCE'
  | 'VIEW_ALL_REPORTS'
  | 'VIEW_AUDIT_LOGS'
  | 'SUBMIT_QUICK_LOG'
  | 'FARMER_PORTAL_ONLY';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_USERS',
    'CONFIG_SCHEME',
    'VIEW_FARMERS',
    'CREATE_FARMER',
    'EDIT_FARMER',
    'IMPORT_FARMERS',
    'MANAGE_PLOTS',
    'CREATE_SCHEDULE',
    'APPROVE_SCHEDULE',
    'RECORD_DELIVERY',
    'RECORD_INTERRUPTION',
    'CREATE_INVOICE',
    'RECORD_PAYMENT',
    'RECONCILE_FINANCES',
    'CREATE_WORK_ORDER',
    'UPDATE_MAINTENANCE',
    'VIEW_ALL_REPORTS',
    'VIEW_AUDIT_LOGS',
    'SUBMIT_QUICK_LOG',
  ],
  SCHEME_MANAGER: [
    'VIEW_DASHBOARD',
    'CONFIG_SCHEME',
    'VIEW_FARMERS',
    'CREATE_FARMER',
    'EDIT_FARMER',
    'IMPORT_FARMERS',
    'MANAGE_PLOTS',
    'CREATE_SCHEDULE',
    'APPROVE_SCHEDULE',
    'RECORD_DELIVERY',
    'RECORD_INTERRUPTION',
    'CREATE_INVOICE',
    'RECORD_PAYMENT',
    'RECONCILE_FINANCES',
    'CREATE_WORK_ORDER',
    'UPDATE_MAINTENANCE',
    'VIEW_ALL_REPORTS',
    'VIEW_AUDIT_LOGS',
    'SUBMIT_QUICK_LOG',
  ],
  WATER_OPERATOR: [
    'VIEW_DASHBOARD',
    'VIEW_FARMERS',
    'MANAGE_PLOTS',
    'CREATE_SCHEDULE',
    'RECORD_DELIVERY',
    'RECORD_INTERRUPTION',
    'VIEW_ALL_REPORTS',
    'SUBMIT_QUICK_LOG',
  ],
  FINANCE_OFFICER: [
    'VIEW_DASHBOARD',
    'VIEW_FARMERS',
    'CREATE_INVOICE',
    'RECORD_PAYMENT',
    'RECONCILE_FINANCES',
    'VIEW_ALL_REPORTS',
    'VIEW_AUDIT_LOGS',
    'SUBMIT_QUICK_LOG',
  ],
  MAINTENANCE_TECH: [
    'VIEW_DASHBOARD',
    'MANAGE_PLOTS',
    'CREATE_WORK_ORDER',
    'UPDATE_MAINTENANCE',
    'VIEW_ALL_REPORTS',
    'SUBMIT_QUICK_LOG',
  ],
  WUA_OFFICER: [
    'VIEW_DASHBOARD',
    'VIEW_FARMERS',
    'CREATE_FARMER',
    'EDIT_FARMER',
    'IMPORT_FARMERS',
    'MANAGE_PLOTS',
    'VIEW_ALL_REPORTS',
    'SUBMIT_QUICK_LOG',
  ],
  FARMER: [
    'FARMER_PORTAL_ONLY',
  ],
  AUDITOR: [
    'VIEW_DASHBOARD',
    'VIEW_FARMERS',
    'MANAGE_PLOTS',
    'VIEW_ALL_REPORTS',
    'VIEW_AUDIT_LOGS',
  ],
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(action) : false;
}

export function canApproveSchedule(role: UserRole): boolean {
  return hasPermission(role, 'APPROVE_SCHEDULE');
}

export function canCreateInvoice(role: UserRole): boolean {
  return hasPermission(role, 'CREATE_INVOICE');
}

export function canRecordPayment(role: UserRole): boolean {
  return hasPermission(role, 'RECORD_PAYMENT');
}

export function canManageMaintenance(role: UserRole): boolean {
  return hasPermission(role, 'UPDATE_MAINTENANCE');
}
