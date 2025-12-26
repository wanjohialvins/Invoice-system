// src/pages/NewInvoice.tsx
/**
 * New Invoice / Quotation Creator
 * 
 * A comprehensive form interface for generating professional documents.
 * 
 * Key Functionalities:
 * - Inventory Selection: Browse and add items from 'Products', 'Mobilization', and 'Services'.
 * - Dynamic Calculations: Auto-compute Freight, Totals, and Currency Conversions (USD/Ksh).
 * - Draft Persistence: Uses localStorage to auto-save work in progress (`DRAFT_KEY`).
 * - PDF Generation: Integration with `jspdf` for client-ready documents.
 * - Stock Seeding: Dev tool to populate sample data for testing.
 */
import React, { useEffect, useMemo, useState, useCallback } from "react";

import { generateInvoicePDF } from "../utils/pdfGenerator";
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
/* ============================
   Main Component
   ============================ */
const NewInvoice: React.FC = () => {
  // --- Inventory State ---
  // Loaded from localStorage to populate the selection lists.
  const [products, setProducts] = useState<Product[]>([]);
  const [mobilization, setMobilization] = useState<Product[]>([]);
  const [services, setServices] = useState<Product[]>([]);

  // --- UI State ---
  // activeCategory controls which tab (Products/Services/Mobilization) is selected.
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
  }

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

    /* ----------------------------
       PDF Generation
       ----------------------------
       Compiles the current form state into a standardized object expected by the PDF generator.
       - Validates input first.
       - Generates a PDF blob/download.
       - Saves a record of the generated PDF to history.
    */
    if (lines.length === 0) {
      pushToast("Add at least one item", "error");
      return;
    }

    try {
      // 1. Prepare Data Object
      const invoiceData = {
        id: `QUO-${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toISOString(),
        issuedDate,
        dueDate: dueDate || "",
        customer: {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress
        },
        items: lines,
        subtotal,
        tax: 0, // Quotations don't have tax
        productFreightTotal,
        grandTotal,
        freightRate,
        currencyRate: usdToKshRate,
        status: "Pending"
      };

      // Use the professional PDF generator
      await generateInvoicePDF(invoiceData as any, "QUOTATION");

      // Save PDF generation record
      const pdfRecord = {
        fileName: `KONSUT_Invoice_${invoiceData.id}_${Date.now()}.pdf`,
        quoteNumber: invoiceData.id,
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
        pdfFileName: pdfRecord.fileName,
        quoteNumber: invoiceData.id,
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
        { id: "P1001", name: "Mono Perc Solar Panel (450W)", weight: 22, priceKsh: 18500, priceUSD: 145, description: "High-efficiency monocrystalline solar panel" },
        { id: "P1002", name: "Victron MultiPlus-II 48/5000", weight: 30, priceKsh: 245000, priceUSD: 1900, description: "48V Inverter/Charger 5000VA" },
        { id: "P1003", name: "SmartSolar MPPT 250/100", weight: 4.5, priceKsh: 85000, priceUSD: 650, description: "Solar Max Power Point Tracker" },
        { id: "P1004", name: "LiFePO4 Lithium Battery (48V 100Ah)", weight: 45, priceKsh: 165000, priceUSD: 1280, description: "Deep cycle lithium energy storage" },
        { id: "P1005", name: "Pylontech US3000C Battery Module", weight: 32, priceKsh: 195000, priceUSD: 1500, description: "3.5kWh Li-ion Battery Module" },
        { id: "P1006", name: "Victron Cerbo GX", weight: 1, priceKsh: 45000, priceUSD: 350, description: "System monitoring center" },
        { id: "P1007", name: "Victron Lynx Distributor", weight: 2, priceKsh: 28000, priceUSD: 215, description: "Modular DC distribution system" },
        { id: "P1008", name: "Solar PV Cable (6mm²)", weight: 0.1, priceKsh: 150, priceUSD: 1.2, description: "UV resistant DC solar cable (per meter)" },
        { id: "P1009", name: "MC4 Solar Connectors (Pair)", weight: 0.05, priceKsh: 250, priceUSD: 2, description: "Male/Female connector pair" },
        { id: "P1010", name: "12U Wall Mount Server Rack", weight: 15, priceKsh: 12000, priceUSD: 95, description: "Network cabinet with glass door" },
        { id: "P1011", name: "Ubiquiti UniFi Access Point (WiFi 6)", weight: 0.8, priceKsh: 22000, priceUSD: 170, description: "Long-range enterprise WiFi AP" },
        { id: "P1012", name: "Mikrotik Cloud Core Router", weight: 3, priceKsh: 65000, priceUSD: 500, description: "High performance enterprise router" },
        { id: "P1013", name: "Agilon HF UPS 1kVA / 2kVA / 3kVA", weight: 12, priceKsh: 45000, priceUSD: 350, description: "Online Double Conversion UPS" },
        { id: "P1014", name: "Cisco 24-Port Gigabit Switch", weight: 4, priceKsh: 35000, priceUSD: 270, description: "Managed L2 switch" },
        { id: "P1015", name: "Cat6 Ethernet Cable (305m Box)", weight: 10, priceKsh: 18000, priceUSD: 140, description: "Pure Copper UTP Cable" },
      ],
      mobilization: [
        { id: "M2001", name: "Site Mobilization & Logistics (Local)", priceKsh: 15000, priceUSD: 115 },
        { id: "M2002", name: "Site Mobilization & Logistics (Upcountry)", priceKsh: 45000, priceUSD: 350 },
        { id: "M2003", name: "Specialized Equipment Rental (Crane)", priceKsh: 25000, priceUSD: 195 },
        { id: "M2004", name: "Scaffolding Setup & Rental", priceKsh: 12000, priceUSD: 95 },
        { id: "M2005", name: "Technician Travel & Accommodation (Per Day)", priceKsh: 8000, priceUSD: 60 },
        { id: "M2006", name: "Safety Gear & PPE Provision", priceKsh: 5000, priceUSD: 40 },
        { id: "M2007", name: "Site Survey & Preliminary Assessment", priceKsh: 10000, priceUSD: 80 },
        { id: "M2008", name: "Transport - Pickup Truck (Per Km)", priceKsh: 100, priceUSD: 0.8 },
        { id: "M2009", name: "Transport - 3 Ton Truck (Per Km)", priceKsh: 150, priceUSD: 1.2 },
        { id: "M2010", name: "Generator Rental (Per Day)", priceKsh: 8500, priceUSD: 65 },
        { id: "M2011", name: "Network Tool Kit Mobilization", priceKsh: 3000, priceUSD: 25 },
        { id: "M2012", name: "Fiber Splicing Kit Rental", priceKsh: 5000, priceUSD: 40 },
        { id: "M2013", name: "Post-Installation Cleanup", priceKsh: 3000, priceUSD: 25 },
      ],
      services: [
        { id: "S3001", name: "Solar System Installation (Labor)", priceKsh: 25000, priceUSD: 195 },
        { id: "S3002", name: "Network Infrastructure Setup (Labor)", priceKsh: 35000, priceUSD: 270 },
        { id: "S3003", name: "Solar Power Audit & Consulting", priceKsh: 15000, priceUSD: 115 },
        { id: "S3004", name: "Annual Maintenance Contract (Solar)", priceKsh: 50000, priceUSD: 385 },
        { id: "S3005", name: "Annual Maintenance Contract (IT/Network)", priceKsh: 120000, priceUSD: 920 },
        { id: "S3006", name: "Fiber Optic Splicing & Termination", priceKsh: 1500, priceUSD: 12 },
        { id: "S3007", name: "CCTV Camera Installation & Config", priceKsh: 3500, priceUSD: 27 },
        { id: "S3008", name: "Access Control System Setup", priceKsh: 18000, priceUSD: 140 },
        { id: "S3009", name: "Structured Cabling (Per Point)", priceKsh: 2500, priceUSD: 20 },
        { id: "S3010", name: "Server Room Configuration", priceKsh: 45000, priceUSD: 350 },
        { id: "S3011", name: "Wi-Fi Site Survey & Heatmapping", priceKsh: 20000, priceUSD: 155 },
        { id: "S3012", name: "Remote System Monitoring (Monthly)", priceKsh: 5000, priceUSD: 40 },
        { id: "S3013", name: "IT Support Retainer (Standard)", priceKsh: 30000, priceUSD: 230 },
        { id: "S3014", name: "Emergency Troubleshooting Call-out", priceKsh: 10000, priceUSD: 80 },
        { id: "S3015", name: "Firmware Update & Optimization", priceKsh: 8000, priceUSD: 60 },
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
    <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all mb-6 rounded-lg">
      <div>
        <h1 className="text-xl font-bold text-gray-900">New Invoice</h1>
        <p className="text-sm text-gray-500">Create a new invoice or quotation</p>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Search */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 md:flex-none w-full md:w-64 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
          <FaSearch className="text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeCategory}...`}
            value={search[activeCategory]}
            onChange={(e) => setSearch((s) => ({ ...s, [activeCategory]: e.target.value }))}
            className="ml-2 bg-transparent outline-none w-full text-sm placeholder-gray-400 text-gray-700"
          />
        </div>

        {/* Desktop: labeled buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={clearData} className="px-4 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium text-sm flex items-center gap-2 transition-all shadow-sm">
            <FaTrash size={14} /> Clear
          </button>
          <button onClick={seedSampleStock} className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-sm flex items-center gap-2 transition-all shadow-sm">
            <FaSeedling size={14} /> Seed
          </button>
          <button onClick={saveQuotation} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-md shadow-green-500/20">
            <FaSave size={14} /> Save
          </button>
          <button onClick={generatePDF} className="px-4 py-2 rounded-lg bg-[#0099ff] hover:bg-blue-700 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/30">
            <FaFilePdf size={14} /> PDF
          </button>
        </div>

        {/* Mobile: icons only */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <button onClick={clearData} className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100"><FaTrash /></button>
          <button onClick={seedSampleStock} className="p-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-200"><FaSeedling /></button>
          <button onClick={saveQuotation} className="p-2 rounded-lg bg-green-100 text-green-700 border border-green-200"><FaSave /></button>
          <button onClick={generatePDF} className="p-2 rounded-lg bg-brand-100 text-brand-700 border border-brand-200"><FaFilePdf /></button>
        </div>
      </div>
    </div>
  );

  /* ----------------------------
     Render
     ---------------------------- */
  return (
    <div className="bg-gray-50 font-poppins text-gray-900">
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
              <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Customer Details</p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono text-gray-400">{customerId}</span>
                </div>
                <div className="space-y-3">
                  <input
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`border border-gray-300 p-2.5 rounded-lg w-full text-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow ${validationErrors.customerName ? 'border-red-500 ring-1 ring-red-200' : ''}`}
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
                  <label className="text-sm">Valid Till</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`border p-2 rounded ${validationErrors.dueDate ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.dueDate && <p className="text-red-500 text-xs mt-1">{validationErrors.dueDate}</p>}
                  <div className="text-xs text-gray-600 ml-2">
                    {dueDate ? `${Math.ceil((new Date(dueDate).getTime() - new Date(issuedDate).getTime()) / (1000 * 60 * 60 * 24))} day(s) left` : ""}
                  </div>
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
          <button onClick={() => setActiveCategory("products")} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeCategory === "products" ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            <FaSeedling className="md:inline" /> <span className="hidden md:inline">Products</span>
          </button>
          <button onClick={() => setActiveCategory("mobilization")} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeCategory === "mobilization" ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            <FaTruck className="md:inline" /> <span className="hidden md:inline">Mobilization</span>
          </button>
          <button onClick={() => setActiveCategory("services")} className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeCategory === "services" ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            <FaToolbox className="md:inline" /> <span className="hidden md:inline">Services</span>
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
              <button onClick={saveQuotation} className="px-3 py-1 rounded bg-green-600 text-white">Save Quotation</button>
              <button onClick={generatePDF} className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2"><FaFilePdf /> <span className="hidden md:inline">Download PDF</span></button>
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
    </div>
  );
};

export default NewInvoice;
