// src/utils/config.ts
/**
 * Configuration Utility
 * 
 * Provides centralized access to application settings.
 * Retreives values from localStorage or falls back to hardcoded defaults.
 * Used by 'NewInvoice.tsx' and 'pdfGenerator.ts' to ensure consistency.
 */

export const DEFAULT_COMPANY = {
    name: "KONSUT LTD",
    address1: "P.O BOX 21162-00100",
    address2: "G.P.O NAIROBI",
    phone: "+254 700 420 897",
    email: "info@konsut.co.ke",
    pin: "P052435869T",
    logoPath: "/src/assets/logo.jpg",
};

export const DEFAULT_INVOICE_SETTINGS = {
    currency: "Ksh",
    taxRate: 0.16,
    includeTax: true,
    footerText: "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsut.co.ke | Ruiru, Kenya",
};

export const getCompanySettings = () => {
    try {
        const stored = localStorage.getItem("company");
        return stored ? JSON.parse(stored) : DEFAULT_COMPANY;
    } catch (e) {
        return DEFAULT_COMPANY;
    }
};

export const getInvoiceSettings = () => {
    try {
        const stored = localStorage.getItem("invoiceSettings");
        return stored ? JSON.parse(stored) : DEFAULT_INVOICE_SETTINGS;
    } catch (e) {
        return DEFAULT_INVOICE_SETTINGS;
    }
};

export const getSystemSettings = () => {
    try {
        const stored = localStorage.getItem("systemSettings");
        return stored ? JSON.parse(stored) : {};
    } catch (e) {
        return {};
    }
};
