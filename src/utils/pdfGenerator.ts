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
    img.onerror = () => resolve(null);
    img.src = src;
  });

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
    let y = headerY;

    // LEFT: Logo
    if (SETTINGS.includeHeader) {
      const logoInfo = await loadImageAsDataURL(logo);
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
      y = headerY + 5;
      doc.setFont(font, "bold");
      doc.setFontSize(20);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(String(COMPANY.name || ""), rightMargin, y, { align: "right" });
      y += 7;
      doc.setFont(font, "normal");
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(String(COMPANY.address1 || ""), rightMargin, y, { align: "right" });
      y += 5;
      doc.text(String(COMPANY.address2 || ""), rightMargin, y, { align: "right" });
      y += 5;
      doc.text(`Phone: ${COMPANY.phone || ""}`, rightMargin, y, { align: "right" });
      y += 5;
      doc.text(`Email: ${COMPANY.email || ""}`, rightMargin, y, { align: "right" });
      y += 5;
      doc.text(`PIN: ${COMPANY.pin || ""}`, rightMargin, y, { align: "right" });
    }

    // --- Title Bar (Full Width Blue) ---
    // Added a bit more spacing after the header info
    const titleY = headerY + headerHeight + 10;
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
    const detailsY = titleY + 15;
    // Helper calculations for layout below header
    const boxWidth = (pageWidth - (margin * 2) - boxGap) / 2;
    const rightBoxX = margin + boxWidth + boxGap;

    // Calculate Bill To box height
    let billToLines = 0;
    if (invoice.customer.id) billToLines++;
    billToLines++; // Name (always present)
    if (invoice.customer.phone) billToLines++;
    if (invoice.customer.email) billToLines++;
    if (invoice.customer.kraPin) billToLines++;
    if (invoice.customer.address) {
      const addrLines = doc.splitTextToSize(`Address: ${invoice.customer.address}`, boxWidth - 8);
      billToLines += addrLines.length;
    }
    const billToHeight = 7 + (billToLines * 4) + 4; // Header + lines + padding

    // Calculate Invoice Details box height
    let detailLines = 2; // ID + Issued Date (always present)
    if ((documentType === 'QUOTATION' && invoice.quotationValidUntil) || invoice.dueDate) {
      detailLines++;
    }
    const detailsHeight = 7 + (detailLines * 5) + 4 + 15; // Header + lines + padding + Barcode space

    // Use the taller of the two for alignment
    const maxDetailsHeight = Math.max(billToHeight, detailsHeight);

    // Box 1: Bill To
    if (SETTINGS.includeCustomerDetails) {
      drawBox(margin, detailsY, boxWidth, maxDetailsHeight, "Bill To:");
      y = detailsY + 12;
      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      if (invoice.customer.id) { doc.text(`Customer ID: ${invoice.customer.id || ""}`, margin + 4, y); y += 4; }
      doc.text(`Name: ${invoice.customer.name || "N/A"}`, margin + 4, y); y += 4;
      if (invoice.customer.phone) { doc.text(`Phone: ${invoice.customer.phone || ""}`, margin + 4, y); y += 4; }
      if (invoice.customer.email) { doc.text(`Email: ${invoice.customer.email || ""}`, margin + 4, y); y += 4; }
      if (invoice.customer.kraPin) { doc.text(`KRA PIN: ${invoice.customer.kraPin || ""}`, margin + 4, y); y += 4; }
      if (invoice.customer.address) {
        const addrLines = doc.splitTextToSize(`Address: ${invoice.customer.address || ""}`, boxWidth - 8);
        doc.text(addrLines, margin + 4, y);
      }
    }



    // ... inside generateInvoicePDF

    // Box 2: Invoice Details
    let detailsHeader = "Invoice Details:";
    if (documentType === 'QUOTATION') detailsHeader = "Quotation Details:";
    if (documentType === 'PROFORMA') detailsHeader = "Proforma Details:";
    drawBox(rightBoxX, detailsY, boxWidth, maxDetailsHeight, detailsHeader);

    y = detailsY + 12;
    const labelX = rightBoxX + 4;
    const valX = rightBoxX + 45;



    const printRow = (label: string, value: string, color?: number[]) => {
      doc.setTextColor(0, 0, 0);
      doc.setFont(font, "normal");
      doc.text(label, labelX, y);
      if (color) doc.setTextColor(color[0], color[1], color[2]);
      doc.text(value, valX, y);
      y += 5;
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
        doc.addImage(barcodeData, "PNG", barcodeX, y + 2, barcodeWidth, barcodeHeight);
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
      startY: detailsY + maxDetailsHeight + 10,
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
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    const footerTopY = finalY + 10;

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

    // Check page break
    if (footerTopY + maxFooterHeight > pageHeight) {
      doc.addPage();
    }

    // Payment Box (Left)
    if (SETTINGS.includePaymentDetails) {
      drawBox(margin, footerTopY, boxWidth, maxFooterHeight, "Payment Details");
      y = footerTopY + 12;
      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      bankDetails.forEach(line => {
        doc.text(line, margin + 4, y);
        y += 4;
      });
    }

    // Summary Box (Right)
    drawBox(rightBoxX, footerTopY, boxWidth, maxFooterHeight, "Summary");

    y = footerTopY + 14;
    const sumLabelX = rightBoxX + 4;
    const sumValX = pageWidth - margin - 4;

    // Calculations for display
    const vatRate = 0.16;
    const vatAmount = invoice.subtotal * vatRate;
    const finalTotal = invoice.subtotal + vatAmount;

    // Subtotal
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Subtotal", sumLabelX, y);
    doc.text(`${currency} ${formatCurrency(invoice.subtotal)}`, sumValX, y, { align: "right" });
    y += 6;

    // VAT
    doc.text(`VAT (16%)`, sumLabelX, y);
    doc.text(`${currency} ${formatCurrency(vatAmount)}`, sumValX, y, { align: "right" });
    y += 6;



    // Grand Total Bar inside the box
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(rightBoxX, y - 4, boxWidth, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont(font, "bold");
    doc.text("Grand Total", sumLabelX, y + 2);
    // Use the calculated total including VAT
    doc.text(`${currency} ${formatCurrency(finalTotal)}`, sumValX, y + 2, { align: "right" });

    // --- Custom Sections (Responsibilities & Terms) ---
    // Calculate start Y for custom sections (below the lowest box)
    let customY = Math.max(y, footerTopY + maxFooterHeight) + 10;

    const printCustomSection = (title: string, content: string) => {
      // Check page break
      if (customY + 20 > pageHeight - 20) {
        doc.addPage();
        customY = margin;
      }

      doc.setFont(font, "bold");
      doc.setFontSize(10);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(String(title), margin, customY);
      customY += 5;

      doc.setFont(font, "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      const lines = doc.splitTextToSize(String(content), pageWidth - (margin * 2));
      doc.text(lines, margin, customY);
      customY += (lines.length * 4) + 8; // Spacing for next section
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