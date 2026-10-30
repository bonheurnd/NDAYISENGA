/**
 * REST API Client for /api/v1/
 * Connects to the Express backend with local cache persistence.
 */

import {
  Farmer,
  Plot,
  WaterSchedule,
  Invoice,
  Payment,
  Equipment,
  WorkOrder,
  Complaint,
  SmsNotification,
  Tariff,
  User,
  SchemeMetrics,
  FarmerCheckin,
  QrPosterTemplate,
  IrrigationQuickLog,
} from '../../types/index.ts';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const err = await res.json();
      errorMsg = err.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  getCurrentUser: () => fetchJson<{ user: User; availableUsers: User[] }>('/auth/me'),
  switchRole: (userId: string, role?: string) =>
    fetchJson<{ success: boolean; user: User }>('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),

  // Health
  getHealth: () =>
    fetchJson<{
      status: string;
      scheme: string;
      district?: string;
      timezone?: string;
      version?: string;
      database?: string;
      isDemoMode?: boolean;
    }>('/health'),

  // Metrics
  getMetrics: () => fetchJson<SchemeMetrics>('/metrics'),

  // Farmers
  getFarmers: () => fetchJson<Farmer[]>('/farmers'),
  createFarmer: (data: Partial<Farmer>) =>
    fetchJson<Farmer>('/farmers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFarmer: (id: string, data: Partial<Farmer>) =>
    fetchJson<Farmer>(`/farmers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  importFarmersCsv: (rows: any[]) =>
    fetchJson<{ importedCount: number; errorCount: number; errors: any[]; imported: Farmer[] }>(
      '/farmers/import-csv',
      {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }
    ),

  // Plots
  getPlots: () => fetchJson<Plot[]>('/plots'),
  createPlot: (data: Partial<Plot>) =>
    fetchJson<Plot>('/plots', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Schedules
  getSchedules: () => fetchJson<WaterSchedule[]>('/schedules'),
  createSchedule: (data: Partial<WaterSchedule>) =>
    fetchJson<WaterSchedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveSchedule: (id: string) =>
    fetchJson<{ success: boolean; schedule: WaterSchedule }>(`/schedules/${id}/approve`, {
      method: 'POST',
    }),
  recordDelivery: (id: string, data: any) =>
    fetchJson<{ success: boolean; schedule: WaterSchedule }>(`/schedules/${id}/deliver`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tariffs & Billing
  getTariffs: () => fetchJson<Tariff[]>('/tariffs'),
  getInvoices: () => fetchJson<Invoice[]>('/billing/invoices'),
  createInvoice: (data: any) =>
    fetchJson<Invoice>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayments: () => fetchJson<Payment[]>('/billing/payments'),
  recordPayment: (data: any) =>
    fetchJson<{ payment: Payment; updatedInvoice: Invoice }>('/billing/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Equipment & Maintenance
  getEquipment: () => fetchJson<Equipment[]>('/equipment'),
  getWorkOrders: () => fetchJson<WorkOrder[]>('/work-orders'),
  createWorkOrder: (data: any) =>
    fetchJson<WorkOrder>('/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWorkOrder: (id: string, data: any) =>
    fetchJson<{ success: boolean; workOrder: WorkOrder }>(`/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Complaints
  getComplaints: () => fetchJson<Complaint[]>('/complaints'),
  submitComplaint: (data: any) =>
    fetchJson<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // SMS Notifications
  getNotifications: () => fetchJson<SmsNotification[]>('/notifications'),
  sendSms: (data: any) =>
    fetchJson<SmsNotification>('/notifications/send-sms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Offline Sync
  syncEvents: (events: any[]) =>
    fetchJson<{ processed: number; results: any[] }>('/sync', {
      method: 'POST',
      body: JSON.stringify({ events }),
    }),

  // Farmer Check-ins
  getFarmerCheckins: () => fetchJson<FarmerCheckin[]>('/farmer/check-ins'),
  submitFarmerCheckin: (data: { qrData?: string; manualPlotCode?: string }) =>
    fetchJson<{
      success: boolean;
      verificationStatus: string;
      message: string;
      checkin?: FarmerCheckin;
      plot?: Plot;
      schedule?: WaterSchedule;
    }>('/farmer/check-ins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // QR Poster Templates
  getQrTemplates: () => fetchJson<QrPosterTemplate[]>('/qr-templates'),
  saveQrTemplate: (template: QrPosterTemplate) =>
    fetchJson<{ success: boolean; template: QrPosterTemplate }>('/qr-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    }),

  // Quick Logs API
  getQuickLogs: (params?: { date?: string; blockCode?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.blockCode) query.append('blockCode', params.blockCode);
    if (params?.status) query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return fetchJson<IrrigationQuickLog[]>(`/irrigation/quick-logs${queryString}`);
  },
  submitQuickLog: (data: Partial<IrrigationQuickLog>) =>
    fetchJson<{
      success: boolean;
      log: IrrigationQuickLog;
      isDuplicate?: boolean;
      message: string;
    }>('/irrigation/quick-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Logs
  getAuditLogs: () => fetchJson<any[]>('/audit-logs'),
};

