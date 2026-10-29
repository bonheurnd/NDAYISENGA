/**
 * Pure calculation logic for Billing, Invoicing, and Payment Allocation.
 * Decimal-safe arithmetic for Rwandan Francs (RWF).
 */

import type { InvoiceLineItem, TariffBasis } from '../../types/index.ts';

/**
 * Safely adds two monetary amounts avoiding floating point errors.
 */
export function addMoney(a: number, b: number): number {
  return Math.round((a + b) * 100) / 100;
}

/**
 * Safely subtracts two monetary amounts.
 */
export function subtractMoney(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100;
}

/**
 * Safely multiplies quantity and unit rate.
 */
export function multiplyMoney(quantity: number, unitRate: number): number {
  return Math.round(quantity * unitRate * 100) / 100;
}

/**
 * Calculates tariff fee based on basis and units.
 */
export function calculateTariffAmount(
  basis: TariffBasis,
  units: number,
  rateRwf: number
): number {
  if (units <= 0 || rateRwf <= 0) return 0;
  return Math.round(units * rateRwf);
}

/**
 * Calculates invoice subtotal, tax (0% for Rwandan agricultural water supply by law or configurable), and total.
 */
export function calculateInvoiceTotals(lineItems: InvoiceLineItem[], taxRate = 0) {
  const subtotal = lineItems.reduce((acc, item) => addMoney(acc, item.totalRwf), 0);
  const tax = Math.round(subtotal * taxRate);
  const total = addMoney(subtotal, tax);
  return { subtotalRwf: subtotal, taxRwf: tax, totalRwf: total };
}

/**
 * Calculates invoice balance and updated status given new payment.
 */
export function applyPaymentToInvoice(
  currentTotal: number,
  currentPaid: number,
  paymentAmount: number
): {
  newAmountPaid: number;
  newBalance: number;
  newStatus: 'PAID' | 'PARTIALLY_PAID';
} {
  if (paymentAmount <= 0) {
    const balance = subtractMoney(currentTotal, currentPaid);
    return {
      newAmountPaid: currentPaid,
      newBalance: balance,
      newStatus: balance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
    };
  }

  const newAmountPaid = addMoney(currentPaid, paymentAmount);
  const newBalance = Math.max(0, subtractMoney(currentTotal, newAmountPaid));
  const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

  return { newAmountPaid, newBalance, newStatus };
}

/**
 * Validates idempotency key against processed transactions.
 */
export function isDuplicatePaymentTransaction(
  idempotencyKey: string,
  transactionReference: string,
  existingKeys: Set<string>,
  existingRefs: Set<string>
): boolean {
  if (existingKeys.has(idempotencyKey)) return true;
  if (transactionReference && existingRefs.has(transactionReference.trim().toUpperCase())) {
    return true;
  }
  return false;
}
