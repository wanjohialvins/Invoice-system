import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getCompanySettings, getInvoiceSettings } from "../utils/config";
import logo from "../assets/logo.jpg";

import type { Invoice as InvoiceData } from "../types/types";
import JsBarcode from "jsbarcode";

const generateBarcode = (text: string): string => {
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, text, {
    format: "CODE128",
    displayValue: false,
    height: 30,
    width: 1,
    margin: 0
  });
  return canvas.toDataURL("image/png");
};

const loadImageAsDataURL = (src: string): Promise<{ data: string; width: number; height: number } | null> =>
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
        resolve({
          data: c.toDataURL("image/png"),
          width: img.width,
          height: img.height
        });
      } catch {
        resolve(null);
      }
    };
    img.src = src;
  });

class LayoutCursor {
  private _y: number;
  private readonly doc: jsPDF;
  private readonly pageHeight: number;
  private readonly margin: number;

  constructor(doc: jsPDF, initialY: number, margin: number) {
    this.doc = doc;
    this._y = initialY;
    this.pageHeight = doc.internal.pageSize.getHeight();
    this.margin = margin;
  }

  get y() { return this._y; }

  // Move cursor down
  advance(amount: number) {
    this._y += amount;
  }

  // Reset to top margin (usually after page break)
  reset() {
    this._y = this.margin;
  }

  // Check if content fits, otherwise add page
  ensureSpace(requiredHeight: number) {
    if (this._y + requiredHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.reset();
      return true;
    }
    return false;
  }

  setY(val: number) {
    this._y = val;
  }

  updateFromAutoTable() {
    const finalY = (this.doc as any).lastAutoTable?.finalY;
    if (finalY) {
      this._y = finalY;
    }
  }
}

export const generateInvoicePDF = async (
  invoice: InvoiceData,
  documentType: "INVOICE" | "QUOTATION" | "PROFORMA" = "INVOICE",
  options: { includeDescriptions?: boolean; currency?: "Ksh" | "USD" } = {}
) => {
  try {
    const SETTINGS = getInvoiceSettings();
    const doc = new jsPDF({
      unit: "mm",
      format: SETTINGS.pageSize || "a4",
      orientation: SETTINGS.pageOrientation || "portrait"
    });
    const COMPANY = getCompanySettings();
    const currency = options.currency || "Ksh";
    const rate = invoice.currencyRate || 1;

    // Helper to format currency
    const formatCurrency = (val: number) => {
      const amount = currency === "USD" ? val / rate : val;
      const options: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

      if (SETTINGS.numberFormat === "compact") {
        options.notation = "compact";
        options.compactDisplay = "short";
      }

      return amount.toLocaleString(undefined, options);
    };

    const fontMapping: { [key: string]: string } = {
      "Helvetica": "helvetica",
      "Courier New": "courier",
      "Times New Roman": "times"
    };
    const font = fontMapping[SETTINGS.fontFamily] || "helvetica";


    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const boxGap = 5;
    const primaryColor = [0, 153, 255]; // Brand Blue #0099ff
    const secondaryColor = [31, 41, 55]; // Gray 800 (Darker)

    // Helper to draw a box with optional header
    const drawBox = (x: number, y: number, w: number, h: number, title?: string) => {
      doc.setDrawColor(200, 200, 200); // Light gray borders
      doc.setLineWidth(0.1);
      doc.rect(x, y, w, h);

      if (title) {
        doc.setFillColor(240, 240, 240); // Light gray header bg
        doc.rect(x, y, w, 7, "F");
        doc.setFont(font, "bold");
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Blue title
        doc.text(title, x + 3, y + 5);
      }
    };

    // --- Watermark (Subtle) ---
    if (SETTINGS.includeWatermark) {
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(60);
      doc.setFont(font, "bold");
      const watermarkText = COMPANY.name || "KONSUT LTD";
      const cx = pageWidth / 2;
      const cy = pageHeight / 2;
      doc.text(watermarkText, cx, cy, { align: "center", angle: 45 });
      doc.restoreGraphicsState();
    }

    // --- Header Section (Clean Design: Logo Left, Info Right) ---
    const headerY = margin;
    const headerHeight = 35; // Keeping height reservation
    const cursor = new LayoutCursor(doc, headerY, margin);

    // LEFT: Logo
    if (SETTINGS.includeHeader) {
      // Use logo from settings if available, otherwise fallback to imported default
      const logoToUse = COMPANY.logoPath || logo;
      const logoInfo = await loadImageAsDataURL(logoToUse);
      if (logoInfo) {
        const maxW = 80;
        const maxH = 40;
        const aspect = logoInfo.width / logoInfo.height;
        let imgW = maxW;
        let imgH = maxW / aspect;
        if (imgH > maxH) { imgH = maxH; imgW = maxH * aspect; }
        doc.addImage(logoInfo.data, "PNG", margin, headerY, imgW, imgH);
      }
    }

    // RIGHT: Company Info
    if (SETTINGS.includeCompanyDetails) {
      const rightMargin = pageWidth - margin;
      cursor.setY(headerY + 5);

      doc.setFont(font, "bold");
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

      // Safe wrap for Company Name
      const maxNameWidth = 100; // Limit width to avoid overlap
      const nameLines = doc.splitTextToSize(String(COMPANY.name || ""), maxNameWidth);
      doc.text(nameLines, rightMargin, cursor.y, { align: "right" });
      cursor.advance(nameLines.length * 8);

      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

      const contactDetails = [
        String(COMPANY.address1 || ""),
        String(COMPANY.address2 || ""),
        COMPANY.phone ? `Phone: ${COMPANY.phone}` : "",
        COMPANY.email ? `Email: ${COMPANY.email}` : "",
        COMPANY.pin ? `PIN: ${COMPANY.pin}` : ""
      ].filter(Boolean);

      contactDetails.forEach(detail => {
        doc.text(detail, rightMargin, cursor.y, { align: "right" });
        cursor.advance(5);
      });
    }

    // --- Title Bar (Full Width Blue) ---
    // Ensure we start below the header or logo
    cursor.setY(Math.max(cursor.y, headerY + headerHeight) + 10);
    const titleY = cursor.y;

    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, titleY, pageWidth - (margin * 2), 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont(font, "bold");
    doc.setFontSize(14);
    doc.text(
      documentType === 'INVOICE' ? 'INVOICE'
        : documentType === 'QUOTATION' ? 'PRICE QUOTATION'
          : 'PROFORMA INVOICE',
      pageWidth / 2, titleY + 7, { align: "center" }
    );

    // --- Details Section (Middle Boxes) - DYNAMIC HEIGHT ---
    cursor.advance(15);
    const detailsStartY = cursor.y;
    // Helper calculations for layout below header
    const boxWidth = (pageWidth - (margin * 2) - boxGap) / 2;
    const rightBoxX = margin + boxWidth + boxGap;

    // Calculate Bill To box height dynamically
    doc.setFont(font, "normal");
    doc.setFontSize(9);
    const getWrappedHeight = (text: string, width: number) => {
      return doc.splitTextToSize(String(text), width).length * 4;
    };

    let billToH = 7 + 4; // Header + initial padding
    if (invoice.customer.id) billToH += 4;
    billToH += getWrappedHeight(invoice.customer.name || "N/A", boxWidth - 8);
    if (invoice.customer.phone) billToH += 4;
    if (invoice.customer.email) billToH += 4;
    if (invoice.customer.kraPin) billToH += 4;
    if (invoice.customer.address) billToH += getWrappedHeight(`Address: ${invoice.customer.address}`, boxWidth - 8);
    const billToHeight = billToH + 4; // final padding

    // Calculate Invoice Details box height
    let detailLines = 2; // ID + Issued Date (always present)
    if ((documentType === 'QUOTATION' && invoice.quotationValidUntil) || invoice.dueDate) {
      detailLines++;
    }
    const detailsHeight = 7 + (detailLines * 5) + 4 + 15; // Header + lines + padding + Barcode space
    const maxDetailsHeight = Math.max(billToHeight, detailsHeight);

    // Box 1: Bill To
    if (SETTINGS.includeCustomerDetails) {
      drawBox(margin, detailsStartY, boxWidth, maxDetailsHeight, "Bill To:");
      let boxCursorY = detailsStartY + 12;

      const printLine = (label: string, text: string) => {
        doc.setFont(font, "normal");
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        const fullText = label ? `${label}: ${text}` : text;
        const lines = doc.splitTextToSize(fullText, boxWidth - 8);
        doc.text(lines, margin + 4, boxCursorY);
        boxCursorY += (lines.length * 4);
      }

      if (invoice.customer.id) printLine("Customer ID", invoice.customer.id);
      printLine("Name", invoice.customer.name || "N/A");
      if (invoice.customer.phone) printLine("Phone", invoice.customer.phone);
      if (invoice.customer.email) printLine("Email", invoice.customer.email);
      if (invoice.customer.kraPin) printLine("KRA PIN", invoice.customer.kraPin);
      if (invoice.customer.address) printLine("Address", invoice.customer.address);
    }



    // ... inside generateInvoicePDF
    // Box 2: Invoice Details
    let detailsHeader = "Invoice Details:";
    if (documentType === 'QUOTATION') detailsHeader = "Quotation Details:";
    if (documentType === 'PROFORMA') detailsHeader = "Proforma Details:";
    drawBox(rightBoxX, detailsStartY, boxWidth, maxDetailsHeight, detailsHeader);

    let box2Y = detailsStartY + 12;
    const labelX = rightBoxX + 4;
    const valX = rightBoxX + 45;

    const printRow = (label: string, value: string, color?: number[]) => {
      doc.setTextColor(0, 0, 0);
      doc.setFont(font, "normal");
      doc.text(label, labelX, box2Y);
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      doc.text(value, valX, box2Y);
      box2Y += 5;
    };

    printRow(
      documentType === 'INVOICE' ? "Invoice No:"
        : documentType === 'QUOTATION' ? "Quotation No:"
          : "Proforma No:",
      String(invoice.id || "")
    );
    printRow("Issued Date:", String(invoice.issuedDate || new Date().toISOString().split('T')[0]));

    if (documentType === 'QUOTATION' && invoice.quotationValidUntil) {
      printRow("Valid Until:", String(invoice.quotationValidUntil || ""));
    } else if (invoice.dueDate) {
      printRow("Due Date:", String(invoice.dueDate || ""));
    }

    // --- Barcode (Under Due Date) ---
    if (SETTINGS.includeBarcode) {
      try {
        const barcodeData = generateBarcode(invoice.id);
        const barcodeWidth = 40;
        const barcodeHeight = 10;
        const barcodeX = rightBoxX + (boxWidth - barcodeWidth) / 2;
        doc.addImage(barcodeData, "PNG", barcodeX, box2Y + 2, barcodeWidth, barcodeHeight);
      } catch (e) {
        console.warn("Barcode generation failed", e);
      }
    }

    // Status (Removed from PDF as requested, but keeping code if needed later commented out)
    // doc.text("Status:", labelX, y);
    // doc.text(invoice.status, valX, y);

    // --- Table ---
    // Removed "Category" column as requested
    const tableHeader = [
      "Description",
      // "Category", // Removed (user preference)
      "Qty",
      "Unit Price",
      "Total",
    ];

    const tableBody = invoice.items.map((l) => [
      options.includeDescriptions && l.description
        ? `${l.name}\n${l.description}`
        : l.name,
      // l.category ? (l.category.charAt(0).toUpperCase() + l.category.slice(1)) : "-",
      String(l.quantity),
      formatCurrency(l.unitPrice),
      formatCurrency(l.unitPrice * l.quantity),
    ]);

    autoTable(doc, {
      startY: detailsStartY + maxDetailsHeight + 10,
      head: [tableHeader],
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: SETTINGS.fontSize || 9,
        cellPadding: 3,
        font: font,
        textColor: [0, 0, 0],
        lineColor: [150, 150, 150],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "center" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250], // slightly darker zebra
      },
      margin: { left: margin, right: margin },
    });

    // --- Footer Section (Bottom Boxes) - DYNAMIC HEIGHT ---
    cursor.updateFromAutoTable(); // Update cursor after autoTable
    cursor.advance(10); // Add space after table

    // Calculate Payment box height
    const bankDetails = [
      "Bank: I&M BANK",
      "Branch: RUIRU BRANCH",
      `Account No (KSH): 05507023236350`,
      `Account No (USD): 05507023231250`,
      "SWIFT CODE: IMBLKENA",
      "BANK CODE: 57 | BRANCH CODE: 055"
    ];
    const paymentHeight = 7 + (bankDetails.length * 4) + 4; // Header + lines + padding

    // Calculate Summary box height (Subtotal + VAT + Grand Total bar)
    const summaryHeight = 7 + 6 + 6 + 10 + 4; // Header + subtotal + VAT + total bar + padding

    const maxFooterHeight = Math.max(paymentHeight, summaryHeight);

    // Check page break using cursor
    cursor.ensureSpace(maxFooterHeight);
    const footerStartY = cursor.y;

    // Payment Box (Left)
    if (SETTINGS.includePaymentDetails) {
      drawBox(margin, footerStartY, boxWidth, maxFooterHeight, "Payment Details");
      let boxCursorY = footerStartY + 12;
      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      bankDetails.forEach(line => {
        doc.text(line, margin + 4, boxCursorY);
        boxCursorY += 4;
      });
    }

    // Summary Box (Right)
    drawBox(rightBoxX, footerStartY, boxWidth, maxFooterHeight, "Summary");

    let sumY = footerStartY + 14;
    const sumLabelX = rightBoxX + 4;
    const sumValX = pageWidth - margin - 4;

    // Calculations for display
    const vatRate = 0.16;
    const vatAmount = invoice.subtotal * vatRate;
    const finalTotal = invoice.subtotal + vatAmount;

    // Subtotal
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Subtotal", sumLabelX, sumY);
    doc.text(`${currency} ${formatCurrency(invoice.subtotal)}`, sumValX, sumY, { align: "right" });
    sumY += 6;

    // VAT
    doc.text(`VAT (16%)`, sumLabelX, sumY);
    doc.text(`${currency} ${formatCurrency(vatAmount)}`, sumValX, sumY, { align: "right" });
    sumY += 6;

    // Grand Total Bar inside the box
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(rightBoxX, sumY - 4, boxWidth, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont(font, "bold");
    doc.text("Grand Total", sumLabelX, sumY + 2);
    // Use the calculated total including VAT
    doc.text(`${currency} ${formatCurrency(finalTotal)}`, sumValX, sumY + 2, { align: "right" });

    // --- Custom Sections (Responsibilities & Terms) ---
    // Calculate start Y for custom sections (below the lowest box)
    cursor.setY(footerStartY + maxFooterHeight + 10);

    const printCustomSection = (title: string, content: string) => {
      // Check page break
      cursor.ensureSpace(20);

      doc.setFont(font, "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(String(title), margin, cursor.y);
      cursor.advance(5);

      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const lines = doc.splitTextToSize(String(content), pageWidth - (margin * 2));
      doc.text(lines, margin, cursor.y);
      cursor.advance((lines.length * 4) + 8); // Spacing for next section
    };

    if (invoice.clientResponsibilities) {
      printCustomSection("Client Responsibilities", String(invoice.clientResponsibilities));
    }

    if (invoice.termsAndConditions) {
      printCustomSection("Terms & Conditions", String(invoice.termsAndConditions));
    }

    // --- Footer Text ---
    if (SETTINGS.includeFooter) {
      const footerParamsY = pageHeight - 12;
      doc.setFont(font, "italic");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      const disclaimer = SETTINGS.footerText || "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsut.co.ke | Ruiru, Kenya";
      doc.text(String(disclaimer), pageWidth / 2, footerParamsY - 5, { align: "center" });
    }

    // Page Numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
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