// src/pages/NewInvoice.tsx
// Final consolidated New Quotation (KONSUT Ltd) - Enhanced Data Persistence

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import {
  FaPlus,
  FaMinus,
  FaSearch,
  FaTrash,
  FaSave,
  FaFilePdf,
  FaExchangeAlt,
  FaEye,
  FaEyeSlash,
  FaSeedling,
  FaTruck,
  FaToolbox,
  FaSpinner,
} from "react-icons/fa";

/* ============================
   Types
   ============================ */
type Category = "products" | "mobilization" | "services";

interface Product {
  id: string;
  name: string;
  weight?: number; // kg
  priceKsh?: number;
  priceUSD?: number;
  description?: string;
}

interface InvoiceLine {
  id: string; // product id
  name: string;
  category: Category;
  description?: string;
  quantity: number;
  unitPrice: number; // Ksh
  productFreight: number; // computed freight for the line (Ksh)
  lineTotal: number; // unitPrice * qty
}

/* ============================
   Constants
   ============================ */
const STOCK_KEY = "stockData";
const DRAFT_KEY = "konsut_newinvoice_draft_vFinal";
const INVOICES_KEY = "invoices";
const FREIGHT_RATE_KEY = "freightRate";
const USD_TO_KSH_KEY = "usdToKshRate";
const LAST_SAVED_QUOTE_KEY = "konsut_last_saved_quote";

const COMPANY = {
  name: "KONSUT Ltd",
  address1: "P.O BOX 21162-00100",
  address2: "G.P.O NAIROBI",
  phone: "+254 700 420 897",
  email: "info@konsutltd.co.ke",
  pin: "P052435869T",
  logoPath: "/src/assets/logo.jpg",
};

/* ============================
   Utility: Load image -> dataURL (for embedding logo in PDF)
   ============================ */
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
      } catch (e) {
        console.warn("image -> dataURL failed", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/* ============================
   Toast helper (simple)
   ============================ */
type Toast = { id: number; message: string; type?: "success" | "error" | "info" };

const useToasts = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (message: string, type: Toast["type"] = "success", ms = 3000) => {
    const id = Math.floor(Math.random() * 1000000);
    setToasts((s) => [...s, { id, message, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), ms);
  };
  return { toasts, push, setToasts };
};

/* ============================
   Main Component
   ============================ */
const NewInvoice: React.FC = () => {
  /* ----------------------------
     Stock (read-only source)
     ---------------------------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [mobilization, setMobilization] = useState<Product[]>([]);
  const [services, setServices] = useState<Product[]>([]);

  /* ----------------------------
     UI state & draft meta
     ---------------------------- */
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [search, setSearch] = useState<Record<Category, string>>({
    products: "",
    mobilization: "",
    services: "",
  });

  // Customer (auto-generate Customer ID)
  const [customerId] = useState<string>(() => `CUST-${Math.floor(100000 + Math.random() * 900000)}`);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [displayCurrency, setDisplayCurrency] = useState<"Ksh" | "USD">("Ksh"); 

  // Due date input: user picks a date; daysRemaining auto-calculated
  const todayISO = new Date().toISOString().slice(0, 10);
  const [issuedDate] = useState<string>(todayISO);
  const [dueDate, setDueDate] = useState<string>("");

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /* ----------------------------
     Rate & toggles
     ---------------------------- */
  const [freightRate, setFreightRate] = useState<number>(() => {
    const s = localStorage.getItem(FREIGHT_RATE_KEY);
    return s ? Number(s) : 50;
  });
  const [usdToKshRate, setUsdToKshRate] = useState<number>(() => {
    const s = localStorage.getItem(USD_TO_KSH_KEY);
    return s ? Number(s) : 130;
  });

  // UI toggles
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
  const [includeDescriptionsInPDF, setIncludeDescriptionsInPDF] = useState<boolean>(true);
  const [showConversionInput, setShowConversionInput] = useState<boolean>(false);

  /* ----------------------------
     Invoice lines + selection (per-category)
     ---------------------------- */
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [selectedId, setSelectedId] = useState<Record<Category, string>>({
    products: "",
    mobilization: "",
    services: "",
  });
  const [selectedQty, setSelectedQty] = useState<Record<Category, number>>({
    products: 1,
    mobilization: 1,
    services: 1,
  });

  /* ----------------------------
     Toasts
     ---------------------------- */
  const { toasts, push: pushToast } = useToasts();

  /* ----------------------------
     Load stock & draft on mount
     ---------------------------- */
  useEffect(() => {
    // Load freight & rate if saved
    const fr = localStorage.getItem(FREIGHT_RATE_KEY);
    if (fr) setFreightRate(Number(fr));
    const ur = localStorage.getItem(USD_TO_KSH_KEY);
    if (ur) setUsdToKshRate(Number(ur));

    // Load stock: try unified STOCK_KEY first
    const raw = localStorage.getItem(STOCK_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<Category, Product[]>;
        setProducts(parsed.products ?? []);
        setMobilization(parsed.mobilization ?? []);
        setServices(parsed.services ?? []);
      } catch (e) {
        console.warn("Failed parsing stockData", e);
      }
    }

    // Load draft
    const draftRaw = localStorage.getItem(DRAFT_KEY);
    if (draftRaw) {
      try {
        const d = JSON.parse(draftRaw);
        setCustomerName(d.customerName ?? "");
        setCustomerPhone(d.customerPhone ?? "");
        setCustomerEmail(d.customerEmail ?? "");
        setCustomerAddress(d.customerAddress ?? "");
        setDueDate(d.dueDate ?? "");
        setLines(d.lines ?? []);
        setShowDescriptions(d.showDescriptions ?? true);
        setIncludeDescriptionsInPDF(d.includeDescriptionsInPDF ?? true);
        setSelectedId(d.selectedId ?? { products: "", mobilization: "", services: "" });
        setSelectedQty(d.selectedQty ?? { products: 1, mobilization: 1, services: 1 });
      } catch (e) {
        console.warn("Failed parsing draft", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------------
     Comprehensive save function
     ---------------------------- */
  const saveAllData = useCallback((additionalData: any = {}) => {
    const dataToSave = {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      issuedDate,
      dueDate,
      lines,
      showDescriptions,
      includeDescriptionsInPDF,
      freightRate,
      usdToKshRate,
      selectedId,
      selectedQty,
      ...additionalData,
      lastSaved: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(FREIGHT_RATE_KEY, String(freightRate));
      localStorage.setItem(USD_TO_KSH_KEY, String(usdToKshRate));
      return true;
    } catch (e) {
      console.error("Failed to save data:", e);
      return false;
    }
  }, [customerId, customerName, customerPhone, customerEmail, customerAddress, issuedDate, dueDate, lines, showDescriptions, includeDescriptionsInPDF, freightRate, usdToKshRate, selectedId, selectedQty]);

  /* ----------------------------
     Auto-save on data changes
     ---------------------------- */
  useEffect(() => {
    saveAllData();
  }, [saveAllData]);

  /* ----------------------------
     Validation
     ---------------------------- */
  const validateCustomerInfo = () => {
    const errors: Record<string, string> = {};
    
    if (!customerName.trim()) {
      errors.customerName = "Customer name is required";
    }
    
    if (!customerPhone.trim()) {
      errors.customerPhone = "Phone number is required";
    } else if (!/^\+?\d{7,15}$/.test(customerPhone)) {
      errors.customerPhone = "Please enter a valid phone number";
    }
    
    if (!customerEmail.trim()) {
      errors.customerEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      errors.customerEmail = "Please enter a valid email address";
    }
    
    if (!dueDate) {
      errors.dueDate = "Due date is required";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ----------------------------
     Derived totals
     ---------------------------- */
  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0), [lines]);
  const productFreightTotal = useMemo(() => lines.reduce((s, l) => s + (l.productFreight || 0), 0), [lines]);
  const grandTotal = subtotal + productFreightTotal;

  // Currency conversion for display
  const displaySubtotal = useMemo(() => {
    return displayCurrency === "USD" ? (subtotal / usdToKshRate).toFixed(2) : subtotal.toFixed(2);
  }, [subtotal, displayCurrency, usdToKshRate]);

  const displayFreightTotal = useMemo(() => {
    return displayCurrency === "USD" ? (productFreightTotal / usdToKshRate).toFixed(2) : productFreightTotal.toFixed(2);
  }, [productFreightTotal, displayCurrency, usdToKshRate]);

  const displayGrandTotal = useMemo(() => {
    return displayCurrency === "USD" ? (grandTotal / usdToKshRate).toFixed(2) : grandTotal.toFixed(2);
  }, [grandTotal, displayCurrency, usdToKshRate]);

  /* ----------------------------
     Helpers: category array + filtered
     ---------------------------- */
  const getCategoryArray = (cat: Category) =>
    cat === "products" ? products : cat === "mobilization" ? mobilization : services;

  const getFilteredForCategory = (cat: Category) => {
    const arr = getCategoryArray(cat);
    const q = (search[cat] || "").trim().toLowerCase();
    if (!q) return arr;
    return arr.filter((p) => p.name.toLowerCase().includes(q));
  };

  /* ----------------------------
     Add item from active category
     ---------------------------- */
  const handleAddSelected = (cat: Category) => {
    const id = selectedId[cat];
    const qty = Math.max(1, Math.floor(selectedQty[cat] || 1));
    if (!id) {
      pushToast("Select an item first", "error");
      return;
    }
    const arr = getCategoryArray(cat);
    const prod = arr.find((p) => p.id === id);
    if (!prod) {
      pushToast("Selected item not found in stock", "error");
      return;
    }

    const unitKsh = prod.priceKsh != null ? Number(prod.priceKsh) : prod.priceUSD != null ? Number(prod.priceUSD) * usdToKshRate : 0;
    const productFreight = cat === "products" && prod.weight && freightRate ? prod.weight * freightRate * qty : 0;

    const existingIndex = lines.findIndex((l) => l.id === id && l.category === cat);
    if (existingIndex >= 0) {
      const updated = [...lines];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].lineTotal = updated[existingIndex].unitPrice * updated[existingIndex].quantity;
      updated[existingIndex].productFreight = (updated[existingIndex].productFreight || 0) + productFreight;
      setLines(updated);
    } else {
      const newLine: InvoiceLine = {
        id: prod.id,
        name: prod.name,
        category: cat,
        description: showDescriptions ? prod.description ?? "" : undefined,
        quantity: qty,
        unitPrice: Number(unitKsh),
        productFreight,
        lineTotal: Number(unitKsh) * qty,
      };
      setLines((s) => [...s, newLine]);
    }

    // reset selection for category
    setSelectedId((s) => ({ ...s, [cat]: "" }));
    setSelectedQty((q) => ({ ...q, [cat]: 1 }));
    pushToast("Item added", "success");
  };

  /* ----------------------------
     Quantity controls (increment/decrement)
     ---------------------------- */
  const increaseQty = (index: number) => {
    const updated = [...lines];
    updated[index].quantity += 1;
    updated[index].lineTotal = updated[index].unitPrice * updated[index].quantity;
    if (updated[index].category === "products") {
      const prod = products.find((p) => p.id === updated[index].id);
      updated[index].productFreight = prod && prod.weight && freightRate ? prod.weight * freightRate * updated[index].quantity : 0;
    }
    setLines(updated);
  };

  const decreaseQty = (index: number) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, updated[index].quantity - 1);
    updated[index].lineTotal = updated[index].unitPrice * updated[index].quantity;
    if (updated[index].category === "products") {
      const prod = products.find((p) => p.id === updated[index].id);
      updated[index].productFreight = prod && prod.weight && freightRate ? prod.weight * freightRate * updated[index].quantity : 0;
    }
    setLines(updated);
  };

  const removeLine = (index: number) => {
    if (!confirm("Remove this line?")) return;
    setLines((s) => s.filter((_, i) => i !== index));
    pushToast("Line removed", "info");
  };

  /* ----------------------------
     Save Draft (explicit save with feedback)
     ---------------------------- */
  const saveDraft = () => {
    const success = saveAllData({ 
      action: "save_draft",
      timestamp: new Date().toISOString()
    });
    
    if (success) {
      pushToast("Draft saved successfully", "success");
    } else {
      pushToast("Failed to save draft", "error");
    }
  };

  /* ----------------------------
     Clear Data (does NOT clear stock)
     ---------------------------- */
  const clearData = () => {
    if (!confirm("Clear invoice data? This will NOT remove stock items.")) return;
    
    try {
      localStorage.removeItem(DRAFT_KEY);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setCustomerAddress("");
      setDueDate("");
      setLines([]);
      setShowDescriptions(true);
      setIncludeDescriptionsInPDF(true);
      setSelectedId({ products: "", mobilization: "", services: "" });
      setSelectedQty({ products: 1, mobilization: 1, services: 1 });
      setValidationErrors({});
      pushToast("Invoice cleared", "info");
    } catch (e) {
      pushToast("Failed to clear data", "error");
    }
  };

  /* ----------------------------
     Save Quotation to invoices array (finalize)
     ---------------------------- */
  const saveQuotation = () => {
    if (!validateCustomerInfo()) {
      pushToast("Please fix validation errors", "error");
      return;
    }

    if (lines.length === 0) {
      pushToast("Add at least one item", "error");
      return;
    }

    try {
      const invoiceObj = {
        id: `QUO-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toISOString(),
        issuedDate,
        dueDate,
        customer: { id: customerId, name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress },
        items: lines,
        subtotal,
        productFreightTotal,
        grandTotal,
        freightRate,
        currencyRate: usdToKshRate,
        status: "Pending",
        pdfGenerated: false, // Track if PDF was generated
        lastModified: new Date().toISOString()
      };

      // Save to invoices array
      const raw = localStorage.getItem(INVOICES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(invoiceObj);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(arr));

      // Save as last saved quote for easy access
      localStorage.setItem(LAST_SAVED_QUOTE_KEY, JSON.stringify(invoiceObj));

      // Also save current state as draft
      saveAllData({ 
        action: "save_quotation",
        quoteId: invoiceObj.id,
        timestamp: new Date().toISOString()
      });

      pushToast(`Quotation ${invoiceObj.id} saved successfully`, "success");
    } catch (e) {
      console.error("Failed to save quotation:", e);
      pushToast("Failed to save quotation", "error");
    }
  };

  /* ----------------------------
     PDF generation with data saving
     ---------------------------- */
  const generatePDF = async () => {
    if (!validateCustomerInfo()) {
      pushToast("Please fix validation errors", "error");
      return;
    }

    if (lines.length === 0) {
      pushToast("Add at least one item", "error");
      return;
    }

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
      doc.text("QUOTATION", pageWidth / 2, y + 12, { align: "center" });
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
      doc.text(`Customer ID: ${customerId}`, leftX, cursorY + 6);
      doc.text(`Name: ${customerName || "-"}`, leftX, cursorY + 12);
      doc.text(`Phone: ${customerPhone || "-"}`, leftX, cursorY + 18);
      doc.text(`Email: ${customerEmail || "-"}`, leftX, cursorY + 24);
      doc.text(`Address: ${customerAddress || "-"}`, leftX, cursorY + 30);

      // Meta: quotation no, issued date, delivery
      const quo = `QUO-${Math.floor(Math.random() * 1000000)}`;
      doc.setFont("helvetica", "bold");
      doc.text("Quotation No:", rightX, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(quo, rightX + 28, cursorY);
      doc.setFont("helvetica", "bold");
      doc.text("Issued on:", rightX, cursorY + 6);
      doc.setFont("helvetica", "normal");
      doc.text(issuedDate, rightX + 28, cursorY + 6);
      doc.setFont("helvetica", "bold");
      doc.text("Deadline Date:", rightX, cursorY + 12);
      doc.setFont("helvetica", "normal");
      doc.text(dueDate || "-", rightX + 28, cursorY + 12);

      // Table data
      const includeFreightCol = productFreightTotal > 0;
      const includeDesc = includeDescriptionsInPDF && showDescriptions;

      const head: string[] = [
        includeDesc ? "Description" : "Item",
        "Category",
        "Qty",
        "Unit Price (Ksh)",
        "Total (Ksh)",
        ...(includeFreightCol ? ["Freight (Ksh)"] : []),
      ];

      const body = lines.map((l) => [
        includeDesc ? (l.description || l.name) : l.name,
        l.category,
        String(l.quantity),
        l.unitPrice.toFixed(2),
        (l.unitPrice * l.quantity).toFixed(2),
        ...(includeFreightCol ? [(l.productFreight || 0).toFixed(2)] : []),
      ]);

      // Try to use autoTable if available, otherwise use manual table
      if (typeof (doc as any).autoTable === "function") {
        // Use autoTable
        (doc as any).autoTable({
          startY: cursorY + 36,
          head: [head],
          body,
          theme: "grid",
          headStyles: { fillColor: [245, 245, 245] },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: margin, right: margin },
        });
      } else {
        // Manual table creation as fallback
        console.warn("autoTable not available, using manual table creation");
        
        let tableY = cursorY + 36;
        const tableStartX = margin;
        const colWidths = includeFreightCol 
          ? [60, 25, 15, 30, 30, 25] 
          : [70, 25, 15, 35, 35];
        
        // Table header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setFillColor(245, 245, 245);
        
        let currentX = tableStartX;
        head.forEach((header, index) => {
          doc.rect(currentX, tableY, colWidths[index], 8);
          doc.text(header, currentX + 2, tableY + 5);
          currentX += colWidths[index];
        });
        
        // Table body
        doc.setFont("helvetica", "normal");
        tableY += 8;
        
        body.forEach((row) => {
          currentX = tableStartX;
          row.forEach((cell, index) => {
            doc.rect(currentX, tableY, colWidths[index], 7);
            // Truncate text if too long
            const text = String(cell);
            const maxWidth = colWidths[index] - 4;
            const truncated = doc.splitTextToSize(text, maxWidth);
            doc.text(truncated[0] || "", currentX + 2, tableY + 4);
            currentX += colWidths[index];
          });
          tableY += 7;
        });
      }

      // Get the Y position after the table
      const afterTableY = typeof (doc as any).lastAutoTable?.finalY === "number" 
        ? (doc as any).lastAutoTable.finalY 
        : cursorY + 36 + (body.length * 7) + 20;

      // Totals after table
      let ty = afterTableY;
      const totalsX = pageWidth - margin - 80;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Subtotal: Ksh ${subtotal.toFixed(2)}`, totalsX, ty);
      ty += 6;
      doc.text(`Product Freight: Ksh ${productFreightTotal.toFixed(2)}`, totalsX, ty);
      ty += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Grand Total: Ksh ${grandTotal.toFixed(2)}`, totalsX, ty);
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
        "If you have any questions about this price quote, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya";
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
      const pdfFileName = `KONSUT_Quotation_${Date.now()}.pdf`;
      doc.save(pdfFileName);

      // Save PDF generation record
      const pdfRecord = {
        fileName: pdfFileName,
        quoteNumber: quo,
        generatedAt: new Date().toISOString(),
        customerName,
        totalAmount: grandTotal,
        itemCount: lines.length
      };

      // Save to PDF history
      const pdfHistory = JSON.parse(localStorage.getItem("konsut_pdf_history") || "[]");
      pdfHistory.unshift(pdfRecord);
      localStorage.setItem("konsut_pdf_history", JSON.stringify(pdfHistory.slice(0, 50))); // Keep last 50

      // Save current state with PDF info
      saveAllData({ 
        action: "generate_pdf",
        pdfFileName,
        quoteNumber: quo,
        timestamp: new Date().toISOString()
      });

      pushToast("PDF generated and saved successfully", "success");
    } catch (err) {
      console.error("PDF generation failed:", err);
      pushToast("PDF generation failed", "error");
      alert("PDF generation failed. See console for details.");
    }
  };

  /* ----------------------------
     Dev helper: seed sample stock
     ---------------------------- */
  const seedSampleStock = () => {
    const sample: Record<Category, Product[]> = {
      products: [
        { id: "P1001", name: "Concrete Mix 40kg", weight: 40, priceKsh: 3200, priceUSD: 24, description: "Premix concrete bag" },
        { id: "P1002", name: "Rebar 12mm", weight: 12, priceKsh: 900, priceUSD: 7, description: "High tensile rebar" },
        { id: "P1003", name: "Cement 50kg", weight: 50, priceKsh: 600, priceUSD: 4.5, description: "OPC cement 42.5R" },
      ],
      mobilization: [
        { id: "M2001", name: "Truck Hire - 1 day", priceKsh: 12000, priceUSD: 90 },
        { id: "M2002", name: "Crane Hire - 4 hours", priceKsh: 25000, priceUSD: 185 },
      ],
      services: [
        { id: "S3001", name: "Site Survey", priceKsh: 8000, priceUSD: 60 },
        { id: "S3002", name: "Design Consultation", priceKsh: 12000, priceUSD: 90 },
      ],
    };
    localStorage.setItem(STOCK_KEY, JSON.stringify(sample));
    setProducts(sample.products);
    setMobilization(sample.mobilization);
    setServices(sample.services);
    pushToast("Sample stock seeded", "info");
  };

  /* ----------------------------
     Toolbar (adaptive): search + actions
     ---------------------------- */
  const Toolbar = () => (
    <div className="sticky top-0 z-40 bg-white border-b p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3">
        <img src={COMPANY.logoPath} alt="logo" className="h-10 w-auto object-contain" />
        <div>
          <div className="text-lg font-bold" style={{ color: "#007FFF" }}>KONSUT Ltd</div>
          <div className="text-sm text-gray-600">Quotation</div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* Search */}
        <div className="flex items-center border rounded px-2 py-1 flex-1 md:flex-none">
          <FaSearch className="text-gray-500" />
          <input
            type="text"
            placeholder={`Search ${activeCategory}...`}
            value={search[activeCategory]}
            onChange={(e) => setSearch((s) => ({ ...s, [activeCategory]: e.target.value }))}
            className="ml-2 outline-none w-full"
          />
        </div>

        {/* Desktop: labeled buttons */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          <button onClick={saveDraft} className="px-3 py-1 rounded bg-yellow-500 text-white flex items-center gap-2">
            <FaSave /> Save Draft
          </button>
          <button onClick={clearData} className="px-3 py-1 rounded bg-red-500 text-white flex items-center gap-2">
            <FaTrash /> Clear Data
          </button>
          <button onClick={seedSampleStock} className="px-3 py-1 rounded bg-gray-200 text-gray-800 flex items-center gap-2">
            <FaSeedling /> Seed Stock
          </button>
          <button onClick={saveQuotation} className="px-3 py-1 rounded bg-green-600 text-white flex items-center gap-2">
            <FaSave /> Save Quotation
          </button>
          <button onClick={generatePDF} className="px-3 py-1 rounded bg-[#007FFF] text-white flex items-center gap-2">
            <FaFilePdf /> Download PDF
          </button>
        </div>

        {/* Mobile: icons only */}
        <div className="flex md:hidden items-center gap-2 ml-2">
          <button onClick={saveDraft} className="p-2 rounded bg-yellow-500 text-white"><FaSave /></button>
          <button onClick={clearData} className="p-2 rounded bg-red-500 text-white"><FaTrash /></button>
          <button onClick={seedSampleStock} className="p-2 rounded bg-gray-200 text-gray-800"><FaSeedling /></button>
          <button onClick={saveQuotation} className="p-2 rounded bg-green-600 text-white"><FaSave /></button>
          <button onClick={generatePDF} className="p-2 rounded bg-[#007FFF] text-white"><FaFilePdf /></button>
        </div>
      </div>
    </div>
  );

  /* ----------------------------
     Render
     ---------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 font-poppins text-gray-900">
      <Toolbar />

      <div className="p-4 max-w-6xl mx-auto">
        {/* Customer + meta card */}
        <div className="bg-white p-4 rounded mb-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg">{COMPANY.name}</h3>
              <p>{COMPANY.address1}</p>
              <p>{COMPANY.address2}</p>
              <p>Phone: {COMPANY.phone}</p>
              <p>Email: {COMPANY.email}</p>
              <p>PIN: {COMPANY.pin}</p>
            </div>

            <div>
              <p><strong>Customer ID:</strong> {customerId}</p>
              <div className="mt-2">
                <input 
                  placeholder="Customer Name" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  className={`border p-2 rounded w-full ${validationErrors.customerName ? 'border-red-500' : ''}`} 
                />
                {validationErrors.customerName && <p className="text-red-500 text-xs mt-1">{validationErrors.customerName}</p>}
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <input 
                    placeholder="Phone" 
                    value={customerPhone} 
                    onChange={(e) => setCustomerPhone(e.target.value)} 
                    className={`border p-2 rounded w-full ${validationErrors.customerPhone ? 'border-red-500' : ''}`} 
                  />
                  {validationErrors.customerPhone && <p className="text-red-500 text-xs mt-1">{validationErrors.customerPhone}</p>}
                </div>
                <div className="flex-1">
                  <input 
                    placeholder="Email" 
                    value={customerEmail} 
                    onChange={(e) => setCustomerEmail(e.target.value)} 
                    className={`border p-2 rounded w-full ${validationErrors.customerEmail ? 'border-red-500' : ''}`} 
                  />
                  {validationErrors.customerEmail && <p className="text-red-500 text-xs mt-1">{validationErrors.customerEmail}</p>}
                </div>
              </div>
              <textarea 
                placeholder="Address" 
                value={customerAddress} 
                onChange={(e) => setCustomerAddress(e.target.value)} 
                className="border p-2 rounded w-full mt-2" 
                rows={2} 
              />
              <div className="mt-2 flex gap-2 items-center">
                <label className="text-sm">Delivery Deadline</label>
                <input 
                  type="date" 
                  value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  className={`border p-2 rounded ${validationErrors.dueDate ? 'border-red-500' : ''}`} 
                />
                {validationErrors.dueDate && <p className="text-red-500 text-xs mt-1">{validationErrors.dueDate}</p>}
                <div className="text-xs text-gray-600 ml-2">
                  {dueDate ? `${Math.ceil((new Date(dueDate).getTime() - new Date(issuedDate).getTime()) / (1000*60*60*24))} day(s) left` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Freight & conversion controls */}
        <div className="bg-white p-3 rounded mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <p><strong>Freight Rate (Ksh per kg):</strong> <span className="ml-2">{freightRate}</span></p>
            <p className="text-xs text-gray-600">Product freight auto calculated (weight × freight rate × qty).</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button 
              title="Toggle currency display" 
              onClick={() => setDisplayCurrency(d => d === "Ksh" ? "USD" : "Ksh")} 
              className="p-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              <FaExchangeAlt /> {displayCurrency}
            </button>
            <button title="Toggle conversion input" onClick={() => setShowConversionInput(s => !s)} className="p-2 rounded bg-gray-100">
              <FaExchangeAlt />
            </button>
            {showConversionInput && (
              <input 
                type="number" 
                value={usdToKshRate} 
                onChange={(e) => setUsdToKshRate(Number(e.target.value || 0))} 
                className="border p-2 rounded w-40" 
              />
            )}
            <button title="Toggle descriptions visible in editor" onClick={() => setShowDescriptions(s => !s)} className="p-2 rounded bg-gray-100">
              {showDescriptions ? <FaEyeSlash /> : <FaEye />}
            </button>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeDescriptionsInPDF} onChange={(e) => setIncludeDescriptionsInPDF(e.target.checked)} />
              Include descriptions in PDF
            </label>
          </div>
        </div>

        {/* Category buttons */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveCategory("products")} className={`px-3 py-2 rounded ${activeCategory === "products" ? "bg-[#007FFF] text-white" : "bg-gray-200"}`}>
            <FaSeedling className="inline md:hidden" /> <span className="hidden md:inline">Products</span>
          </button>
          <button onClick={() => setActiveCategory("mobilization")} className={`px-3 py-2 rounded ${activeCategory === "mobilization" ? "bg-[#007FFF] text-white" : "bg-gray-200"}`}>
            <FaTruck className="inline md:hidden" /> <span className="hidden md:inline">Mobilization</span>
          </button>
          <button onClick={() => setActiveCategory("services")} className={`px-3 py-2 rounded ${activeCategory === "services" ? "bg-[#007FFF] text-white" : "bg-gray-200"}`}>
            <FaToolbox className="inline md:hidden" /> <span className="hidden md:inline">Services</span>
          </button>
        </div>

        {/* Active panel: search + select + qty + add */}
        <div className="bg-white p-4 rounded mb-4">
          <div className="flex flex-col md:flex-row gap-2 items-center mb-3">
            <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
              <FaSearch />
              <input 
                placeholder={`Search ${activeCategory}...`} 
                value={search[activeCategory]} 
                onChange={(e) => setSearch((s) => ({ ...s, [activeCategory]: e.target.value }))} 
                className="border p-2 rounded w-full" 
              />
            </div>

            <select 
              value={selectedId[activeCategory]} 
              onChange={(e) => setSelectedId((s) => ({ ...s, [activeCategory]: e.target.value }))} 
              className="border p-2 rounded w-full md:w-2/3"
            >
              <option value="">Select {activeCategory}...</option>
              {getFilteredForCategory(activeCategory).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.weight ? `— ${p.weight}kg` : ""} {p.priceKsh ? `— Ksh ${p.priceKsh}` : p.priceUSD ? `— $${p.priceUSD}` : ""}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min={1} 
                value={selectedQty[activeCategory]} 
                onChange={(e) => setSelectedQty((q) => ({ ...q, [activeCategory]: Math.max(1, Number(e.target.value || 1)) }))} 
                className="w-20 border p-2 rounded text-right" 
              />
              <button onClick={() => handleAddSelected(activeCategory)} className="p-2 rounded bg-[#007FFF] text-white"><FaPlus /></button>
            </div>
          </div>

          {showDescriptions && <p className="text-xs text-gray-600">Descriptions are visible in the editor. Toggle to hide them.</p>}
        </div>

        {/* Items table (single scrollable table) */}
        <div className="bg-white p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">Items</h3>

          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1 text-left">{showDescriptions ? "Description" : "Item"}</th>
                  <th className="border px-2 py-1">Category</th>
                  <th className="border px-2 py-1">Qty</th>
                  <th className="border px-2 py-1 text-right">Unit ({displayCurrency})</th>
                  <th className="border px-2 py-1 text-right">Line Total ({displayCurrency})</th>
                  <th className="border px-2 py-1 text-right">Freight ({displayCurrency})</th>
                  <th className="border px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-sm text-gray-600">No items added yet.</td></tr>
                ) : lines.map((l, idx) => (
                  <tr key={`${l.id}-${idx}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border px-2 py-1">{showDescriptions ? (l.description ?? l.name) : l.name}</td>
                    <td className="border px-2 py-1">{l.category}</td>
                    <td className="border px-2 py-1 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button onClick={() => decreaseQty(idx)} className="p-1 rounded bg-gray-100"><FaMinus /></button>
                        <span className="w-8 text-center">{l.quantity}</span>
                        <button onClick={() => increaseQty(idx)} className="p-1 rounded bg-gray-100"><FaPlus /></button>
                      </div>
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {displayCurrency === "USD" 
                        ? `$${(l.unitPrice / usdToKshRate).toFixed(2)}` 
                        : `Ksh ${l.unitPrice.toLocaleString()}`
                      }
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {displayCurrency === "USD" 
                        ? `$${((l.unitPrice * l.quantity) / usdToKshRate).toFixed(2)}` 
                        : `Ksh ${(l.unitPrice * l.quantity).toLocaleString()}`
                      }
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {displayCurrency === "USD" 
                        ? `$${((l.productFreight || 0) / usdToKshRate).toFixed(2)}` 
                        : `Ksh ${(l.productFreight || 0).toLocaleString()}`
                      }
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button onClick={() => removeLine(idx)} className="p-1 text-red-600"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & action area */}
        <div className="bg-white p-4 rounded mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p><strong>Subtotal:</strong> {displayCurrency === "USD" ? `$${displaySubtotal}` : `Ksh ${Number(displaySubtotal).toLocaleString()}`}</p>
              <p><strong>Product Freight Total:</strong> {displayCurrency === "USD" ? `$${displayFreightTotal}` : `Ksh ${Number(displayFreightTotal).toLocaleString()}`}</p>
              <p className="text-lg font-bold"><strong>Grand Total:</strong> {displayCurrency === "USD" ? `$${displayGrandTotal}` : `Ksh ${Number(displayGrandTotal).toLocaleString()}`}</p>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              <button onClick={saveDraft} className="px-3 py-1 rounded bg-yellow-500 text-white flex items-center gap-2"><FaSave /> <span className="hidden md:inline">Save Draft</span></button>
              <button onClick={saveQuotation} className="px-3 py-1 rounded bg-green-600 text-white">Save Quotation</button>
              <button onClick={generatePDF} className="px-3 py-1 rounded bg-[#007FFF] text-white flex items-center gap-2"><FaFilePdf /> <span className="hidden md:inline">Download PDF</span></button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs mb-8">
          If you have any questions about this price quote, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-2 rounded shadow text-white ${t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewInvoice;