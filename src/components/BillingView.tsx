import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  ShieldCheck,
  Printer,
  Smartphone,
} from 'lucide-react';
import type { Invoice, Payment, Tariff, Farmer, Language, UserRole } from '../types/index.ts';
import { canCreateInvoice, canRecordPayment } from '../lib/logic/permissions.ts';

interface BillingViewProps {
  invoices: Invoice[];
  payments: Payment[];
  tariffs: Tariff[];
  farmers: Farmer[];
  language: Language;
  currentRole: UserRole;
  onCreateInvoice: (invoiceData: any) => Promise<void>;
  onRecordPayment: (paymentData: any) => Promise<void>;
}

export const BillingView: React.FC<BillingViewProps> = ({
  invoices,
  payments,
  tariffs,
  farmers,
  language,
  currentRole,
  onCreateInvoice,
  onRecordPayment,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'payments' | 'tariffs'>('invoices');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Invoice creation form states
  const [targetFarmerId, setTargetFarmerId] = useState(farmers[0]?.id || '');
  const [itemDescription, setItemDescription] = useState('Center Pivot Seasonal Water Levy');
  const [quantity, setQuantity] = useState('2.4');
  const [unitRate, setUnitRate] = useState('45000');
  const [dueDate, setDueDate] = useState('2026-11-15');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment recording form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('MTN_MOMO');
  const [txRef, setTxRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const allowInvoice = canCreateInvoice(currentRole);
  const allowPayment = canRecordPayment(currentRole);

  const handleCreateInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!targetFarmerId) {
      setFormError('Farmer selection is required.');
      return;
    }
    const qty = parseFloat(quantity) || 1;
    const rate = parseFloat(unitRate) || 45000;
    const lineTotal = qty * rate;

    try {
      setIsSubmitting(true);
      await onCreateInvoice({
        farmerId: targetFarmerId,
        season: '2026A',
        dueDate,
        lineItems: [
          {
            id: `li-${Date.now()}`,
            description: `${itemDescription} (${qty} Ha @ ${rate.toLocaleString()} RWF)`,
            quantity: qty,
            unit: 'Ha',
            unitPriceRwf: rate,
            totalRwf: lineTotal,
          },
        ],
      });
      setShowInvoiceModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;
    setFormError('');

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Payment amount must be greater than zero.');
      return;
    }
    if (!txRef.trim()) {
      setFormError('Transaction reference is required (e.g. MOMO ID or Bank Slip #).');
      return;
    }

    // Generate unique idempotency key to prevent double posting
    const idempotencyKey = `IDEM-${paymentMethod}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      setIsSubmitting(true);
      await onRecordPayment({
        invoiceId: showPaymentModal.id,
        amountRwf: amt,
        paymentMethod,
        transactionReference: txRef.trim().toUpperCase(),
        idempotencyKey,
        notes: paymentNotes.trim() || undefined,
      });
      setShowPaymentModal(null);
      setPaymentAmount('');
      setTxRef('');
      setPaymentNotes('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {language === 'rw' ? 'Ubwishyu, Inyemezabwishyu n\'Amafaranga' : 'Billing, Invoices & Payment Ledger'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Decimal-safe Rwandan Franc (RWF) financial accounting with verified receipt issuance
          </p>
        </div>

        <div className="flex items-center gap-3">
          {allowInvoice && (
            <button
              onClick={() => {
                setShowInvoiceModal(true);
                setFormError('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'rw' ? 'Kora Inyemezabwishyu' : 'Generate Invoice'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center p-1 bg-slate-100 rounded-lg max-w-md">
        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition cursor-pointer text-center ${
            activeSubTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition cursor-pointer text-center ${
            activeSubTab === 'payments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Verified Receipts ({payments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('tariffs')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition cursor-pointer text-center ${
            activeSubTab === 'tariffs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tariff Schedule ({tariffs.length})
        </button>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeSubTab === 'invoices' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Farmer / Member</th>
                  <th className="py-3 px-4">Issue Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total (RWF)</th>
                  <th className="py-3 px-4 text-right">Paid (RWF)</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{inv.farmerName}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{inv.farmerCode}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.issueDate}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.dueDate}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {inv.totalRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700">
                      {inv.amountPaidRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-rose-700">
                      {inv.balanceRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[11px] font-semibold ${
                          inv.status === 'PAID'
                            ? 'text-emerald-700'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {inv.balanceRwf > 0 && allowPayment ? (
                        <button
                          onClick={() => {
                            setShowPaymentModal(inv);
                            setPaymentAmount(String(inv.balanceRwf));
                            setFormError('');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition shadow-xs cursor-pointer"
                        >
                          Record Payment
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-semibold text-[11px]">Cleared ✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments / Verified Receipts Table */}
      {activeSubTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Farmer Name</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4 text-right">Amount (RWF)</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {p.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {p.farmerName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.paymentMethod.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {p.transactionReference}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      {p.amountRwf.toLocaleString()} RWF
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {p.recordedBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="text-xs font-semibold text-sky-700 hover:text-sky-900 flex items-center gap-1 justify-end cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tariffs Table */}
      {activeSubTab === 'tariffs' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Approved Statutory Tariffs</h3>
              <p className="text-xs text-slate-500">
                Effective rates ratified by GFI Nasho 1 Water Users Organization (WUO) Committee
              </p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
              Active Season 2026A
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tariffs.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <span className="text-xs font-bold text-slate-900 block">{t.name}</span>
                <div className="text-xl font-bold font-mono text-sky-800 tabular-nums">
                  {t.rateRwf.toLocaleString()} RWF
                </div>
                <div className="text-[11px] text-slate-500">
                  Basis: {t.basis.replace('_', ' ')}
                </div>
                <p className="text-xs text-slate-600 leading-normal pt-1 border-t border-slate-200/60">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Verified Payment</h3>
                <p className="text-xs text-slate-500">
                  Invoice {showPaymentModal.invoiceNumber} · {showPaymentModal.farmerName}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Amount (RWF) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  max={showPaymentModal.balanceRwf}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono text-base font-bold text-slate-900"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Remaining balance due: {showPaymentModal.balanceRwf.toLocaleString()} RWF
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                >
                  <option value="MTN_MOMO">MTN Mobile Money (*182#)</option>
                  <option value="AIRTEL_MONEY">Airtel Money (*500#)</option>
                  <option value="BK_BANK_TRANSFER">Bank of Kigali (BK Transfer)</option>
                  <option value="CASH">Cash at WUO Counter</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Transaction Reference / MoMo SMS ID *
                </label>
                <input
                  type="text"
                  required
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="e.g. MOMO-RW-20261016-9021"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Paid at Kirehe branch agent"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Posting...' : 'Issue Verified Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Generate Seasonal Invoice</h3>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">Farmer Member *</label>
                <select
                  value={targetFarmerId}
                  onChange={(e) => setTargetFarmerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                >
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.fullName} ({f.farmerCode} · {f.totalHectares} Ha)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hectares / Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rate per Unit (RWF)</label>
                  <input
                    type="number"
                    value={unitRate}
                    onChange={(e) => setUnitRate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">Calculated Invoice Total:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {((parseFloat(quantity) || 1) * (parseFloat(unitRate) || 45000)).toLocaleString()} RWF
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-xs"
                >
                  {isSubmitting ? 'Generating...' : 'Issue Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Verified Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4 text-xs">
              {/* Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h2 className="text-base font-bold text-slate-900">GFI NASHO 1 IRRIGATION SCHEME</h2>
                <p className="text-[11px] text-slate-500">Kirehe District · Eastern Province · Rwanda</p>
                <div className="mt-2 inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-semibold text-[11px]">
                  OFFICIAL RECEIPT (INYEMEZABWISHYU)
                </div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Number:</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Farmer / Payer:</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Channel:</span>
                  <span className="font-medium text-slate-800">{selectedReceipt.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transaction Ref:</span>
                  <span className="font-mono text-slate-800">{selectedReceipt.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-mono text-slate-800">{new Date(selectedReceipt.recordedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Total Paid Block */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
                  Amount Received (RWF)
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {selectedReceipt.amountRwf.toLocaleString()} RWF
                </span>
              </div>

              <div className="text-[11px] text-slate-400 text-center leading-normal">
                Verified and posted by {selectedReceipt.recordedBy}.
                <br />
                Idempotency Token: <span className="font-mono">{selectedReceipt.idempotencyKey}</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center print:hidden">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
