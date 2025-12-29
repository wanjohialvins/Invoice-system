export type InvoiceType = 'quotation' | 'proforma' | 'invoice';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  priceKsh?: number;
  priceUSD?: number;
  description?: string;
}

export interface InvoiceItem {
  id: string; // product id
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unitPrice: number; // Ksh
  lineTotal: number; // unitPrice * qty
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  kraPin?: string;
}

export interface Invoice {
  id: string;
  type: InvoiceType;
  status: InvoiceStatus;
  date: string; // ISO string
  issuedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  customer: Customer;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  grandTotal: number;
  currencyRate?: number;
  clientResponsibilities?: string;
  termsAndConditions?: string;
  notes?: string; // Keeping notes in its original position
  convertedFrom?: string; // Keeping convertedFrom in its original position

  // Specific fields
  quotationValidUntil?: string;
  proformaNumber?: string;
  invoiceNumber?: string;

  createdAt?: string;
  updatedAt?: string;
}
