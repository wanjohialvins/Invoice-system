// src/utils/pdfGenerator.ts

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { COMPANY } from "../constants";

export interface InvoiceData {
  id: string;
  date: string;
  issuedDate: string;
  dueDate: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: any[];
  subtotal: number;
  productFreightTotal: number;
  grandTotal: number;
  freightRate: number;
  currencyRate: number;
  status: string;
}

const loadImageAsDataURL = (src: string): Promise<string | null> =>
  new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(c.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const generateInvoicePDF = async (invoice: InvoiceData, includeDescriptions: boolean = true) => {
  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Logo -> dataURL
    const logoData = await loadImageAsDataURL(COMPANY.logoPath);

    // Header (left: company info, right: logo)
    let y = 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(COMPANY.name, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 5;
    doc.text(COMPANY.address1, margin, y);
    y += 5;
    doc.text(COMPANY.address2, margin, y);
    y += 5;
    doc.text(`Phone: ${COMPANY.phone}`, margin, y);
    y += 5;
    doc.text(`Email: ${COMPANY.email}`, margin, y);
    y += 5;
    doc.text(`PIN: ${COMPANY.pin}`, margin, y);

    // Logo on right
    if (logoData) {
      const imgW = 34;
      doc.addImage(logoData, "PNG", pageWidth - margin - imgW, 8, imgW, imgW * 0.6);
    }

    // Title centered (azure)
    doc.setFontSize(16);
    doc.setTextColor(0, 127, 255);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth / 2, y + 12, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Customer & meta area
    const cursorY = y + 22;
    const leftX = margin;
    const rightX = pageWidth / 2 + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", leftX, cursorY);
    doc.setFont("helvetica", "normal");
    doc.text(`Customer ID: ${invoice.customer.id}`, leftX, cursorY + 6);
    doc.text(`Name: ${invoice.customer.name || "-"}`, leftX, cursorY + 12);
    doc.text(`Phone: ${invoice.customer.phone || "-"}`, leftX, cursorY + 18);
    doc.text(`Email: ${invoice.customer.email || "-"}`, leftX, cursorY + 24);
    doc.text(`Address: ${invoice.customer.address || "-"}`, leftX, cursorY + 30);

    // Meta: invoice no, issued date, delivery
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No:", rightX, cursorY);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.id, rightX + 28, cursorY);
    doc.setFont("helvetica", "bold");
    doc.text("Issued on:", rightX, cursorY + 6);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.issuedDate, rightX + 28, cursorY + 6);
    doc.setFont("helvetica", "bold");
    doc.text("Deadline Date:", rightX, cursorY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.dueDate || "-", rightX + 28, cursorY + 12);
    doc.setFont("helvetica", "bold");
    doc.text("Status:", rightX, cursorY + 18);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.status, rightX + 28, cursorY + 18);

    // Build table data
    if (typeof (doc as any).autoTable !== "function") {
      console.error("autoTable is not available - check import order and installed versions.");
      alert("PDF generation failed: autoTable plugin not loaded. See console.");
      return;
    }

    const includeFreightCol = invoice.productFreightTotal > 0;

    const head: string[] = [
      includeDescriptions ? "Description" : "Item",
      "Category",
      "Qty",
      "Unit Price (Ksh)",
      "Total (Ksh)",
      ...(includeFreightCol ? ["Freight (Ksh)"] : []),
    ];

    const body = invoice.items.map((l) => [
      includeDescriptions ? (l.description || l.name) : l.name,
      l.category,
      String(l.quantity),
      l.unitPrice.toFixed(2),
      (l.unitPrice * l.quantity).toFixed(2),
      ...(includeFreightCol ? [(l.productFreight || 0).toFixed(2)] : []),
    ]);

    (doc as any).autoTable({
      startY: cursorY + 36,
      head: [head],
      body,
      theme: "grid",
      headStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
    });

    // Totals after table
    const afterTableY = (doc as any).lastAutoTable?.finalY ?? cursorY + 36;
    let ty = afterTableY + 8;
    const totalsX = pageWidth - margin - 80;

    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal: Ksh ${invoice.subtotal.toFixed(2)}`, totalsX, ty);
    ty += 6;
    doc.text(`Product Freight: Ksh ${invoice.productFreightTotal.toFixed(2)}`, totalsX, ty);
    ty += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Grand Total: Ksh ${invoice.grandTotal.toFixed(2)}`, totalsX, ty);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Payment details (left)
    const py = ty + 12;
    const px = margin;
    doc.setFont("helvetica", "bold");
    doc.text("Payment Details", px, py);
    doc.setFont("helvetica", "normal");
    let pyy = py + 6;
    doc.text("Bank: I&M BANK", px, pyy); pyy += 5;
    doc.text("Bank Branch: RUIRU BRANCH", px, pyy); pyy += 5;
    doc.text("Account No.(USD): 05507023231250", px, pyy); pyy += 5;
    doc.text("SWIFT CODE: IMBLKENA", px, pyy); pyy += 5;
    doc.text("BANK CODE: 57", px, pyy); pyy += 5;
    doc.text("BRANCH CODE: 055", px, pyy);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 18;
    doc.setFontSize(9);
    doc.setTextColor(100);
    const footerLine =
      "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya";
    doc.text(footerLine, margin, footerY, { maxWidth: doc.internal.pageSize.getWidth() - margin * 2 });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 6, { align: "right" });
    }

    // Save PDF
    doc.save(`KONSUT_Invoice_${invoice.id}_${Date.now()}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    return false;
  }
};