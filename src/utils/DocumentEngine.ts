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
     * e.g. QUO-0105-01 (MMDD-XX)
     */
    static formatDocumentNumber(type: 'invoice' | 'quotation' | 'proforma', sequence: number, date: Date = new Date()): string {
        const prefix = type === 'invoice' ? 'INV' : type === 'quotation' ? 'QUO' : 'PRO'; // Changed to QUO/PRO as per request

        // MMDD format
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const dateStr = `${month}${day}`;

        // Pad sequence to 2 digits (e.g. 01)
        const seqStr = sequence.toString().padStart(2, '0');

        return `${prefix}-${dateStr}-${seqStr}`;
    }
}
