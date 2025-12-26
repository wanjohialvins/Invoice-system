// src/utils/pdfGenerator.ts

import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { COMPANY } from "../constants";
import logo from "../assets/logo.jpg";

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
    // If src is already a data URL (which import might return if small, but usually returns path in Vite)
    // In Vite, imported image is a string (path).
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

export const generateInvoicePDF = async (
  invoice: InvoiceData,
  documentType: "INVOICE" | "QUOTATION" = "INVOICE"
) => {
  try {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const primaryColor = [0, 87, 163]; // Darker blue for professional look

    // --- Watermark ---
    doc.saveGraphicsState();
    doc.setTextColor(240, 240, 240); // Very light gray
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    // Rotate 45 degrees
    const text = "KONSUT LTD";
    const textWidth = doc.getTextWidth(text);

    // Center the rotation
    const cx = pageWidth / 2;
    const cy = pageHeight / 2;

    doc.setTextColor(230, 230, 230);
    doc.text(text, cx, cy, { align: "center", angle: 45 });
    doc.restoreGraphicsState();

    // --- Header Section (Two Boxes) ---
    const headerY = margin;
    const headerHeight = 35;
    const boxWidth = (pageWidth - (margin * 2) - 5) / 2; // 5mm gap

    // Left Box: Company Info
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, headerY, boxWidth, headerHeight);

    let y = headerY + 6;
    const leftPad = margin + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 87, 163); // Blue company name
    doc.text(COMPANY.name, leftPad, y);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 5;
    doc.text(COMPANY.address1, leftPad, y);
    y += 4;
    doc.text(COMPANY.address2, leftPad, y);
    y += 4;
    doc.text(`Phone: ${COMPANY.phone}`, leftPad, y);
    y += 4;
    doc.text(`Email: ${COMPANY.email}`, leftPad, y);
    y += 4;
    doc.text(`PIN: ${COMPANY.pin}`, leftPad, y);

    // Right Box: Logo
    const rightBoxX = margin + boxWidth + 5;
    doc.rect(rightBoxX, headerY, boxWidth, headerHeight);

    // Use imported logo variable
    const logoData = await loadImageAsDataURL(logo);
    if (logoData) {
      const imgW = 35;
      const imgH = 20; // approximate
      // Center logo in right box
      const lx = rightBoxX + (boxWidth - imgW) / 2;
      const ly = headerY + (headerHeight - imgH) / 2;
      doc.addImage(logoData, "PNG", lx, ly, imgW, imgH);
    }

    // --- Title Bar ---
    const titleY = headerY + headerHeight + 5;
    const titleHeight = 10;
    doc.setFillColor(0, 87, 163); // Blue background
    doc.rect(margin, titleY, pageWidth - (margin * 2), titleHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(documentType, pageWidth / 2, titleY + 7, { align: "center" });

    // --- Details Section (Two Boxes) ---
    const detailsY = titleY + titleHeight + 5;
    const detailsHeight = 40;

    // Left Box: Bill To
    doc.setDrawColor(200, 200, 200);
    doc.setTextColor(0, 0, 0); // Reset text color
    doc.rect(margin, detailsY, boxWidth, detailsHeight);

    // Header background for "Bill To"
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, detailsY, boxWidth, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 87, 163);
    doc.text("Bill To:", margin + 4, detailsY + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let dy = detailsY + 12;
    doc.text(`Customer ID: ${invoice.customer.id}`, margin + 4, dy); dy += 5;
    doc.text(`Name: ${invoice.customer.name || "-"}`, margin + 4, dy); dy += 5;
    doc.text(`Phone: ${invoice.customer.phone || "-"}`, margin + 4, dy); dy += 5;
    doc.text(`Email: ${invoice.customer.email || "-"}`, margin + 4, dy); dy += 5;
    // Wrap address if long
    const addrLines = doc.splitTextToSize(`Address: ${invoice.customer.address || "-"}`, boxWidth - 8);
    doc.text(addrLines, margin + 4, dy);

    // Right Box: Invoice Details
    doc.rect(rightBoxX, detailsY, boxWidth, detailsHeight);

    // Header background
    doc.setFillColor(240, 240, 240);
    doc.rect(rightBoxX, detailsY, boxWidth, 7, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 87, 163);
    const detailsTitle = documentType === "INVOICE" ? "Invoice Details:" : "Quotation Details:";
    doc.text(detailsTitle, rightBoxX + 4, detailsY + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    dy = detailsY + 12;

    const numLabel = documentType === "INVOICE" ? "Invoice No:" : "Quotation No:";
    const dateLabel = "Issued Date:";
    const dueLabel = documentType === "INVOICE" ? "Due Date:" : "Valid Until:";

    // Helper for aligned key-value pairs
    const printRow = (label: string, value: string, yPos: number, isStatus = false) => {
      doc.text(label, rightBoxX + 4, yPos);
      if (isStatus) {
        if (value === "Paid") doc.setTextColor(0, 128, 0);
        else if (value === "Overdue") doc.setTextColor(255, 0, 0);
        else doc.setTextColor(255, 165, 0);
        doc.setFont("helvetica", "bold");
      }
      doc.text(value, rightBoxX + 40, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
    };

    printRow(numLabel, invoice.id, dy); dy += 5;
    printRow(dateLabel, invoice.issuedDate, dy); dy += 5;
    printRow(dueLabel, invoice.dueDate || "-", dy); dy += 5;
    printRow("Payment Status:", invoice.status, dy, true);

    // --- Table ---
    if (typeof (doc as any).autoTable !== "function") {
      console.error("autoTable is not available");
      alert("PDF generation failed: autoTable plugin not loaded.");
      return false;
    }

    const includeFreightCol = invoice.productFreightTotal > 0;

    // Columns: Description, Qty, Unit Price, VAT (16%), Total
    // Removed Category
    const head: string[] = [
      "Description",
      "Qty",
      "Unit Price",
      "VAT (16%)",
      "Total",
      ...(includeFreightCol ? ["Freight"] : []),
    ];

    const body = invoice.items.map((l) => {
      const unitPrice = l.unitPrice;
      const vat = unitPrice * 0.16;
      const qty = l.quantity;
      const total = unitPrice * qty; // Note: Total usually excludes VAT in line items unless specified, but let's keep it simple: Unit * Qty. VAT is separate column.

      return [
        l.description || l.name,
        String(qty),
        unitPrice.toFixed(2),
        vat.toFixed(2),
        total.toFixed(2),
        ...(includeFreightCol ? [(l.productFreight || 0).toFixed(2)] : []),
      ];
    });

    (doc as any).autoTable({
      startY: detailsY + detailsHeight + 10,
      head: [head],
      body,
      theme: "grid",
      headStyles: {
        fillColor: [0, 87, 163],
        textColor: 255,
        fontStyle: "bold",
        halign: "center"
      },
      columnStyles: {
        0: { halign: "left" }, // Description
        1: { halign: "center" }, // Qty
        2: { halign: "right" }, // Unit Price
        3: { halign: "right" }, // VAT
        4: { halign: "right" }, // Total
        5: { halign: "right" }, // Freight
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      margin: { left: margin, right: margin },
    });

    // --- Footer Section ---
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    const footerTopY = finalY + 10;

    // Payment Details Box (Left)
    const paymentBoxWidth = boxWidth;
    const paymentBoxHeight = 45;

    // Check if we need a new page
    if (footerTopY + paymentBoxHeight > pageHeight - 20) {
      doc.addPage();
      // Reset Y for new page
      // ... logic for new page if needed, but for now let's assume it fits or just draw at top
    }

    // Payment Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, footerTopY, paymentBoxWidth, 7, "F");
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, footerTopY, paymentBoxWidth, paymentBoxHeight); // Border for whole box

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 87, 163);
    doc.text("Payment Details", margin + 4, footerTopY + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let py = footerTopY + 12;
    doc.text("Bank: I&M BANK", margin + 4, py); py += 5;
    doc.text("Branch: RUIRU BRANCH", margin + 4, py); py += 5;
    doc.text("Account No (KSH): XXXXXXXXXXXXX", margin + 4, py); py += 5;
    doc.text("Account No (USD): 05507023231250", margin + 4, py); py += 5;
    doc.text("SWIFT CODE: IMBLKENA", margin + 4, py); py += 5;
    doc.text("BANK CODE: 57 | BRANCH CODE: 055", margin + 4, py);

    // Summary Box (Right)
    const summaryBoxX = margin + boxWidth + 5;
    const summaryBoxHeight = 35; // Shorter than payment

    doc.setFillColor(240, 240, 240);
    doc.rect(summaryBoxX, footerTopY, boxWidth, 7, "F"); // Header
    doc.rect(summaryBoxX, footerTopY, boxWidth, summaryBoxHeight); // Border

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 87, 163);
    doc.text("Summary", summaryBoxX + 4, footerTopY + 5);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let sy = footerTopY + 14;

    // Subtotal
    doc.text("Subtotal", summaryBoxX + 4, sy);
    doc.text(`Ksh ${invoice.subtotal.toFixed(2)}`, pageWidth - margin - 4, sy, { align: "right" });
    sy += 7;

    // Freight (if any)
    if (invoice.productFreightTotal > 0) {
      doc.text("Freight", summaryBoxX + 4, sy);
      doc.text(`Ksh ${invoice.productFreightTotal.toFixed(2)}`, pageWidth - margin - 4, sy, { align: "right" });
      sy += 7;
    }

    // Grand Total Bar
    doc.setFillColor(0, 87, 163);
    doc.rect(summaryBoxX, sy - 4, boxWidth, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total", summaryBoxX + 4, sy + 2);
    doc.text(`Ksh ${invoice.grandTotal.toFixed(2)}`, pageWidth - margin - 4, sy + 2, { align: "right" });

    // --- Bottom Footer ---
    const footerY = pageHeight - 10;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    const footerLine = "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya";
    doc.text(footerLine, pageWidth / 2, footerY, { align: "center" });

    // Page Numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: "right" });
    }

    doc.save(`${COMPANY.name}_${documentType}_${invoice.id}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert(`PDF generation failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
};