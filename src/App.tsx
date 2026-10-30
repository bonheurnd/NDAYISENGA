/**
 * GFI Nasho 1 Irrigation Scheme Management System & Farmer PWA
 * Kirehe District, Eastern Province, Rwanda
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { MobileNav } from './components/MobileNav.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import { HealthCheckComponent } from './components/HealthCheckComponent.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { FarmersView } from './components/FarmersView.tsx';
import { PlotsView } from './components/PlotsView.tsx';
import { SchedulesView } from './components/SchedulesView.tsx';
import { BillingView } from './components/BillingView.tsx';
import { MaintenanceView } from './components/MaintenanceView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { SmsLogsView } from './components/SmsLogsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { FarmerPortalView } from './components/FarmerPortalView.tsx';
import { AdminUsersView } from './components/AdminUsersView.tsx';
import { api } from './lib/services/api.ts';
import type {
  User,
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
  SchemeMetrics,
  Language,
  FarmerCheckin,
  QrPosterTemplate,
  IrrigationQuickLog,
} from './types/index.ts';
import { DEFAULT_POSTER_TEMPLATE } from './types/index.ts';
import {
  INITIAL_USERS,
  INITIAL_FARMERS,
  INITIAL_PLOTS,
  INITIAL_SCHEDULES,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_EQUIPMENT,
  INITIAL_WORK_ORDERS,
  INITIAL_COMPLAINTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TARIFFS,
  INITIAL_CHECKINS,
  INITIAL_QUICK_LOGS,
} from './lib/storage/mockData.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [availableUsers, setAvailableUsers] = useState<User[]>(INITIAL_USERS);

  // Core domain state
  const [metrics, setMetrics] = useState<SchemeMetrics>({
    activeFarmers: 5,
    registeredPlots: 7,
    cultivatedHectares: 10.4,
    upcomingSchedules: 3,
    reportedInterruptions: 2,
    outstandingInvoicesRwf: 215000,
    recordedPaymentsRwf: 150000,
    openMaintenanceJobs: 2,
    isDemoData: true,
  });
  const [farmers, setFarmers] = useState<Farmer[]>(INITIAL_FARMERS);
  const [plots, setPlots] = useState<Plot[]>(INITIAL_PLOTS);
  const [schedules, setSchedules] = useState<WaterSchedule[]>(INITIAL_SCHEDULES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(INITIAL_WORK_ORDERS);
  const [complaints, setComplaints] = useState<Complaint[]>(INITIAL_COMPLAINTS);
  const [notifications, setNotifications] = useState<SmsNotification[]>(INITIAL_NOTIFICATIONS);
  const [tariffs, setTariffs] = useState<Tariff[]>(INITIAL_TARIFFS);
  const [checkins, setCheckins] = useState<FarmerCheckin[]>(INITIAL_CHECKINS);
  const [quickLogs, setQuickLogs] = useState<IrrigationQuickLog[]>(INITIAL_QUICK_LOGS);
  const [posterTemplate, setPosterTemplate] = useState<QrPosterTemplate>(DEFAULT_POSTER_TEMPLATE);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from backend /api/v1
  const loadData = async () => {
    try {
      const [uData, mData, fData, pData, sData, iData, payData, eqData, woData, cData, nData, tData, chkData, qlData, tmplData, aData] =
        await Promise.all([
          api.getCurrentUser().catch(() => ({ user: INITIAL_USERS[0], availableUsers: INITIAL_USERS })),
          api.getMetrics().catch(() => metrics),
          api.getFarmers().catch(() => INITIAL_FARMERS),
          api.getPlots().catch(() => INITIAL_PLOTS),
          api.getSchedules().catch(() => INITIAL_SCHEDULES),
          api.getInvoices().catch(() => INITIAL_INVOICES),
          api.getPayments().catch(() => INITIAL_PAYMENTS),
          api.getEquipment().catch(() => INITIAL_EQUIPMENT),
          api.getWorkOrders().catch(() => INITIAL_WORK_ORDERS),
          api.getComplaints().catch(() => INITIAL_COMPLAINTS),
          api.getNotifications().catch(() => INITIAL_NOTIFICATIONS),
          api.getTariffs().catch(() => INITIAL_TARIFFS),
          api.getFarmerCheckins().catch(() => INITIAL_CHECKINS),
          api.getQuickLogs().catch(() => INITIAL_QUICK_LOGS),
          api.getQrTemplates().catch(() => [DEFAULT_POSTER_TEMPLATE]),
          api.getAuditLogs().catch(() => []),
        ]);

      setCurrentUser(uData.user);
      setAvailableUsers(uData.availableUsers);
      setMetrics(mData);
      setFarmers(fData);
      setPlots(pData);
      setSchedules(sData);
      setInvoices(iData);
      setPayments(payData);
      setEquipment(eqData);
      setWorkOrders(woData);
      setComplaints(cData);
      setNotifications(nData);
      setTariffs(tData);
      setCheckins(chkData);
      setQuickLogs(qlData);
      setPosterTemplate(tmplData[0] || DEFAULT_POSTER_TEMPLATE);
      setAuditLogs(aData);
    } catch (err) {
      console.warn('Backend loading warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Enforce role-based access control tab routing
  useEffect(() => {
    if (currentUser.role === 'FARMER' && !currentTab.startsWith('farmer-')) {
      setCurrentTab('farmer-portal');
    }
  }, [currentUser.role, currentTab]);

  // Handlers for state updates
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await api.switchRole(userId);
      setCurrentUser(res.user);
      // If switched to Farmer, automatically switch active tab to farmer-portal
      if (res.user.role === 'FARMER') {
        setCurrentTab('farmer-portal');
      }
      loadData();
    } catch (err) {
      const target = availableUsers.find((u) => u.id === userId);
      if (target) {
        setCurrentUser(target);
        if (target.role === 'FARMER') setCurrentTab('farmer-portal');
      }
    }
  };

  const handleAddFarmer = async (farmerData: Partial<Farmer>) => {
    const created = await api.createFarmer(farmerData);
    setFarmers((prev) => [created, ...prev]);
    loadData();
  };

  const handleUpdateFarmer = async (id: string, farmerData: Partial<Farmer>) => {
    const updated = await api.updateFarmer(id, farmerData);
    setFarmers((prev) => prev.map((f) => (f.id === id ? updated : f)));
    loadData();
    return updated;
  };

  const handleImportCsv = async (rows: any[]) => {
    const res = await api.importFarmersCsv(rows);
    if (res.imported && res.imported.length > 0) {
      setFarmers((prev) => [...res.imported, ...prev]);
    }
    loadData();
    return res;
  };

  const handleAddPlot = async (plotData: Partial<Plot>) => {
    const created = await api.createPlot(plotData);
    setPlots((prev) => [created, ...prev]);
    loadData();
  };

  const handleAddSchedule = async (scheduleData: Partial<WaterSchedule>) => {
    const created = await api.createSchedule(scheduleData);
    setSchedules((prev) => [created, ...prev]);
    loadData();
  };

  const handleApproveSchedule = async (id: string) => {
    await api.approveSchedule(id);
    loadData();
  };

  const handleRecordDelivery = async (id: string, deliveryData: any) => {
    await api.recordDelivery(id, deliveryData);
    loadData();
  };

  const handleCreateInvoice = async (invoiceData: any) => {
    const created = await api.createInvoice(invoiceData);
    setInvoices((prev) => [created, ...prev]);
    loadData();
  };

  const handleRecordPayment = async (paymentData: any) => {
    await api.recordPayment(paymentData);
    loadData();
  };

  const handleCreateWorkOrder = async (woData: any) => {
    const created = await api.createWorkOrder(woData);
    setWorkOrders((prev) => [created, ...prev]);
    loadData();
  };

  const handleUpdateWorkOrder = async (id: string, updateData: any) => {
    await api.updateWorkOrder(id, updateData);
    loadData();
  };

  const handleSubmitComplaint = async (complaintData: any) => {
    const created = await api.submitComplaint(complaintData);
    setComplaints((prev) => [created, ...prev]);
    loadData();
  };

  const handleSendSms = async (smsData: any) => {
    const created = await api.sendSms(smsData);
    setNotifications((prev) => [created, ...prev]);
  };

  const handleVerifyCheckin = async (qrData: string, manualPlotCode?: string) => {
    const res = await api.submitFarmerCheckin({ qrData, manualPlotCode });
    if (res.checkin) {
      setCheckins((prev) => [res.checkin!, ...prev]);
    }
    loadData();
    return {
      success: res.success,
      message: res.message,
      checkin: res.checkin,
    };
  };

  const handleSavePosterTemplate = async (templateData: QrPosterTemplate) => {
    const res = await api.saveQrTemplate(templateData);
    if (res.template) {
      setPosterTemplate(res.template);
    }
    loadData();
  };

  const handleSubmitQuickLog = async (logData: Partial<IrrigationQuickLog>) => {
    const res = await api.submitQuickLog(logData);
    if (res.log) {
      setQuickLogs((prev) => [res.log!, ...prev]);
      loadData();
    }
    return res;
  };

  // Find farmer object if current user is farmer
  const currentFarmer =
    farmers.find((f) => f.id === currentUser.farmerId) || farmers[0];

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        availableUsers={availableUsers}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'rw' : 'en'))}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          language={language}
          currentRole={currentUser.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 lg:pb-8">
          <ErrorBoundary language={language} onReset={loadData}>
            {currentTab === 'dashboard' && (
              <DashboardView
                metrics={metrics}
                schedules={schedules}
                invoices={invoices}
                payments={payments}
                workOrders={workOrders}
                quickLogs={quickLogs}
                plots={plots}
                currentRole={currentUser.role}
                language={language}
                onNavigate={setCurrentTab}
                onSubmitQuickLog={handleSubmitQuickLog}
              />
            )}

            {currentTab === 'farmers' && (
              <FarmersView
                farmers={farmers}
                plots={plots}
                language={language}
                currentRole={currentUser.role}
                onAddFarmer={handleAddFarmer}
                onUpdateFarmer={handleUpdateFarmer}
                onImportCsv={handleImportCsv}
              />
            )}

            {currentTab === 'plots' && (
              <PlotsView
                plots={plots}
                farmers={farmers}
                language={language}
                currentRole={currentUser.role}
                onAddPlot={handleAddPlot}
                posterTemplate={posterTemplate}
                onSavePosterTemplate={handleSavePosterTemplate}
              />
            )}

            {currentTab === 'schedules' && (
              <SchedulesView
                schedules={schedules}
                plots={plots}
                language={language}
                currentRole={currentUser.role}
                onAddSchedule={handleAddSchedule}
                onApproveSchedule={handleApproveSchedule}
                onRecordDelivery={handleRecordDelivery}
              />
            )}

            {currentTab === 'billing' && (
              <BillingView
                invoices={invoices}
                payments={payments}
                tariffs={tariffs}
                farmers={farmers}
                language={language}
                currentRole={currentUser.role}
                onCreateInvoice={handleCreateInvoice}
                onRecordPayment={handleRecordPayment}
              />
            )}

            {currentTab === 'maintenance' && (
              <MaintenanceView
                equipment={equipment}
                workOrders={workOrders}
                language={language}
                currentRole={currentUser.role}
                onCreateWorkOrder={handleCreateWorkOrder}
                onUpdateWorkOrder={handleUpdateWorkOrder}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsView
                farmers={farmers}
                plots={plots}
                schedules={schedules}
                invoices={invoices}
                payments={payments}
                equipment={equipment}
                workOrders={workOrders}
                auditLogs={auditLogs}
                language={language}
                currentRole={currentUser.role}
              />
            )}

            {currentTab === 'sms' && (
              <SmsLogsView
                notifications={notifications}
                farmers={farmers}
                language={language}
                onSendManualSms={handleSendSms}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                language={language}
                currentRole={currentUser.role}
              />
            )}

            {(currentTab === 'admin-users' || currentTab === 'admin') && (
              <AdminUsersView
                currentUser={currentUser}
                availableUsers={availableUsers}
                onSwitchUser={handleSwitchUser}
                language={language}
              />
            )}

            {(currentTab === 'farmer-portal' ||
              currentTab === 'farmer-schedules' ||
              currentTab === 'farmer-invoices' ||
              currentTab === 'farmer-complaints') && (
              <FarmerPortalView
                farmer={currentFarmer}
                plots={plots}
                schedules={schedules}
                invoices={invoices}
                payments={payments}
                complaints={complaints}
                checkins={checkins}
                language={language}
                onRefreshData={loadData}
                onSubmitComplaintOnline={handleSubmitComplaint}
                onVerifyCheckin={handleVerifyCheckin}
              />
            )}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Touch Navigation */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        language={language}
        currentRole={currentUser.role}
      />

      {/* Background Backend Health Check & Monitoring Toast */}
      <HealthCheckComponent language={language} />

      {/* Floating Offline Notification & Sync Alert */}
      <OfflineIndicator />
    </div>
  );
}
