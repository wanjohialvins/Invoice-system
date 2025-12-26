// src/pages/Stock.tsx
/**
 * Stock Inventory Manager
 * 
 * A complete inventory management system allowing CRUD operations on products and services.
 * 
 * Key Features:
 * - Categorized Inventory: Products, Mobilization, Services.
 * - Auto-Calculations: Freight costs based on weight and rate.
 * - Currency Management: Input prices in Ksh or USD with auto-conversion.
 * - Data Persistence: Uses localStorage for stock data and draft forms.
 * - Import/Export: CSV support for bulk data management.
 * 
 * Technical Notes:
 * - 'Merge-on-add' logic prevents duplicate entries by incrementing quantity.
 * - Real-time filtering and search.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaInfoCircle,
  FaBroom,
  FaFileCsv,
  FaDownload,
  FaFileImport,
} from "react-icons/fa";
import { FiBox, FiTruck, FiTool } from "react-icons/fi";
import logo from "../assets/logo.jpg";
import { STORAGE_KEYS, COMPANY, DEFAULT_RATES } from "../constants";

/* -------------------------
   Types & LocalStorage keys
   ------------------------- */
type Category = "products" | "mobilization" | "services";

export interface StockItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  priceKsh: number; // unit price in Ksh
  priceUSD?: number; // unit price in USD (kept for currency sync)
  weight?: number; // kg (optional; used primarily for products)
  description?: string;
  // productFreight not stored separately because it's derived as weight * freightRate * qty
}

/* -------------------------
   Utility helpers
   ------------------------- */

// Returns today's date as ISO yyyy-mm-dd (useful for inputs and for Quotation)
export const getTodayISO = (): string => new Date().toISOString().slice(0, 10);

// Safe JSON parse helper
const safeParse = (s: string | null) => {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

// ID generator
const genId = (prefix = "I") => `${prefix}${Math.floor(100000 + Math.random() * 900000)}`;

// Convert stock to CSV and trigger download
const downloadCSV = (stock: Record<Category, StockItem[]>, filename = "stock_export.csv") => {
  const rows: string[] = [];
  // header
  rows.push(["id", "name", "category", "quantity", "priceKsh", "priceUSD", "weight", "description"].join(","));
  // flatten
  (Object.keys(stock) as Category[]).forEach((cat) => {
    stock[cat].forEach((it) => {
      const r = [
        `"${it.id}"`,
        `"${(it.name || "").replace(/"/g, '""')}"`,
        `"${cat}"`,
        it.quantity,
        it.priceKsh,
        it.priceUSD ?? "",
        it.weight ?? "",
        `"${(it.description || "").replace(/"/g, '""')}"`,
      ];
      rows.push(r.join(","));
    });
  });
  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* -------------------------
   Initializers
   ------------------------- */
// Loads stock from storage or falls back to the hardcoded sample data.
const getInitialStock = (): Record<Category, StockItem[]> => {
  const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
  if (raw) {
    const parsed = safeParse(raw);
    if (parsed) {
      return {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        mobilization: Array.isArray(parsed.mobilization) ? parsed.mobilization : [],
        services: Array.isArray(parsed.services) ? parsed.services : [],
      };
    }
  }

  // Initial Seed Data (Professional IT/Solar/Telecom Inventory)
  // Used if no data is found in storage.
  return {
    products: [
      { id: genId(), name: "Mono Perc Solar Panel (450W)", category: "products", quantity: 50, priceKsh: 18500, priceUSD: 145, weight: 22, description: "High-efficiency monocrystalline solar panel" },
      { id: genId(), name: "Victron MultiPlus-II 48/5000", category: "products", quantity: 8, priceKsh: 245000, priceUSD: 1900, weight: 30, description: "48V Inverter/Charger 5000VA" },
      { id: genId(), name: "SmartSolar MPPT 250/100", category: "products", quantity: 15, priceKsh: 85000, priceUSD: 650, weight: 4.5, description: "Solar Max Power Point Tracker" },
      { id: genId(), name: "LiFePO4 Lithium Battery (48V 100Ah)", category: "products", quantity: 12, priceKsh: 165000, priceUSD: 1280, weight: 45, description: "Deep cycle lithium energy storage" },
      { id: genId(), name: "Pylontech US3000C Battery Module", category: "products", quantity: 10, priceKsh: 195000, priceUSD: 1500, weight: 32, description: "3.5kWh Li-ion Battery Module" },
      { id: genId(), name: "Victron Cerbo GX", category: "products", quantity: 20, priceKsh: 45000, priceUSD: 350, weight: 1, description: "System monitoring center" },
      { id: genId(), name: "Victron Lynx Distributor", category: "products", quantity: 25, priceKsh: 28000, priceUSD: 215, weight: 2, description: "Modular DC distribution system" },
      { id: genId(), name: "Solar PV Cable (6mm²)", category: "products", quantity: 1000, priceKsh: 150, priceUSD: 1.2, weight: 0.1, description: "UV resistant DC solar cable (per meter)" },
      { id: genId(), name: "MC4 Solar Connectors (Pair)", category: "products", quantity: 500, priceKsh: 250, priceUSD: 2, weight: 0.05, description: "Male/Female connector pair" },
      { id: genId(), name: "12U Wall Mount Server Rack", category: "products", quantity: 5, priceKsh: 12000, priceUSD: 95, weight: 15, description: "Network cabinet with glass door" },
      { id: genId(), name: "Ubiquiti UniFi Access Point (WiFi 6)", category: "products", quantity: 30, priceKsh: 22000, priceUSD: 170, weight: 0.8, description: "Long-range enterprise WiFi AP" },
      { id: genId(), name: "Mikrotik Cloud Core Router", category: "products", quantity: 4, priceKsh: 65000, priceUSD: 500, weight: 3, description: "High performance enterprise router" },
      { id: genId(), name: "Agilon HF UPS 1kVA / 2kVA / 3kVA", category: "products", quantity: 10, priceKsh: 45000, priceUSD: 350, weight: 12, description: "Online Double Conversion UPS" },
      { id: genId(), name: "Cisco 24-Port Gigabit Switch", category: "products", quantity: 6, priceKsh: 35000, priceUSD: 270, weight: 4, description: "Managed L2 switch" },
      { id: genId(), name: "Cat6 Ethernet Cable (305m Box)", category: "products", quantity: 20, priceKsh: 18000, priceUSD: 140, weight: 10, description: "Pure Copper UTP Cable" },
    ],
    mobilization: [
      { id: genId(), name: "Site Mobilization & Logistics (Local)", category: "mobilization", quantity: 1, priceKsh: 15000, priceUSD: 115, weight: 0, description: "Transport and setup costs within Nairobi" },
      { id: genId(), name: "Site Mobilization & Logistics (Upcountry)", category: "mobilization", quantity: 1, priceKsh: 45000, priceUSD: 350, weight: 0, description: "Transport and setup costs outside Nairobi" },
      { id: genId(), name: "Specialized Equipment Rental (Crane)", category: "mobilization", quantity: 1, priceKsh: 25000, priceUSD: 195, weight: 0, description: "Crane hire for panel lifting" },
      { id: genId(), name: "Scaffolding Setup & Rental", category: "mobilization", quantity: 1, priceKsh: 12000, priceUSD: 95, weight: 0, description: "Per week rental" },
      { id: genId(), name: "Technician Travel & Accommodation (Per Day)", category: "mobilization", quantity: 4, priceKsh: 8000, priceUSD: 60, weight: 0, description: "Per technician per day" },
      { id: genId(), name: "Safety Gear & PPE Provision", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, weight: 0, description: "Safety compliance kit" },
      { id: genId(), name: "Site Survey & Preliminary Assessment", category: "mobilization", quantity: 1, priceKsh: 10000, priceUSD: 80, weight: 0, description: "Initial site visit" },
      { id: genId(), name: "Transport - Pickup Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 100, priceUSD: 0.8, weight: 0, description: "Logistics cost per km" },
      { id: genId(), name: "Transport - 3 Ton Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 150, priceUSD: 1.2, weight: 0, description: "Heavy load transport per km" },
      { id: genId(), name: "Generator Rental (Per Day)", category: "mobilization", quantity: 2, priceKsh: 8500, priceUSD: 65, weight: 0, description: "Backup power during installation" },
      { id: genId(), name: "Network Tool Kit Mobilization", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, weight: 0, description: "Specialized networking tools" },
      { id: genId(), name: "Fiber Splicing Kit Rental", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, weight: 0, description: "Fusion splicer daily rate" },
      { id: genId(), name: "Post-Installation Cleanup", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, weight: 0, description: "Site cleaning and waste disposal" },
    ],
    services: [
      { id: genId(), name: "Solar System Installation (Labor)", category: "services", quantity: 1, priceKsh: 25000, priceUSD: 195, weight: 0, description: "Professional installation labor charge" },
      { id: genId(), name: "Network Infrastructure Setup (Labor)", category: "services", quantity: 1, priceKsh: 35000, priceUSD: 270, weight: 0, description: "Cabling and configuration labor" },
      { id: genId(), name: "Solar Power Audit & Consulting", category: "services", quantity: 1, priceKsh: 15000, priceUSD: 115, weight: 0, description: "Energy needs assessment report" },
      { id: genId(), name: "Annual Maintenance Contract (Solar)", category: "services", quantity: 1, priceKsh: 50000, priceUSD: 385, weight: 0, description: "Preventive maintenance service per year" },
      { id: genId(), name: "Annual Maintenance Contract (IT/Network)", category: "services", quantity: 1, priceKsh: 120000, priceUSD: 920, weight: 0, description: "Comprehensive IT support per year" },
      { id: genId(), name: "Fiber Optic Splicing & Termination", category: "services", quantity: 24, priceKsh: 1500, priceUSD: 12, weight: 0, description: "Per core splicing charge" },
      { id: genId(), name: "CCTV Camera Installation & Config", category: "services", quantity: 8, priceKsh: 3500, priceUSD: 27, weight: 0, description: "Per camera installation" },
      { id: genId(), name: "Access Control System Setup", category: "services", quantity: 1, priceKsh: 18000, priceUSD: 140, weight: 0, description: "Biometric/Card reader config" },
      { id: genId(), name: "Structured Cabling (Per Point)", category: "services", quantity: 50, priceKsh: 2500, priceUSD: 20, weight: 0, description: "Cable pulling and termination" },
      { id: genId(), name: "Server Room Configuration", category: "services", quantity: 1, priceKsh: 45000, priceUSD: 350, weight: 0, description: "Rack mounting and cable management" },
      { id: genId(), name: "Wi-Fi Site Survey & Heatmapping", category: "services", quantity: 1, priceKsh: 20000, priceUSD: 155, weight: 0, description: "Coverage analysis report" },
      { id: genId(), name: "Remote System Monitoring (Monthly)", category: "services", quantity: 12, priceKsh: 5000, priceUSD: 40, weight: 0, description: "Victron VRM / Ubiquiti remote support" },
      { id: genId(), name: "IT Support Retainer (Standard)", category: "services", quantity: 12, priceKsh: 30000, priceUSD: 230, weight: 0, description: "Monthly support fee" },
      { id: genId(), name: "Emergency Troubleshooting Call-out", category: "services", quantity: 1, priceKsh: 10000, priceUSD: 80, weight: 0, description: "Urgent site visit fee" },
      { id: genId(), name: "Firmware Update & Optimization", category: "services", quantity: 1, priceKsh: 8000, priceUSD: 60, weight: 0, description: "System software upgrade" },
    ],
  };
};

const getInitialFreight = (): number => {
  const raw = localStorage.getItem(STORAGE_KEYS.FREIGHT_RATE);
  return raw ? Number(raw) : DEFAULT_RATES.FREIGHT;
};

const getInitialCurrencyRate = (): number => {
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENCY_RATE);
  return raw ? Number(raw) : DEFAULT_RATES.CURRENCY;
};

/* -------------------------
   Component
   ------------------------- */
const Stock: React.FC = () => {
  /* ---------------------
     State Management
     --------------------- */
  // Primary data Store
  const [stock, setStock] = useState<Record<Category, StockItem[]>>(getInitialStock);
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [search, setSearch] = useState<string>("");

  // Configuration Rates (Persisted)
  const [freightRate, setFreightRate] = useState<number>(getInitialFreight);
  const [currencyRate, setCurrencyRate] = useState<number>(getInitialCurrencyRate);

  // UI Toggles
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);

  // Form State (Controlled inputs for Add/Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formQty, setFormQty] = useState<number>(1);
  const [formPriceKsh, setFormPriceKsh] = useState<number>(0);
  const [formPriceUSD, setFormPriceUSD] = useState<number>(0);
  const [formWeight, setFormWeight] = useState<number | undefined>(undefined);
  const [formDescription, setFormDescription] = useState<string>("");

  /* ---------------------
     Effects: Persistence
     --------------------- */
  // Saves data to localStorage whenever it changes.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FREIGHT_RATE, String(freightRate));
  }, [freightRate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY_RATE, String(currencyRate));
  }, [currencyRate]);

  // Autosave Draft: Persist form state so refresh doesn't lose partially typed data.
  useEffect(() => {
    const draft = {
      editingId,
      formName,
      formQty,
      formPriceKsh,
      formPriceUSD,
      formWeight,
      formDescription,
      activeCategory,
      showDescriptions,
    };
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  }, [editingId, formName, formQty, formPriceKsh, formPriceUSD, formWeight, formDescription, activeCategory, showDescriptions]);

  // Restore Draft on Mount
  useEffect(() => {
    const d = safeParse(localStorage.getItem(STORAGE_KEYS.DRAFT));
    if (d) {
      setEditingId(d.editingId ?? null);
      setFormName(d.formName ?? "");
      setFormQty(d.formQty ?? 1);
      setFormPriceKsh(d.formPriceKsh ?? 0);
      setFormPriceUSD(d.formPriceUSD ?? 0);
      setFormWeight(d.formWeight ?? undefined);
      setFormDescription(d.formDescription ?? "");
      setActiveCategory(d.activeCategory ?? "products");
      setShowDescriptions(typeof d.showDescriptions === "boolean" ? d.showDescriptions : true);
    }
  }, []);

  /* ---------------------
     Computed Values
     --------------------- */

  // Filter list based on search term and active category
  const filteredItems = useMemo(() => {
    return stock[activeCategory].filter((it) =>
      it.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [stock, activeCategory, search]);

  // Calculate Total Inventory Value (Ksh)
  const totalStockValue = useMemo(() => {
    return (Object.values(stock) as StockItem[][])
      .flat()
      .reduce((s, it) => s + (it.priceKsh || 0) * (it.quantity || 0), 0);
  }, [stock]);

  // Calculate Total Projected Freight Cost
  const totalFreight = useMemo(() => {
    return (Object.values(stock) as StockItem[][])
      .flat()
      .reduce((s, it) => s + ((it.weight || 0) * freightRate * (it.quantity || 0)), 0);
  }, [stock, freightRate]);

  /* ---------------------
     Currency Sync
     --------------------- */
  // Updates USD when Ksh changes
  const onKshChangeInForm = (value: number) => {
    setFormPriceKsh(value);
    setFormPriceUSD(Number((value / currencyRate).toFixed(2)));
  };

  // Updates Ksh when USD changes
  const onUsdChangeInForm = (value: number) => {
    setFormPriceUSD(value);
    setFormPriceKsh(Math.round(value * currencyRate));
  };

  /* ---------------------
     CRUD Operations
     --------------------- */

  // Handles both Adding new items and Updating existing ones.
  // Implements 'Merge-on-add' if a duplicate name is detected in the same category.
  const handleAddOrUpdate = () => {
    if (!formName.trim()) return alert("Please enter a name.");
    if (formPriceKsh <= 0) return alert("Enter a valid unit price in Ksh.");
    if (formQty <= 0) return alert("Enter a valid quantity.");

    const cat = activeCategory;
    const existingIndex = stock[cat].findIndex(
      (it) => it.name.trim().toLowerCase() === formName.trim().toLowerCase()
    );

    if (editingId) {
      // Update existing item
      const updatedCat = stock[cat].map((it) =>
        it.id === editingId
          ? {
            ...it,
            name: formName.trim(),
            quantity: formQty,
            priceKsh: formPriceKsh,
            priceUSD: formPriceUSD,
            weight: formWeight ?? undefined,
            description: showDescriptions ? formDescription || undefined : undefined,
          }
          : it
      );
      setStock({ ...stock, [cat]: updatedCat });
      setEditingId(null);
    } else if (existingIndex >= 0) {
      // Merge with existing item (Increment Qty)
      const updated = [...stock[cat]];
      const found = updated[existingIndex];
      const newQty = (found.quantity || 0) + formQty;
      updated[existingIndex] = {
        ...found,
        quantity: newQty,
        priceKsh: formPriceKsh, // Updates to latest price
        priceUSD: formPriceUSD,
        weight: formWeight ?? found.weight,
        description: showDescriptions ? formDescription || found.description : undefined,
      };
      setStock({ ...stock, [cat]: updated });
    } else {
      // Create new item
      const id = genId(cat[0].toUpperCase());
      const newItem: StockItem = {
        id,
        name: formName.trim(),
        category: cat,
        quantity: formQty,
        priceKsh: formPriceKsh,
        priceUSD: formPriceUSD,
        weight: formWeight ?? undefined,
        description: showDescriptions ? formDescription || undefined : undefined,
      };
      setStock({ ...stock, [cat]: [...stock[cat], newItem] });
    }

    // Reset Form
    setFormName("");
    setFormQty(1);
    setFormPriceKsh(0);
    setFormPriceUSD(0);
    setFormWeight(undefined);
    setFormDescription("");
    setEditingId(null);
  };

  // Populate form for editing
  const handleEdit = (it: StockItem) => {
    setActiveCategory(it.category);
    setEditingId(it.id);
    setFormName(it.name);
    setFormQty(it.quantity || 1);
    setFormPriceKsh(it.priceKsh || 0);
    setFormPriceUSD(it.priceUSD ?? Number(((it.priceKsh || 0) / currencyRate).toFixed(2)));
    setFormWeight(it.weight);
    setFormDescription(it.description || "");
    if (it.description) setShowDescriptions(true);
  };

  // Remove item
  const handleDelete = (id: string) => {
    if (!confirm("Delete this item?")) return;
    const cat = activeCategory;
    setStock({ ...stock, [cat]: stock[cat].filter((i) => i.id !== id) });
  };

  // Nuke all data
  const handleClearAll = () => {
    if (!confirm("This will clear ALL stock data and freight & currency rates. Proceed?")) return;
    localStorage.removeItem(STORAGE_KEYS.STOCK);
    localStorage.removeItem(STORAGE_KEYS.FREIGHT_RATE);
    localStorage.removeItem(STORAGE_KEYS.CURRENCY_RATE);
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
    setStock({ products: [], mobilization: [], services: [] });
    setFreightRate(getInitialFreight());
    setCurrencyRate(getInitialCurrencyRate());
    // clear form
    setFormName("");
    setFormQty(1);
    setFormPriceKsh(0);
    setFormPriceUSD(0);
    setFormWeight(undefined);
    setFormDescription("");
    setEditingId(null);
  };

  /* ---------------------
     Import/Export
     --------------------- */

  const handleExportCSV = () => {
    downloadCSV(stock, `konsut_stock_${getTodayISO()}.csv`);
  };

  // Import from CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;

      const newItems: Record<Category, StockItem[]> = { products: [], mobilization: [], services: [] };
      let count = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));

        if (cols.length < 2) continue;

        const catRaw = cols[0].toLowerCase();
        let cat: Category = "products";
        if (catRaw.includes("mob")) cat = "mobilization";
        else if (catRaw.includes("serv")) cat = "services";

        const newItem: StockItem = {
          id: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: cols[1],
          category: cat,
          quantity: 1,
          priceKsh: parseFloat(cols[2]) || 0,
          priceUSD: parseFloat(cols[3]) || 0,
          weight: parseFloat(cols[4]) || 0,
          description: cols[5] || ""
        };

        newItems[cat].push(newItem);
        count++;
      }

      if (count > 0) {
        if (confirm(`Found ${count} items. Append to existing stock?`)) {
          const updated = {
            products: [...stock.products, ...newItems.products],
            mobilization: [...stock.mobilization, ...newItems.mobilization],
            services: [...stock.services, ...newItems.services]
          };
          setStock(updated);
          localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(updated));
          alert("Import successful!");
        }
      } else {
        alert("No valid items found. check format: Category,Name,PriceKsh,PriceUSD,Weight,Description");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ---------------------
     Quick seed sample data (for dev/testing)
     --------------------- */
  const seedSample = () => {
    const sample: Record<Category, StockItem[]> = {
      products: [
        { id: "P1001", name: "Mono Perc Solar Panel (450W)", category: "products", quantity: 50, priceKsh: 18500, priceUSD: 145, weight: 22, description: "High-efficiency monocrystalline solar panel" },
        { id: "P1002", name: "Victron MultiPlus-II 48/5000", category: "products", quantity: 8, priceKsh: 245000, priceUSD: 1900, weight: 30, description: "48V Inverter/Charger 5000VA" },
        { id: "P1003", name: "SmartSolar MPPT 250/100", category: "products", quantity: 15, priceKsh: 85000, priceUSD: 650, weight: 4.5, description: "Solar Max Power Point Tracker" },
        { id: "P1004", name: "LiFePO4 Lithium Battery (48V 100Ah)", category: "products", quantity: 12, priceKsh: 165000, priceUSD: 1280, weight: 45, description: "Deep cycle lithium energy storage" },
        { id: genId(), name: "Pylontech US3000C Battery Module", category: "products", quantity: 10, priceKsh: 195000, priceUSD: 1500, weight: 32, description: "3.5kWh Li-ion Battery Module" },
        { id: genId(), name: "Victron Cerbo GX", category: "products", quantity: 20, priceKsh: 45000, priceUSD: 350, weight: 1, description: "System monitoring center" },
        { id: genId(), name: "Victron Lynx Distributor", category: "products", quantity: 25, priceKsh: 28000, priceUSD: 215, weight: 2, description: "Modular DC distribution system" },
        { id: genId(), name: "Solar PV Cable (6mm²)", category: "products", quantity: 1000, priceKsh: 150, priceUSD: 1.2, weight: 0.1, description: "UV resistant DC solar cable (per meter)" },
        { id: genId(), name: "MC4 Solar Connectors (Pair)", category: "products", quantity: 500, priceKsh: 250, priceUSD: 2, weight: 0.05, description: "Male/Female connector pair" },
        { id: genId(), name: "12U Wall Mount Server Rack", category: "products", quantity: 5, priceKsh: 12000, priceUSD: 95, weight: 15, description: "Network cabinet with glass door" },
        { id: genId(), name: "Ubiquiti UniFi Access Point (WiFi 6)", category: "products", quantity: 30, priceKsh: 22000, priceUSD: 170, weight: 0.8, description: "Long-range enterprise WiFi AP" },
        { id: genId(), name: "Mikrotik Cloud Core Router", category: "products", quantity: 4, priceKsh: 65000, priceUSD: 500, weight: 3, description: "High performance enterprise router" },
        { id: genId(), name: "Agilon HF UPS 1kVA / 2kVA / 3kVA", category: "products", quantity: 10, priceKsh: 45000, priceUSD: 350, weight: 12, description: "Online Double Conversion UPS" },
        { id: genId(), name: "Cisco 24-Port Gigabit Switch", category: "products", quantity: 6, priceKsh: 35000, priceUSD: 270, weight: 4, description: "Managed L2 switch" },
        { id: genId(), name: "Cat6 Ethernet Cable (305m Box)", category: "products", quantity: 20, priceKsh: 18000, priceUSD: 140, weight: 10, description: "Pure Copper UTP Cable" },
      ],
      mobilization: [
        { id: genId(), name: "Site Mobilization & Logistics (Local)", category: "mobilization", quantity: 1, priceKsh: 15000, priceUSD: 115, weight: 0, description: "Transport and setup costs within Nairobi" },
        { id: genId(), name: "Site Mobilization & Logistics (Upcountry)", category: "mobilization", quantity: 1, priceKsh: 45000, priceUSD: 350, weight: 0, description: "Transport and setup costs outside Nairobi" },
        { id: genId(), name: "Specialized Equipment Rental (Crane)", category: "mobilization", quantity: 1, priceKsh: 25000, priceUSD: 195, weight: 0, description: "Crane hire for panel lifting" },
        { id: genId(), name: "Scaffolding Setup & Rental", category: "mobilization", quantity: 1, priceKsh: 12000, priceUSD: 95, weight: 0, description: "Per week rental" },
        { id: genId(), name: "Technician Travel & Accommodation (Per Day)", category: "mobilization", quantity: 4, priceKsh: 8000, priceUSD: 60, weight: 0, description: "Per technician per day" },
        { id: genId(), name: "Safety Gear & PPE Provision", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, weight: 0, description: "Safety compliance kit" },
        { id: genId(), name: "Site Survey & Preliminary Assessment", category: "mobilization", quantity: 1, priceKsh: 10000, priceUSD: 80, weight: 0, description: "Initial site visit" },
        { id: genId(), name: "Transport - Pickup Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 100, priceUSD: 0.8, weight: 0, description: "Logistics cost per km" },
        { id: genId(), name: "Transport - 3 Ton Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 150, priceUSD: 1.2, weight: 0, description: "Heavy load transport per km" },
        { id: genId(), name: "Generator Rental (Per Day)", category: "mobilization", quantity: 2, priceKsh: 8500, priceUSD: 65, weight: 0, description: "Backup power during installation" },
        { id: genId(), name: "Network Tool Kit Mobilization", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, weight: 0, description: "Specialized networking tools" },
        { id: genId(), name: "Fiber Splicing Kit Rental", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, weight: 0, description: "Fusion splicer daily rate" },
        { id: genId(), name: "Post-Installation Cleanup", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, weight: 0, description: "Site cleaning and waste disposal" },
      ],
      services: [
        { id: genId(), name: "Solar System Installation (Labor)", category: "services", quantity: 1, priceKsh: 25000, priceUSD: 195, weight: 0, description: "Professional installation labor charge" },
        { id: genId(), name: "Network Infrastructure Setup (Labor)", category: "services", quantity: 1, priceKsh: 35000, priceUSD: 270, weight: 0, description: "Cabling and configuration labor" },
        { id: genId(), name: "Solar Power Audit & Consulting", category: "services", quantity: 1, priceKsh: 15000, priceUSD: 115, weight: 0, description: "Energy needs assessment report" },
        { id: genId(), name: "Annual Maintenance Contract (Solar)", category: "services", quantity: 1, priceKsh: 50000, priceUSD: 385, weight: 0, description: "Preventive maintenance service per year" },
        { id: genId(), name: "Annual Maintenance Contract (IT/Network)", category: "services", quantity: 1, priceKsh: 120000, priceUSD: 920, weight: 0, description: "Comprehensive IT support per year" },
        { id: genId(), name: "Fiber Optic Splicing & Termination", category: "services", quantity: 24, priceKsh: 1500, priceUSD: 12, weight: 0, description: "Per core splicing charge" },
        { id: genId(), name: "CCTV Camera Installation & Config", category: "services", quantity: 8, priceKsh: 3500, priceUSD: 27, weight: 0, description: "Per camera installation" },
        { id: genId(), name: "Access Control System Setup", category: "services", quantity: 1, priceKsh: 18000, priceUSD: 140, weight: 0, description: "Biometric/Card reader config" },
        { id: genId(), name: "Structured Cabling (Per Point)", category: "services", quantity: 50, priceKsh: 2500, priceUSD: 20, weight: 0, description: "Cable pulling and termination" },
        { id: genId(), name: "Server Room Configuration", category: "services", quantity: 1, priceKsh: 45000, priceUSD: 350, weight: 0, description: "Rack mounting and cable management" },
        { id: genId(), name: "Wi-Fi Site Survey & Heatmapping", category: "services", quantity: 1, priceKsh: 20000, priceUSD: 155, weight: 0, description: "Coverage analysis report" },
        { id: genId(), name: "Remote System Monitoring (Monthly)", category: "services", quantity: 12, priceKsh: 5000, priceUSD: 40, weight: 0, description: "Victron VRM / Ubiquiti remote support" },
        { id: genId(), name: "IT Support Retainer (Standard)", category: "services", quantity: 12, priceKsh: 30000, priceUSD: 230, weight: 0, description: "Monthly support fee" },
        { id: genId(), name: "Emergency Troubleshooting Call-out", category: "services", quantity: 1, priceKsh: 10000, priceUSD: 80, weight: 0, description: "Urgent site visit fee" },
        { id: genId(), name: "Firmware Update & Optimization", category: "services", quantity: 1, priceKsh: 8000, priceUSD: 60, weight: 0, description: "System software upgrade" },
      ],
    };
    setStock(sample);
    alert("Sample stock seeded.");
  };

  /* ---------------------
     Render
     --------------------- */
  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen font-poppins text-gray-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Inventory</h1>
          <p className="text-gray-500 mt-1">Manage products, mobilization, and services</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button title="Export CSV" onClick={handleExportCSV} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm" aria-label="Export CSV">
            <FaFileCsv />
          </button>

          <label title="Import CSV" className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm cursor-pointer" aria-label="Import CSV">
            <FaFileImport />
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>

          <button title="Seed sample stock" onClick={seedSample} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm" aria-label="Seed sample">
            <FaPlus />
          </button>

          <button title="Clear All Data" onClick={handleClearAll} className="p-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all shadow-sm" aria-label="Clear all">
            <FaBroom />
          </button>
        </div>
      </div>

      {/* Freight & Currency controls; totals */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm flex items-center gap-2 bg-white p-2 rounded shadow-sm">
            <span className="text-xs text-gray-600">Freight Rate Ksh/kg</span>
            <input
              type="number"
              value={freightRate}
              onChange={(e) => setFreightRate(Number(e.target.value || 0))}
              className="w-24 border rounded px-2 py-1 text-sm"
              title="Freight rate (per kg) saved to localStorage"
            />
          </label>

          <label className="text-sm flex items-center gap-2 bg-white p-2 rounded shadow-sm">
            <span className="text-xs text-gray-600">Currency Rate (1 USD = Ksh)</span>
            <input
              type="number"
              value={currencyRate}
              onChange={(e) => setCurrencyRate(Number(e.target.value || 0))}
              className="w-24 border rounded px-2 py-1 text-sm"
              title="Currency conversion rate"
            />
          </label>

          <label title="Toggle descriptions" className="flex items-center gap-2 bg-white p-2 rounded shadow-sm text-sm">
            <input type="checkbox" checked={showDescriptions} onChange={(e) => setShowDescriptions(e.target.checked)} />
            <span className="text-xs">Show Descriptions</span>
            <FaInfoCircle />
          </label>
        </div>

        <div className="bg-white p-2 rounded shadow-sm text-sm">
          <div><strong>Total stock value:</strong> Ksh {totalStockValue.toLocaleString()}</div>
          <div><strong>Total freight (auto):</strong> Ksh {totalFreight.toLocaleString()}</div>
        </div>
      </div>

      {/* Category toggles */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveCategory("products")}
          className={`p-3 rounded-lg font-medium transition-all ${activeCategory === "products" ? "bg-[#0099ff] text-white shadow-lg shadow-blue-500/30" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
          title="Products"
        >
          <FiBox />
        </button>
        <button
          onClick={() => setActiveCategory("mobilization")}
          className={`p-3 rounded-lg font-medium transition-all ${activeCategory === "mobilization" ? "bg-[#0099ff] text-white shadow-lg shadow-blue-500/30" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
          title="Mobilization"
        >
          <FiTruck />
        </button>
        <button
          onClick={() => setActiveCategory("services")}
          className={`p-3 rounded-lg font-medium transition-all ${activeCategory === "services" ? "bg-[#0099ff] text-white shadow-lg shadow-blue-500/30" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}
          title="Services"
        >
          <FiTool />
        </button>
      </div>

      {/* Add / Edit form */}
      <div className="border rounded bg-white p-4 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">{editingId ? "Edit Item" : "Add Item"} • {activeCategory}</h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Name</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)} className="border px-2 py-1 rounded w-full" placeholder="Item name" />
          </div>

          <div>
            <label className="block text-sm mb-1">Quantity</label>
            <input type="number" min={1} value={formQty} onChange={(e) => setFormQty(Number(e.target.value || 1))} className="border px-2 py-1 rounded w-full" />
          </div>

          <div>
            <label className="block text-sm mb-1">Price (Ksh)</label>
            <input type="number" min={0} value={formPriceKsh} onChange={(e) => onKshChangeInForm(Number(e.target.value || 0))} className="border px-2 py-1 rounded w-full" />
          </div>

          <div>
            <label className="block text-sm mb-1">Price (USD)</label>
            <input type="number" min={0} value={formPriceUSD} onChange={(e) => onUsdChangeInForm(Number(e.target.value || 0))} className="border px-2 py-1 rounded w-full" />
          </div>

          {/* Weight only for products */}
          {activeCategory === "products" ? (
            <div>
              <label className="block text-sm mb-1">Weight (kg)</label>
              <input type="number" min={0} value={formWeight ?? ""} onChange={(e) => setFormWeight(e.target.value === "" ? undefined : Number(e.target.value))} className="border px-2 py-1 rounded w-full" />
            </div>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button title={editingId ? "Update item" : "Add item"} onClick={handleAddOrUpdate} className="p-2 rounded bg-brand-600 hover:bg-brand-700 text-white transition-colors">
              <FaPlus />
            </button>

            <button title="Reset form" onClick={() => { setEditingId(null); setFormName(""); setFormQty(1); setFormPriceKsh(0); setFormPriceUSD(0); setFormWeight(undefined); setFormDescription(""); }} className="p-2 rounded bg-gray-200 text-gray-800">
              <FaTrash />
            </button>
          </div>

          {/* Description toggle & textarea (full width) */}
          {showDescriptions && (
            <div className="md:col-span-6">
              <label className="block text-sm mb-1">Description (optional)</label>
              <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={3} className="border px-2 py-1 rounded w-full" />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <FaSearch className="text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeCategory} by name...`} className="border px-2 py-1 rounded w-full" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded shadow-sm border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Qty</th>
              {activeCategory === "products" && <th className="p-2 border">Weight (kg)</th>}
              <th className="p-2 border">Unit Price (Ksh)</th>
              <th className="p-2 border">Freight (Ksh)</th>
              <th className="p-2 border">Total Value (Ksh)</th>
              <th className="p-2 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">No entries in {activeCategory}.</td>
              </tr>
            ) : (
              filteredItems.map((it) => {
                const freightPerItem = (it.weight || 0) * freightRate;
                const itemFreight = freightPerItem * (it.quantity || 0);
                const totalValue = (it.priceKsh || 0) * (it.quantity || 0);
                return (
                  <tr key={it.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 border">{it.id}</td>
                    <td className="p-2 border">{it.name}</td>
                    <td className="p-2 border">{it.category}</td>
                    <td className="p-2 border">{it.quantity}</td>
                    {activeCategory === "products" && <td className="p-2 border">{it.weight ?? "-"}</td>}
                    <td className="p-2 border">Ksh {it.priceKsh.toLocaleString()}</td>
                    <td className="p-2 border">Ksh {itemFreight.toLocaleString()}</td>
                    <td className="p-2 border">Ksh {totalValue.toLocaleString()}</td>
                    <td className="p-2 border text-center">
                      <div className="flex justify-center gap-2">
                        <button title="Edit" onClick={() => handleEdit(it)} className="p-1 text-brand-600 hover:text-brand-800">
                          <FaEdit />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(it.id)} className="p-1 text-red-600">
                          <FaTrash />
                        </button>
                        <button title={it.description || "No description"} className="p-1 text-gray-600">
                          <FaInfoCircle />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div className="text-sm text-gray-700">
          <div><strong>Total stock value:</strong> Ksh {totalStockValue.toLocaleString()}</div>
          <div><strong>Total freight (auto):</strong> Ksh {totalFreight.toLocaleString()}</div>
        </div>

        <div className="flex gap-2">
          <button title="Download stock CSV" onClick={handleExportCSV} className="p-2 rounded bg-brand-600 hover:bg-brand-700 text-white transition-colors">
            <FaDownload />
          </button>
          <button title="Clear all data" onClick={handleClearAll} className="p-2 rounded bg-red-600 text-white">
            <FaBroom />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Stock;