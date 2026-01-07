// src/pages/NewInvoice.tsx
/**
 * New Invoice / Quotation Creator
 * 
 * A comprehensive form interface for generating professional documents.
 * 
 * Key Functionalities:
 * - Inventory Selection: Browse and add items from 'Products', 'Mobilization', and 'Services'.
 * - Dynamic Calculations: Auto-compute Totals and Currency Conversions (USD/Ksh).
 * - Draft Persistence: Uses localStorage to auto-save work in progress (`DRAFT_KEY`).
 * - PDF Generation: Integration with `jspdf` for client-ready documents.
 * - Stock Seeding: Dev tool to populate sample data for testing.
 */
import { DocumentEngine } from "../utils/DocumentEngine";
import { SequenceManager } from "../utils/SequenceManager";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
  FaSpinner,
  FaEraser,
} from "react-icons/fa";
import { FiBox, FiTruck, FiTool } from "react-icons/fi";
import { useToast } from "../contexts/ToastContext";

/* ============================
   Types
   ============================ */
import type { Invoice, InvoiceType, InvoiceItem as InvoiceLine, Product } from "../types/types";

type Category = "products" | "mobilization" | "services";

/* ============================
   Constants
   ============================ */
const STOCK_KEY = "stockData";
const DRAFT_KEY = "konsut_newinvoice_draft_vFinal";
const INVOICES_KEY = "invoices";
const CLIENTS_KEY = "konsut_clients"; // Added constant
const USD_TO_KSH_KEY = "usdToKshRate";
const LAST_SAVED_QUOTE_KEY = "konsut_last_saved_quote";

const COMPANY = {
  name: "KONSUT LTD",
  address1: "P.O BOX 21162-00100",
  address2: "G.P.O NAIROBI",
  phone: "+254 700 420 897",
  email: "info@konsut.co.ke",
  pin: "P052435869T",

};

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
  const { showToast } = useToast();

  // --- Inventory State ---
  // Loaded from localStorage to populate the selection lists.
  const [products, setProducts] = useState<Product[]>([]);
  const [mobilization, setMobilization] = useState<Product[]>([]);
  const [services, setServices] = useState<Product[]>([]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const clientIdParam = searchParams.get("clientId");
  const isEditing = !!editId;

  // -- State --
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [activeDocumentType, setActiveDocumentType] = useState<InvoiceType>("quotation"); // NEW: Document Type

  const [search, setSearch] = useState<Record<Category, string>>({
    products: "",
    mobilization: "",
    services: "",
  });

  // Customer (auto-generate Customer ID)
  const [customerId, setCustomerId] = useState<string>(() => `CUST-${Math.floor(100000 + Math.random() * 900000)}`);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerKraPin, setCustomerKraPin] = useState<string>(""); // NEW: KRA PIN
  const [displayCurrency, setDisplayCurrency] = useState<"Ksh" | "USD">("Ksh");

  // Due date input: user picks a date; daysRemaining auto-calculated
  const todayISO = new Date().toISOString().slice(0, 10);
  const [issuedDate, setIssuedDate] = useState<string>(todayISO);
  const [dueDate, setDueDate] = useState<string>("");

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});



  /* ----------------------------
     Rate & toggles
     ---------------------------- */
  const [usdToKshRate, setUsdToKshRate] = useState<number>(() => {
    const s = localStorage.getItem(USD_TO_KSH_KEY);
    return s ? Number(s) : 130;
  });

  // UI toggles
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
  const [includeDescriptionsInPDF, setIncludeDescriptionsInPDF] = useState<boolean>(true);

  // Custom PDF Sections
  const [includeClientResponsibilities, setIncludeClientResponsibilities] = useState<boolean>(false);
  const [clientResponsibilities, setClientResponsibilities] = useState<string>("1. Provide clear access to the site.\n2. Ensure power and water availability during installation.\n3. Approve final design before work commences.\n4. Secure necessary permits from local authorities.");

  const [includeTermsAndConditions, setIncludeTermsAndConditions] = useState<boolean>(false);
  const [termsAndConditions, setTermsAndConditions] = useState<string>("1. 60% deposit required to commence work.\n2. Balance due upon completion.\n3. Goods remain property of KONSUT LTD until paid in full.\n4. Warranty covers manufacturing defects only.");

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
    // 1. Load global settings
    const ur = localStorage.getItem(USD_TO_KSH_KEY);
    if (ur) setUsdToKshRate(Number(ur));

    // 2. Load stock data
    const rawStock = localStorage.getItem(STOCK_KEY);
    if (rawStock) {
      try {
        const parsed = JSON.parse(rawStock) as Record<Category, Product[]>;
        setProducts(parsed.products ?? []);
        setMobilization(parsed.mobilization ?? []);
        setServices(parsed.services ?? []);
      } catch (e) {
        console.warn("Failed parsing stockData", e);
      }
    }

    // 3. Load Document Data (Edit Mode OR Draft)
    if (isEditing && editId) {
      // --- EDIT MODE ---
      const savedInvoicesString = localStorage.getItem(INVOICES_KEY);
      const savedInvoices: Invoice[] = savedInvoicesString ? JSON.parse(savedInvoicesString) : [];
      const invoiceToEdit = savedInvoices.find(inv => inv.id === editId);

      if (invoiceToEdit) {
        pushToast(`Loaded ${invoiceToEdit.type} ${invoiceToEdit.id}`, "info");

        // Populate State
        setActiveDocumentType(invoiceToEdit.type);
        setCustomerId(invoiceToEdit.customer?.id || "");
        setCustomerName(invoiceToEdit.customer?.name || "");
        setCustomerPhone(invoiceToEdit.customer?.phone || "");
        setCustomerEmail(invoiceToEdit.customer?.email || "");
        setCustomerAddress(invoiceToEdit.customer?.address || "");
        setCustomerKraPin(invoiceToEdit.customer?.kraPin || "");
        setIssuedDate(invoiceToEdit.issuedDate);
        setDueDate(invoiceToEdit.dueDate || invoiceToEdit.quotationValidUntil || "");
        setLines(invoiceToEdit.items || []);

        if (invoiceToEdit.currencyRate) setUsdToKshRate(invoiceToEdit.currencyRate);

        // Load custom fields
        if (invoiceToEdit.clientResponsibilities) {
          setIncludeClientResponsibilities(true);
          setClientResponsibilities(invoiceToEdit.clientResponsibilities);
        } else {
          setIncludeClientResponsibilities(false);
        }

        if (invoiceToEdit.termsAndConditions) {
          setIncludeTermsAndConditions(true);
          setTermsAndConditions(invoiceToEdit.termsAndConditions);
        } else {
          setIncludeTermsAndConditions(false);
        }
      } else {
        pushToast("Invoice to edit not found", "error");
      }
    } else if (clientIdParam) {
      // --- NEW FROM CLIENT ---
      // User came from Clients page to create a new invoice for a specific client
      const storedClients = localStorage.getItem(CLIENTS_KEY);
      if (storedClients) {
        try {
          const clients: any[] = JSON.parse(storedClients);
          const client = clients.find(c => c.id === clientIdParam);
          if (client) {
            pushToast(`Started new invoice for ${client.name}`, "info");
            setCustomerId(client.id);
            setCustomerName(client.name);
            setCustomerPhone(client.phone);
            setCustomerEmail(client.email);
            setCustomerAddress(client.address);
            setCustomerKraPin(client.kraPin || "");
            // Ensure defaults
            setLines([]);
            setIssuedDate(todayISO);
          } else {
            pushToast("Client not found", "error");
          }
        } catch (e) {
          console.error("Failed to load client param", e);
        }
      }
    } else {
      // --- DRAFT MODE ---
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const d = JSON.parse(savedDraft);
          if (d.customerId) setCustomerId(d.customerId);
          if (d.customerName) setCustomerName(d.customerName);
          if (d.customerPhone) setCustomerPhone(d.customerPhone);
          if (d.customerEmail) setCustomerEmail(d.customerEmail);
          if (d.customerAddress) setCustomerAddress(d.customerAddress);
          if (d.customerKraPin) setCustomerKraPin(d.customerKraPin);
          if (d.issuedDate) setIssuedDate(d.issuedDate);
          if (d.dueDate) setDueDate(d.dueDate);
          if (d.lines) setLines(d.lines);
          if (d.usdToKshRate) setUsdToKshRate(d.usdToKshRate);

          if (d.selectedId) setSelectedId(d.selectedId);
          if (d.selectedQty) setSelectedQty(d.selectedQty);

          if (d.activeDocumentType) setActiveDocumentType(d.activeDocumentType);

          if (d.includeClientResponsibilities !== undefined) setIncludeClientResponsibilities(d.includeClientResponsibilities);
          if (d.clientResponsibilities) setClientResponsibilities(d.clientResponsibilities);

          if (d.includeTermsAndConditions !== undefined) setIncludeTermsAndConditions(d.includeTermsAndConditions);
          if (d.termsAndConditions) setTermsAndConditions(d.termsAndConditions);
        } catch (e) {
          console.warn("Failed parsing draft", e);
        }
      }
    }
  }, [editId, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

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
      customerKraPin,
      issuedDate,
      dueDate,
      lines,
      showDescriptions,
      includeDescriptionsInPDF,
      usdToKshRate,
      activeDocumentType,
      includeClientResponsibilities,
      clientResponsibilities,
      includeTermsAndConditions,
      termsAndConditions,
      ...additionalData,
      lastSaved: new Date().toISOString()
    };

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(USD_TO_KSH_KEY, String(usdToKshRate));
      return true;
    } catch (e) {
      console.error("Failed to save data:", e);
      return false;
    }
  }, [customerId, customerName, customerPhone, customerEmail, customerAddress, customerKraPin, issuedDate, dueDate, lines, showDescriptions, includeDescriptionsInPDF, usdToKshRate, selectedId, selectedQty, activeDocumentType, includeClientResponsibilities, clientResponsibilities, includeTermsAndConditions, termsAndConditions]);

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

    // Name is always required
    if (!customerName.trim()) {
      errors.customerName = "Customer name is required";
    }

    // KRA PIN required only for Proforma and Invoice
    if ((activeDocumentType === 'proforma' || activeDocumentType === 'invoice') && !customerKraPin.trim()) {
      errors.customerKraPin = "KRA PIN is required for Proforma and Invoice";
    }

    // Phone, Email, and Due Date are optional for all document types

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

    const existingIndex = lines.findIndex((l) => l.id === id && l.category === cat);
    if (existingIndex >= 0) {
      const updated = [...lines];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].lineTotal = updated[existingIndex].unitPrice * updated[existingIndex].quantity;
      setLines(updated);
    } else {
      const newLine: InvoiceLine = {
        id: prod.id,
        name: prod.name,
        category: cat,
        description: showDescriptions ? prod.description ?? "" : undefined,
        quantity: qty,
        unitPrice: Number(unitKsh),
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
    setLines(updated);
  };

  const decreaseQty = (index: number) => {
    const updated = [...lines];
    updated[index].quantity = Math.max(1, updated[index].quantity - 1);
    updated[index].lineTotal = updated[index].unitPrice * updated[index].quantity;
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
      setCustomerKraPin("");
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
     Save Document (Finalize)
     ---------------------------- */
  const saveDocument = () => {
    if (!validateCustomerInfo()) {
      pushToast("Please fix validation errors", "error");
      return;
    }

    if (lines.length === 0) {
      pushToast("Add at least one item", "error");
      return;
    }

    try {
      // Use SequenceManager for sequential IDs
      // If we are editing a real document (not a draft/new), we should probably keep the ID?
      // But here we are "saving" which implies finalizing.
      // If editId is already a valid format, we keep it. Use regex or check?
      // For simplicity, if it's "New" (no editId) or we are converting, we generate.
      // Actually, saveDocument adds it to the list.
      let docId = editId;
      if (!docId || docId.startsWith("QUO-") || docId.startsWith("PRO-") || docId.startsWith("INV-")) {
        // If we are editing, we keep existing ID.
        // BUT, if we are saving a Draft as a real document for the first time?
        // The current logic doesn't distinguish well.
        // Let's assume if it is a "save", we are minting a new number if one isn't assigned.
        // However, the current code generates a random ID EVERY TIME saveDocument is called?
        // No, saveDocument is manual.
        if (!docId) {
          docId = SequenceManager.getNextNumber(activeDocumentType);
        }
      }


      const invoiceObj: Invoice = {
        id: docId,
        type: activeDocumentType,
        date: new Date().toISOString(),
        issuedDate,
        dueDate: dueDate || "",
        quotationValidUntil: activeDocumentType === 'quotation' ? dueDate : undefined,
        customer: { id: customerId, name: customerName, phone: customerPhone, email: customerEmail, address: customerAddress, kraPin: customerKraPin },
        items: lines,
        subtotal,
        grandTotal,
        tax: 0,
        currencyRate: usdToKshRate,
        status: "draft", // Force draft initially
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      // Save to invoices array
      const raw = localStorage.getItem(INVOICES_KEY);
      const arr = raw ? JSON.parse(raw) : [];

      arr.unshift(invoiceObj);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(arr));

      if (activeDocumentType === 'quotation') {
        localStorage.setItem(LAST_SAVED_QUOTE_KEY, JSON.stringify(invoiceObj));
      }

      // Also save current state as draft
      saveAllData({
        action: "save_document",
        docId: invoiceObj.id,
        timestamp: new Date().toISOString()
      });

      pushToast(`${activeDocumentType.charAt(0).toUpperCase() + activeDocumentType.slice(1)} ${docId} saved successfully`, "success");
    } catch (e) {
      console.error("Failed to save document:", e);
      pushToast("Failed to save document", "error");
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
      // 1. Prepare Data Object
      // Use existing ID if available, otherwise generate ONE time (and save it??)
      // Ideally, we should save before generating PDF to lock the number.
      let finalId = editId;
      if (!finalId) {
        finalId = SequenceManager.getNextNumber(activeDocumentType);
        // Update URL/State to reflect this new ID so we don't burn another one next time
        // This requires navigating or state update.
        // For now, let's just use it for the PDF.
        // BEST PRACTICE: Auto-save the document with this new ID.
        // We will allow the PDF to be generated with the new ID.
      }

      const invoiceData = {
        id: finalId,
        type: activeDocumentType,
        date: new Date().toISOString(),
        issuedDate,
        dueDate: dueDate || "",
        customer: {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          kraPin: customerKraPin
        },
        items: lines,
        subtotal,
        tax: 0,
        grandTotal,
        currencyRate: usdToKshRate,
        status: "draft" as const,
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      // --- AUTO-SAVE LOGIC START ---
      // We want to save this to the main list as if "Save" was clicked.
      const invoiceObjForSave: Invoice = {
        ...invoiceData,
        quotationValidUntil: activeDocumentType === 'quotation' ? dueDate : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const raw = localStorage.getItem(INVOICES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      // Check if ID already exists to avoid duplicates if user clicks multiple times
      const existingIdx = arr.findIndex((inv: Invoice) => inv.id === finalId);
      if (existingIdx >= 0) {
        arr[existingIdx] = invoiceObjForSave;
      } else {
        arr.unshift(invoiceObjForSave);
      }
      localStorage.setItem(INVOICES_KEY, JSON.stringify(arr));

      if (activeDocumentType === 'quotation') {
        localStorage.setItem(LAST_SAVED_QUOTE_KEY, JSON.stringify(invoiceObjForSave));
      }
      // --- AUTO-SAVE LOGIC END ---

      // Use the professional PDF generator with correct document type
      const pdfDocType = activeDocumentType === 'quotation' ? 'QUOTATION'
        : activeDocumentType === 'proforma' ? 'PROFORMA'
          : 'INVOICE';
      await generateInvoicePDF(invoiceData as any, pdfDocType as any);

      // Save PDF generation record
      const pdfRecord = {
        fileName: `KONSUT_${activeDocumentType}_${invoiceData.id}_${Date.now()}.pdf`,
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
      showToast('error', 'PDF generation failed. See console for details');
    }
  };

  /* ----------------------------
     Dev helper: seed sample stock
     ---------------------------- */
  const seedSampleStock = () => {
    const sample: Record<Category, Product[]> = {
      products: [
        { id: "P1001", name: "Mono Perc Solar Panel (450W)", priceKsh: 18500, priceUSD: 145, description: "High-efficiency monocrystalline solar panel" },
        { id: "P1002", name: "Victron MultiPlus-II 48/5000", priceKsh: 245000, priceUSD: 1900, description: "48V Inverter/Charger 5000VA" },
        { id: "P1003", name: "SmartSolar MPPT 250/100", priceKsh: 85000, priceUSD: 650, description: "Solar Max Power Point Tracker" },
        { id: "P1004", name: "LiFePO4 Lithium Battery (48V 100Ah)", priceKsh: 165000, priceUSD: 1280, description: "Deep cycle lithium energy storage" },
        { id: "P1005", name: "Pylontech US3000C Battery Module", priceKsh: 195000, priceUSD: 1500, description: "3.5kWh Li-ion Battery Module" },
        { id: "P1006", name: "Victron Cerbo GX", priceKsh: 45000, priceUSD: 350, description: "System monitoring center" },
        { id: "P1007", name: "Victron Lynx Distributor", priceKsh: 28000, priceUSD: 215, description: "Modular DC distribution system" },
        { id: "P1008", name: "Solar PV Cable (6mm²)", priceKsh: 150, priceUSD: 1.2, description: "UV resistant DC solar cable (per meter)" },
        { id: "P1009", name: "MC4 Solar Connectors (Pair)", priceKsh: 250, priceUSD: 2, description: "Male/Female connector pair" },
        { id: "P1010", name: "12U Wall Mount Server Rack", priceKsh: 12000, priceUSD: 95, description: "Network cabinet with glass door" },
        { id: "P1011", name: "Ubiquiti UniFi Access Point (WiFi 6)", priceKsh: 22000, priceUSD: 170, description: "Long-range enterprise WiFi AP" },
        { id: "P1012", name: "Mikrotik Cloud Core Router", priceKsh: 65000, priceUSD: 500, description: "High performance enterprise router" },
        { id: "P1013", name: "Agilon HF UPS 1kVA / 2kVA / 3kVA", priceKsh: 45000, priceUSD: 350, description: "Online Double Conversion UPS" },
        { id: "P1014", name: "Cisco 24-Port Gigabit Switch", priceKsh: 35000, priceUSD: 270, description: "Managed L2 switch" },
        { id: "P1015", name: "Cat6 Ethernet Cable (305m Box)", priceKsh: 18000, priceUSD: 140, description: "Pure Copper UTP Cable" },
      ],
      mobilization: [
        { id: "M2001", name: "Freight Charges", priceKsh: 5000, priceUSD: 38 },
        { id: "M2002", name: "Site Mobilization & Logistics (Local)", priceKsh: 15000, priceUSD: 115 },
        { id: "M2003", name: "Site Mobilization & Logistics (Upcountry)", priceKsh: 45000, priceUSD: 350 },
        { id: "M2004", name: "Specialized Equipment Rental (Crane)", priceKsh: 25000, priceUSD: 195 },
        { id: "M2005", name: "Scaffolding Setup & Rental", priceKsh: 12000, priceUSD: 95 },
        { id: "M2006", name: "Technician Travel & Accommodation (Per Day)", priceKsh: 8000, priceUSD: 60 },
        { id: "M2007", name: "Safety Gear & PPE Provision", priceKsh: 5000, priceUSD: 40 },
        { id: "M2008", name: "Site Survey & Preliminary Assessment", priceKsh: 10000, priceUSD: 80 },
        { id: "M2009", name: "Transport - Pickup Truck (Per Km)", priceKsh: 100, priceUSD: 0.8 },
        { id: "M2010", name: "Transport - 3 Ton Truck (Per Km)", priceKsh: 150, priceUSD: 1.2 },
        { id: "M2011", name: "Generator Rental (Per Day)", priceKsh: 8500, priceUSD: 65 },
        { id: "M2012", name: "Network Tool Kit Mobilization", priceKsh: 3000, priceUSD: 25 },
        { id: "M2013", name: "Fiber Splicing Kit Rental", priceKsh: 5000, priceUSD: 40 },
        { id: "M2014", name: "Post-Installation Cleanup", priceKsh: 3000, priceUSD: 25 },
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
     Handle Clear Stock
     ---------------------------- */
  const handleClearStock = () => {
    if (!confirm("Clear ALL stock items? This cannot be undone.")) return;
    localStorage.removeItem(STOCK_KEY);
    setProducts([]);
    setMobilization([]);
    setServices([]);
    pushToast("Stock data cleared", "info");
  };

  /* ----------------------------
     Calculations for UI Display
     ---------------------------- */
  const { subtotal, grandTotal } = useMemo(() => {
    return DocumentEngine.calculateTotals(lines);
  }, [lines]);

  const displaySubtotal = displayCurrency === "USD"
    ? (subtotal / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const displayGrandTotal = displayCurrency === "USD"
    ? (grandTotal / usdToKshRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ----------------------------
     Handle Convert (Unidirectional Workflow)
     ---------------------------- */
  const handleConvert = (targetType: InvoiceType) => {
    if (!confirm(`Convert this ${activeDocumentType} to ${targetType}? This will create a NEW document.`)) return;

    try {
      if (!validateCustomerInfo() || lines.length === 0) {
        pushToast("Please complete the form first", "error");
        return;
      }

      // Preserve ID suffix logic: QUO-123 -> PRO-123
      let newId = SequenceManager.getNextNumber(targetType);

      if (editId) {
        const parts = editId.split('-');
        if (parts.length > 1) {
          const suffix = parts.slice(1).join('-');
          // Determine prefix based on target type
          const prefix = targetType === 'quotation' ? 'QUO' : targetType === 'proforma' ? 'PRO' : 'INV';
          newId = `${prefix}-${suffix}`;
        }
      }

      const newInvoice: Invoice = {
        id: newId,
        type: targetType,
        date: new Date().toISOString(),
        issuedDate: new Date().toISOString().split('T')[0],
        dueDate: dueDate || "", // Carry over due date? Or reset? Usually carry over or reset. Let's keep it.
        quotationValidUntil: targetType === 'quotation' ? dueDate : undefined,
        customer: {
          id: customerId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          kraPin: customerKraPin
        },
        items: lines,
        subtotal,
        grandTotal,
        tax: 0,
        currencyRate: usdToKshRate,
        status: "draft",
        convertedFrom: editId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clientResponsibilities: includeClientResponsibilities ? clientResponsibilities : undefined,
        termsAndConditions: includeTermsAndConditions ? termsAndConditions : undefined,
      };

      // Save to invoices array
      const raw = localStorage.getItem(INVOICES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(newInvoice);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(arr));

      pushToast(`Converted to ${targetType}`, "success");

      // Navigate to new document
      setTimeout(() => {
        navigate(`/new-invoice?id=${newId}&type=${targetType}`);
        window.location.reload(); // Force reload to pick up new ID cleanly
      }, 500);

    } catch (e) {
      console.error("Conversion failed:", e);
      pushToast("Conversion failed", "error");
    }
  };

  /* ----------------------------
     Render Component
     ---------------------------- */
  const Toolbar = () => (
    <div className="bg-white p-4 rounded-lg shadow-sm w-full mb-6 border border-gray-100 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        {/* Title & Type Toggles */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              {isEditing ? `Edit ${activeDocumentType}` : `New ${activeDocumentType}`}
              {editId && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">#{editId}</span>}
            </h1>
            <div className="flex gap-2">
              <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all capitalize bg-brand-600 text-white shadow-md`}>
                {activeDocumentType === 'invoice' ? 'Invoice' : activeDocumentType}
              </span>
            </div>
          </div>

          {/* Mobile Action Buttons (Visible only on mobile) */}
          <div className="flex md:hidden items-center gap-2">
            <button onClick={saveDocument} title="Save Draft" className="p-2 rounded-lg bg-green-600 text-white shadow-sm">
              <FaSave />
            </button>
            <button onClick={generatePDF} title="Download PDF" className="p-2 rounded-lg bg-[#0099ff] text-white shadow-sm">
              <FaFilePdf />
            </button>
          </div>
        </div>

        {/* Search & Desktop Actions */}
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-full md:w-64 focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-all">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeCategory}...`}
              value={search[activeCategory]}
              onChange={(e) => setSearch((s) => ({ ...s, [activeCategory]: e.target.value }))}
              className="ml-2 bg-transparent outline-none w-full text-sm placeholder-gray-400 text-gray-700"
            />
          </div>

          {/* Desktop Buttons */}
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <>
              <button onClick={handleClearStock} title="Clear all stock items" className="px-3 py-2 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm">
                <FaEraser size={14} /> Clear Stock
              </button>
              <button onClick={seedSampleStock} title="Add sample stock items" className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm">
                <FaSeedling size={14} /> Seed Stock
              </button>
            </>

            <button onClick={saveDocument} title="Save Document (Ctrl+S)" className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-md shadow-green-500/20">
              <FaSave size={14} /> Save
            </button>

            <button onClick={generatePDF} title="Generate and Download PDF" className="px-3 py-2 rounded-lg bg-[#0099ff] hover:bg-blue-700 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/30">
              <FaFilePdf size={14} /> Download
            </button>

            {/* Workflow Actions */}
            {activeDocumentType === 'quotation' && isEditing && (
              <button
                onClick={() => handleConvert('proforma')}
                title="Convert to Proforma Invoice"
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-md"
              >
                <FaExchangeAlt size={14} /> Convert
              </button>
            )}

            {activeDocumentType === 'proforma' && isEditing && (
              <button
                onClick={() => handleConvert('invoice')}
                title="Convert to Final Invoice"
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs md:text-sm flex items-center gap-2 transition-all shadow-md"
              >
                <FaExchangeAlt size={14} /> Convert
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-poppins text-gray-900">
      <Toolbar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`border p-2 rounded ${validationErrors.customerName ? "border-red-500" : "border-gray-300"}`}
              />
              <input
                placeholder="Phone Number"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className={`border p-2 rounded ${validationErrors.customerPhone ? "border-red-500" : "border-gray-300"}`}
              />
              <input
                placeholder="Email Address *"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className={`border p-2 rounded ${validationErrors.customerEmail ? "border-red-500" : "border-gray-300"}`}
              />
              <input
                placeholder="Address / Location"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="border border-gray-300 p-2 rounded"
              />
              <input
                placeholder="KRA PIN"
                value={customerKraPin}
                onChange={(e) => setCustomerKraPin(e.target.value)}
                className={`border p-2 rounded ${validationErrors.customerKraPin ? "border-red-500" : "border-gray-300"}`}
              />
              {validationErrors.customerKraPin && <span className="text-xs text-red-500 col-span-2">{validationErrors.customerKraPin}</span>}

              {/* Dates */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4 mt-2">
                <label className="block text-sm">
                  <span className="text-gray-600 block mb-1">Issued Date</span>
                  <input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="border p-2 rounded w-full" />
                </label>
                <label className="block text-sm">
                  <span className="text-gray-600 block mb-1">
                    {activeDocumentType === 'quotation' ? 'Valid Until' : 'Due Date'}
                  </span>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`border p-2 rounded w-full ${validationErrors.dueDate ? "border-red-500" : ""}`} />
                  {validationErrors.dueDate && <span className="text-xs text-red-500">{validationErrors.dueDate}</span>}
                </label>
              </div>
            </div>
          </div>

          {/* Inventory Selector */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
              Add Items
            </h2>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button onClick={() => setActiveCategory("products")} title="Browse Products" className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeCategory === "products" ? "bg-[#0099ff] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <FiBox /> Products
              </button>
              <button onClick={() => setActiveCategory("mobilization")} title="Browse Mobilization Costs" className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeCategory === "mobilization" ? "bg-[#0099ff] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <FiTruck /> Mobilization
              </button>
              <button onClick={() => setActiveCategory("services")} title="Browse Services" className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${activeCategory === "services" ? "bg-[#0099ff] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                <FiTool /> Services
              </button>
            </div>

            {/* Selection Row */}
            <div className="flex flex-col md:flex-row gap-3 items-end bg-gray-50 p-4 rounded-lg">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select Item</label>
                <select
                  className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] outline-none transition-all"
                  value={selectedId[activeCategory]}
                  onChange={(e) => setSelectedId((s) => ({ ...s, [activeCategory]: e.target.value }))}
                >
                  <option value="">-- Choose {activeCategory} --</option>
                  {getFilteredForCategory(activeCategory).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.priceKsh ? `Ksh ${p.priceKsh}` : `USD ${p.priceUSD}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-24">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 p-2.5 rounded-lg text-center"
                  value={selectedQty[activeCategory]}
                  onChange={(e) => setSelectedQty((q) => ({ ...q, [activeCategory]: Number(e.target.value) }))}
                />
              </div>

              <button
                onClick={() => handleAddSelected(activeCategory)}
                title="Add Selected Item"
                className="w-full md:w-auto px-6 py-2.5 bg-[#0099ff] hover:bg-blue-600 text-white font-medium rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <FaPlus /> Add
              </button>
            </div>
          </div>

          {/* Selected Items Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Items List ({lines.length})</h3>
              <button
                onClick={() => setIncludeDescriptionsInPDF(!includeDescriptionsInPDF)}
                className={`text-xs px-2 py-1 rounded border ${includeDescriptionsInPDF ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 text-gray-500'}`}
              >
                {includeDescriptionsInPDF ? 'PDF: With Desc' : 'PDF: Compact'}
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">
                No items added yet. Select items above to build your invoice.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((item, idx) => (
                      <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {showDescriptions && item.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => decreaseQty(idx)} title="Decrease Quantity" className="p-1 hover:bg-gray-200 rounded text-gray-500"><FaMinus size={10} /></button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => increaseQty(idx)} title="Increase Quantity" className="p-1 hover:bg-gray-200 rounded text-gray-500"><FaPlus size={10} /></button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {displayCurrency === "USD"
                            ? `$${(item.unitPrice / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            : item.unitPrice.toLocaleString()
                          }
                        </td>
                        <td className="p-3 text-right font-medium">
                          {displayCurrency === "USD"
                            ? `$${(item.lineTotal / usdToKshRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            : item.lineTotal.toLocaleString()
                          }
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => removeLine(idx)} title="Remove Item" className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Custom Notes Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="flex items-center gap-2 font-bold text-gray-700 mb-2 cursor-pointer select-none">
                <input type="checkbox" checked={includeClientResponsibilities} onChange={(e) => setIncludeClientResponsibilities(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500" />
                Client Responsibilities
              </label>
              {includeClientResponsibilities && (
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0099ff] focus:border-transparent outline-none transition-shadow"
                  rows={4}
                  value={clientResponsibilities}
                  onChange={(e) => setClientResponsibilities(e.target.value)}
                  placeholder="Enter client responsibilities..."
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 font-bold text-gray-700 mb-2 cursor-pointer select-none">
                <input type="checkbox" checked={includeTermsAndConditions} onChange={(e) => setIncludeTermsAndConditions(e.target.checked)} className="rounded text-brand-600 focus:ring-brand-500" />
                Terms & Conditions
              </label>
              {includeTermsAndConditions && (
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0099ff] focus:border-transparent outline-none transition-shadow"
                  rows={4}
                  value={termsAndConditions}
                  onChange={(e) => setTermsAndConditions(e.target.value)}
                  placeholder="Enter T&Cs..."
                />
              )}
            </div>
          </div>

        </div>

        {/* RIGHT: Summary & Settings */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 sticky top-6">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Quote Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{displayCurrency === "USD" ? "$" : "Ksh"} {displaySubtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>VAT (16%)</span>
                <span className="font-medium text-gray-900">-</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-lg text-gray-900">Total</span>
                <span className="font-bold text-xl text-[#0099ff]">{displayCurrency === "USD" ? "$" : "Ksh"} {displayGrandTotal}</span>
              </div>
            </div>

            <button onClick={saveDocument} title="Save Document" className="w-full py-3 bg-[#0099ff] hover:bg-blue-600 text-white font-bold rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mb-3">
              <FaSave /> Save Document
            </button>

            <button onClick={generatePDF} title="Generate and Download PDF" className="w-full py-3 bg-white border border-[#0099ff] text-[#0099ff] font-bold rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
              <FaFilePdf /> Download
            </button>

            {/* Settings Toggles in Summary */}
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Display Currency</span>
                <button
                  onClick={() => setDisplayCurrency(c => c === "Ksh" ? "USD" : "Ksh")}
                  title="Toggle Currency"
                  className="text-xs font-bold px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <FaExchangeAlt /> {displayCurrency}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Exchange Rate (1 USD = ? Ksh)</label>
                <input
                  type="number"
                  value={usdToKshRate}
                  onChange={(e) => setUsdToKshRate(Number(e.target.value))}
                  className="w-full border p-2 rounded text-sm bg-gray-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Show Descriptions</span>
                <input type="checkbox" checked={showDescriptions} onChange={(e) => setShowDescriptions(e.target.checked)} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default NewInvoice;
