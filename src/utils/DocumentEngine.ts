import type { InvoiceItem, Product } from "../types/types";

export interface InvoiceTotals {
    subtotal: number;
    taxAmount: number;
    grandTotal: number;
}

export type TaxRate = number; // e.g. 0.16 for 16%

export class DocumentEngine {
    /**
     * Calculates the total for a single line item.
     * Does NOT mutate the item, returns the calculated values.
     */
    static calculateLineItem(
        item: InvoiceItem
    ): { lineTotal: number } {
        const lineTotal = item.unitPrice * item.quantity;
        return { lineTotal };
    }

    /**
     * Calculates all totals for the document based on items and rates.
     */
    static calculateTotals(
        items: InvoiceItem[],
        taxRate: TaxRate = 0.16
    ): InvoiceTotals {
        let subtotal = 0;

        for (const item of items) {
            subtotal += (item.unitPrice * item.quantity);
        }

        const taxAmount = subtotal * taxRate;
        const grandTotal = subtotal + taxAmount;

        return {
            subtotal,
            taxAmount,
            grandTotal
        };
    }

    /**
     * Formats a document number consistent with the backend-style rules.
     * e.g. INV-2025-000123
     */
    static formatDocumentNumber(type: 'invoice' | 'quotation' | 'proforma', sequence: number, date: Date = new Date()): string {
        const year = date.getFullYear();
        const prefix = type === 'invoice' ? 'INV' : type === 'quotation' ? 'QTN' : 'PRF';
        // Pad sequence to 6 digits
        const seqStr = sequence.toString().padStart(6, '0');
        return `${prefix}-${year}-${seqStr}`;
    }
}
