import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Table,
} from 'lucide-react';
import type {
  Farmer,
  Plot,
  WaterSchedule,
  Invoice,
  Payment,
  Equipment,
  WorkOrder,
  Language,
  UserRole,
} from '../types/index.ts';

interface ReportsViewProps {
  farmers: Farmer[];
  plots: Plot[];
  schedules: WaterSchedule[];
  invoices: Invoice[];
  payments: Payment[];
  equipment: Equipment[];
  workOrders: WorkOrder[];
  auditLogs: any[];
  language: Language;
  currentRole: UserRole;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  farmers,
  plots,
  schedules,
  invoices,
  payments,
  equipment,
  workOrders,
  auditLogs,
  language,
  currentRole,
}) => {
  const [reportType, setReportType] = useState<
    'water-delivery' | 'financial-reconciliation' | 'equipment-downtime' | 'audit-log'
  >('water-delivery');
  const [selectedSeason, setSelectedSeason] = useState('2026A');

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCurrentReport = () => {
    if (reportType === 'water-delivery') {
      const headers = 'ScheduleCode,PlotCode,Farmer,PlannedStart,PlannedM3,ActualM3,Status\n';
      const rows = schedules
        .map(
          (s) =>
            `${s.scheduleCode},${s.plotCode},"${s.farmerName}",${s.plannedStartTime},${s.plannedVolumeM3},${s.actualVolumeM3 || 'UNMEASURED'},${s.status}`
        )
        .join('\n');
      downloadCsv(`nasho1_water_delivery_${selectedSeason}.csv`, headers + rows);
    } else if (reportType === 'financial-reconciliation') {
      const headers = 'InvoiceNumber,Farmer,IssueDate,DueDate,TotalRWF,PaidRWF,BalanceRWF,Status\n';
      const rows = invoices
        .map(
          (i) =>
            `${i.invoiceNumber},"${i.farmerName}",${i.issueDate},${i.dueDate},${i.totalRwf},${i.amountPaidRwf},${i.balanceRwf},${i.status}`
        )
        .join('\n');
      downloadCsv(`nasho1_financial_reconciliation_${selectedSeason}.csv`, headers + rows);
    } else if (reportType === 'equipment-downtime') {
      const headers = 'AssetCode,Name,Condition,Status,OpenWorkOrders,DowntimeHours\n';
      const rows = equipment
        .map((e) => {
          const wos = workOrders.filter((w) => w.equipmentId === e.id);
          const totalDowntime = wos.reduce((sum, w) => sum + w.downtimeHours, 0);
          return `${e.assetCode},"${e.name}",${e.condition},${e.status},${wos.length},${totalDowntime}`;
        })
        .join('\n');
      downloadCsv(`nasho1_equipment_maintenance.csv`, headers + rows);
    } else if (reportType === 'audit-log') {
      const headers = 'Timestamp,Actor,Role,Action,Details\n';
      const rows = auditLogs
        .map((a) => `${a.timestamp},"${a.actor}",${a.role},${a.action},"${a.details}"`)
        .join('\n');
      downloadCsv(`nasho1_security_audit_trail.csv`, headers + rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'rw' ? 'Raporo n\'Igenzura ry\'Umushinga' : 'Scheme Reports & Independent Audit Trail'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-restricted operational disclosures for GFI Nasho 1 leadership, Water Users Organization (WUO), and Auditors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={exportCurrentReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector & Season Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto text-xs">
          <button
            onClick={() => setReportType('water-delivery')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              reportType === 'water-delivery'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Water Delivery & Variance
          </button>
          <button
            onClick={() => setReportType('financial-reconciliation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              reportType === 'financial-reconciliation'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Financial Reconciliation
          </button>
          <button
            onClick={() => setReportType('equipment-downtime')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              reportType === 'equipment-downtime'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Equipment & Downtime
          </button>
          <button
            onClick={() => setReportType('audit-log')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              reportType === 'audit-log'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Audit Trail
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
          <span className="text-slate-500 font-medium">Season:</span>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
          >
            <option value="2026A">Season 2026A</option>
            <option value="2025B">Season 2025B</option>
          </select>
        </div>
      </div>

      {/* Report 1: Water Delivery & Variance */}
      {reportType === 'water-delivery' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Water Scheduling vs Actual Flow Delivery Report
            </h3>
            <span className="text-[11px] text-slate-500">
              Notice: Missing flow-meter readings are explicitly tagged as Unmeasured
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Schedule #</th>
                  <th className="py-3 px-4">Plot & Pivot</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4 text-right">Planned (m³)</th>
                  <th className="py-3 px-4 text-right">Actual Measured (m³)</th>
                  <th className="py-3 px-4 text-right">Variance (m³)</th>
                  <th className="py-3 px-4">Delivery Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((s) => {
                  const actual = s.actualVolumeM3;
                  const variance = actual !== undefined ? actual - s.plannedVolumeM3 : null;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.scheduleCode}</td>
                      <td className="py-3 px-4 font-semibold text-sky-800">{s.plotCode}</td>
                      <td className="py-3 px-4 text-slate-700">{s.farmerName}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{s.plannedVolumeM3} m³</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {actual !== undefined ? `${actual} m³` : <span className="text-slate-400 font-normal">UNMEASURED</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {variance !== null ? (
                          <span className={variance <= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                            {variance > 0 ? `+${variance}` : variance} m³
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-semibold text-slate-700">{s.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Financial Reconciliation */}
      {reportType === 'financial-reconciliation' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Seasonal Revenue Reconciliation & Balance Aging
            </h3>
            <span className="text-[11px] font-mono text-slate-600">Currency: RWF</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Farmer / Payer</th>
                  <th className="py-3 px-4 text-right">Invoiced (RWF)</th>
                  <th className="py-3 px-4 text-right">Settled (RWF)</th>
                  <th className="py-3 px-4 text-right">Outstanding (RWF)</th>
                  <th className="py-3 px-4">Payment Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{inv.farmerName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{inv.totalRwf.toLocaleString()} RWF</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-medium">
                      {inv.amountPaidRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-rose-700">
                      {inv.balanceRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-slate-700">{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Equipment & Downtime */}
      {reportType === 'equipment-downtime' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Infrastructure Asset Reliability & Cumulative Downtime
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Asset Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-right">Recorded Downtime</th>
                  <th className="py-3 px-4 text-right">Open Work Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipment.map((eq) => {
                  const wos = workOrders.filter((w) => w.equipmentId === eq.id);
                  const totalDt = wos.reduce((sum, w) => sum + w.downtimeHours, 0);

                  return (
                    <tr key={eq.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">{eq.assetCode}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{eq.name}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{eq.condition}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-700 font-bold">
                        {totalDt} hours
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                        {wos.filter((w) => w.status !== 'COMPLETED').length} active
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 4: Audit Log */}
      {reportType === 'audit-log' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Cryptographic Audit Trail
            </h3>
            <span className="text-[11px] font-mono text-emerald-700">
              Rwanda Agricultural Data Governance Policy
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role Context</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.actor}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-sky-800">{log.role}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600 leading-normal">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
