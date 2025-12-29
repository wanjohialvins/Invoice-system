import React from 'react';
import type { Invoice } from '../types/types';
import logo from '../assets/logo.jpg';

interface InvoiceTemplateProps {
    data: Invoice;
    companySettings?: {
        name: string;
        address1: string;
        address2: string;
        phone: string;
        email: string;
        pin: string;
        logoUrl?: string;
    };
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ data, companySettings }, ref) => {
    // Default Company Settings if not provided
    const company = companySettings || {
        name: "KONSUT LTD",
        address1: "P.O BOX 21162-00100",
        address2: "G.P.O NAIROBI",
        phone: "+254 700 420 897",
        email: "info@konsut.co.ke",
        pin: "P052435869T",
    };

    const primaryColor = "#0099ff"; // Brand Blue
    const secondaryColor = "#1f2937"; // Gray 800

    // Format Helpers
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div ref={ref} className="bg-white text-gray-800 font-sans text-sm leading-normal max-w-[210mm] mx-auto min-h-[297mm] relative" id="invoice-template">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-start mb-8">
                {/* Logo & Company Info */}
                <div className="w-1/2">
                    <img src={logo} alt="Company Logo" className="h-16 w-auto mb-3 object-contain" />
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-1">{company.name}</h2>
                    <div className="text-gray-600 text-xs">
                        <p>{company.address1}</p>
                        <p>{company.address2}</p>
                        <p>Tel: {company.phone}</p>
                        <p>Email: {company.email}</p>
                        <p className="mt-1 font-semibold">PIN: {company.pin}</p>
                    </div>
                </div>

                {/* Invoice Meta */}
                <div className="w-1/2 text-right">
                    <h1 className="text-3xl font-extrabold text-[#0099ff] uppercase tracking-wider mb-2">
                        {data.type === 'quotation' ? 'Quotation' : data.type === 'proforma' ? 'Proforma Invoice' : 'Tax Invoice'}
                    </h1>
                    <div className="text-gray-600 text-sm space-y-1">
                        <p><span className="font-semibold text-gray-800">No:</span> {data.id}</p>
                        <p><span className="font-semibold text-gray-800">Date:</span> {formatDate(data.issuedDate)}</p>

                        {data.type !== 'quotation' && (
                            <p><span className="font-semibold text-gray-800">Due Date:</span> {formatDate(data.dueDate)}</p>
                        )}
                        {data.quotationValidUntil && (
                            <p><span className="font-semibold text-gray-800">Valid Until:</span> {formatDate(data.quotationValidUntil)}</p>
                        )}
                        {data.currencyRate && (
                            <p><span className="font-semibold text-gray-800">Rate (USD):</span> Ksh {data.currencyRate}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* --- BILL TO --- */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-[#0099ff]">
                <h3 className="text-[#0099ff] font-bold text-xs uppercase mb-2 tracking-wider">Bill To</h3>
                <p className="font-bold text-gray-900 text-base">{data.customer.name}</p>
                <div className="text-gray-600 text-sm mt-1">
                    <p>{data.customer.address}</p>
                    <p>{data.customer.phone}</p>
                    <p>{data.customer.email}</p>
                    {data.customer.kraPin && <p>KRA PIN: {data.customer.kraPin}</p>}
                </div>
            </div>

            {/* --- ITEMS TABLE --- */}
            <div className="mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0099ff] text-white">
                            <th className="py-2 px-3 text-xs uppercase font-bold rounded-tl-lg">#</th>
                            <th className="py-2 px-3 text-xs uppercase font-bold w-1/2">Item Description</th>
                            <th className="py-2 px-3 text-xs uppercase font-bold text-right rounded-tr-lg">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {data.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-3 align-top">{index + 1}</td>
                                <td className="py-3 px-3 align-top">
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    {item.description && (
                                        <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                    )}
                                </td>
                                <td className="py-3 px-3 text-right align-top font-medium text-gray-900">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- SUMMARY --- */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 sm:w-1/3 space-y-2">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(data.subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                        <span>VAT (16%):</span>
                        <span className="font-medium text-gray-900">{formatCurrency(data.tax)}</span>
                    </div>

                    <div className="flex justify-between items-center bg-[#1f2937] text-white p-3 rounded shadow-sm mt-3">
                        <span className="font-bold uppercase text-xs tracking-wider">Grand Total</span>
                        <span className="font-bold text-lg">{formatCurrency(data.grandTotal)}</span>
                    </div>
                </div>
            </div>

            {/* --- CUSTOM SECTIONS --- */}
            <div className="space-y-6 mb-12">
                {data.clientResponsibilities && (
                    <div>
                        <h4 className="text-gray-800 font-bold text-xs uppercase border-b border-gray-200 pb-1 mb-2">Client Responsibilities</h4>
                        <p className="text-gray-600 text-xs whitespace-pre-wrap">{data.clientResponsibilities}</p>
                    </div>
                )}

                {data.termsAndConditions && (
                    <div>
                        <h4 className="text-gray-800 font-bold text-xs uppercase border-b border-gray-200 pb-1 mb-2">Terms & Conditions</h4>
                        <p className="text-gray-600 text-xs whitespace-pre-wrap">{data.termsAndConditions}</p>
                    </div>
                )}
            </div>

            {/* --- FOOTER --- */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-center text-gray-500 text-[10px] italic border-t border-gray-100">
                <p>If you have any questions about this invoice, please contact: Tel: {company.phone} | Email: {company.email} | {company.address2}</p>
                <p className="mt-1">Thank you for your business!</p>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 0; }
          #invoice-template { 
            width: 100%; 
            max-width: none; 
            min-height: 100vh; 
            box-shadow: none; 
            padding: 20mm;
          }
        }
      `}</style>
        </div>
    );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
