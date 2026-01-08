// Stock management
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
import { STORAGE_KEYS, DEFAULT_RATES } from "../constants";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useKeyboardShortcut } from "../hooks/useUtils";

type Category = "products" | "mobilization" | "services";

export interface StockItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  priceKsh: number;
  priceUSD?: number;
  description?: string;
}

// Helpers

// ISO date for inputs
export const getTodayISO = (): string => new Date().toISOString().slice(0, 10);

const safeParse = (s: string | null) => {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};


// ID generator (Short & Uniform)
const genId = (prefix = "P") => `${prefix.charAt(0).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;

// Convert stock to CSV and trigger download
const downloadCSV = (stock: Record<Category, StockItem[]>, filename = "stock_export.csv") => {
  const rows: string[] = [];
  // Standardized Format: Category, Name, Quantity, PriceKsh, PriceUSD, Description
  rows.push(["Category", "Name", "Quantity", "PriceKsh", "PriceUSD", "Description"].join(","));

  (Object.keys(stock) as Category[]).forEach((cat) => {
    stock[cat].forEach((it) => {
      const r = [
        `"${cat}"`,
        `"${(it.name || "").replace(/"/g, '""')}"`,
        it.quantity,
        it.priceKsh,
        it.priceUSD ?? 0,
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

// Initializers
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
      { id: genId(), name: "Mono Perc Solar Panel (450W)", category: "products", quantity: 50, priceKsh: 18500, priceUSD: 145, description: "High-efficiency monocrystalline solar panel" },
      { id: genId(), name: "Victron MultiPlus-II 48/5000", category: "products", quantity: 8, priceKsh: 245000, priceUSD: 1900, description: "48V Inverter/Charger 5000VA" },
      { id: genId(), name: "SmartSolar MPPT 250/100", category: "products", quantity: 15, priceKsh: 85000, priceUSD: 650, description: "Solar Max Power Point Tracker" },
      { id: genId(), name: "LiFePO4 Lithium Battery (48V 100Ah)", category: "products", quantity: 12, priceKsh: 165000, priceUSD: 1280, description: "Deep cycle lithium energy storage" },
      { id: genId(), name: "Pylontech US3000C Battery Module", category: "products", quantity: 10, priceKsh: 195000, priceUSD: 1500, description: "3.5kWh Li-ion Battery Module" },
      { id: genId(), name: "Victron Cerbo GX", category: "products", quantity: 20, priceKsh: 45000, priceUSD: 350, description: "System monitoring center" },
      { id: genId(), name: "Victron Lynx Distributor", category: "products", quantity: 25, priceKsh: 28000, priceUSD: 215, description: "Modular DC distribution system" },
      { id: genId(), name: "Solar PV Cable (6mm²)", category: "products", quantity: 1000, priceKsh: 150, priceUSD: 1.2, description: "UV resistant DC solar cable (per meter)" },
      { id: genId(), name: "MC4 Solar Connectors (Pair)", category: "products", quantity: 500, priceKsh: 250, priceUSD: 2, description: "Male/Female connector pair" },
      { id: genId(), name: "12U Wall Mount Server Rack", category: "products", quantity: 5, priceKsh: 12000, priceUSD: 95, description: "Network cabinet with glass door" },
      { id: genId(), name: "Ubiquiti UniFi Access Point (WiFi 6)", category: "products", quantity: 30, priceKsh: 22000, priceUSD: 170, description: "Long-range enterprise WiFi AP" },
      { id: genId(), name: "Mikrotik Cloud Core Router", category: "products", quantity: 4, priceKsh: 65000, priceUSD: 500, description: "High performance enterprise router" },
      { id: genId(), name: "Agilon HF UPS 1kVA / 2kVA / 3kVA", category: "products", quantity: 10, priceKsh: 45000, priceUSD: 350, description: "Online Double Conversion UPS" },
      { id: genId(), name: "Cisco 24-Port Gigabit Switch", category: "products", quantity: 6, priceKsh: 35000, priceUSD: 270, description: "Managed L2 switch" },
      { id: genId(), name: "Cat6 Ethernet Cable (305m Box)", category: "products", quantity: 20, priceKsh: 18000, priceUSD: 140, description: "Pure Copper UTP Cable" },
    ],
    mobilization: [
      { id: genId(), name: "Freight Charges", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 38, description: "Shipping and transport costs" },
      { id: genId(), name: "Site Mobilization & Logistics (Local)", category: "mobilization", quantity: 1, priceKsh: 15000, priceUSD: 115, description: "Transport and setup costs within Nairobi" },
      { id: genId(), name: "Site Mobilization & Logistics (Upcountry)", category: "mobilization", quantity: 1, priceKsh: 45000, priceUSD: 350, description: "Transport and setup costs outside Nairobi" },
      { id: genId(), name: "Specialized Equipment Rental (Crane)", category: "mobilization", quantity: 1, priceKsh: 25000, priceUSD: 195, description: "Crane hire for panel lifting" },
      { id: genId(), name: "Scaffolding Setup & Rental", category: "mobilization", quantity: 1, priceKsh: 12000, priceUSD: 95, description: "Per week rental" },
      { id: genId(), name: "Technician Travel & Accommodation (Per Day)", category: "mobilization", quantity: 4, priceKsh: 8000, priceUSD: 60, description: "Per technician per day" },
      { id: genId(), name: "Safety Gear & PPE Provision", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, description: "Safety compliance kit" },
      { id: genId(), name: "Site Survey & Preliminary Assessment", category: "mobilization", quantity: 1, priceKsh: 10000, priceUSD: 80, description: "Initial site visit" },
      { id: genId(), name: "Transport - Pickup Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 100, priceUSD: 0.8, description: "Logistics cost per km" },
      { id: genId(), name: "Transport - 3 Ton Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 150, priceUSD: 1.2, description: "Heavy load transport per km" },
      { id: genId(), name: "Generator Rental (Per Day)", category: "mobilization", quantity: 2, priceKsh: 8500, priceUSD: 65, description: "Backup power during installation" },
      { id: genId(), name: "Network Tool Kit Mobilization", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, description: "Specialized networking tools" },
      { id: genId(), name: "Fiber Splicing Kit Rental", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, description: "Fusion splicer daily rate" },
      { id: genId(), name: "Post-Installation Cleanup", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, description: "Site cleaning and waste disposal" },
    ],
    services: [
      { id: genId(), name: "Solar System Installation (Labor)", category: "services", quantity: 1, priceKsh: 25000, priceUSD: 195, description: "Professional installation labor charge" },
      { id: genId(), name: "Network Infrastructure Setup (Labor)", category: "services", quantity: 1, priceKsh: 35000, priceUSD: 270, description: "Cabling and configuration labor" },
      { id: genId(), name: "Solar Power Audit & Consulting", category: "services", quantity: 1, priceKsh: 15000, priceUSD: 115, description: "Energy needs assessment report" },
      { id: genId(), name: "Annual Maintenance Contract (Solar)", category: "services", quantity: 1, priceKsh: 50000, priceUSD: 385, description: "Preventive maintenance service per year" },
      { id: genId(), name: "Annual Maintenance Contract (IT/Network)", category: "services", quantity: 1, priceKsh: 120000, priceUSD: 920, description: "Comprehensive IT support per year" },
      { id: genId(), name: "Fiber Optic Splicing & Termination", category: "services", quantity: 24, priceKsh: 1500, priceUSD: 12, description: "Per core splicing charge" },
      { id: genId(), name: "CCTV Camera Installation & Config", category: "services", quantity: 8, priceKsh: 3500, priceUSD: 27, description: "Per camera installation" },
      { id: genId(), name: "Access Control System Setup", category: "services", quantity: 1, priceKsh: 18000, priceUSD: 140, description: "Biometric/Card reader config" },
      { id: genId(), name: "Structured Cabling (Per Point)", category: "services", quantity: 50, priceKsh: 2500, priceUSD: 20, description: "Cable pulling and termination" },
      { id: genId(), name: "Server Room Configuration", category: "services", quantity: 1, priceKsh: 45000, priceUSD: 350, description: "Rack mounting and cable management" },
      { id: genId(), name: "Wi-Fi Site Survey & Heatmapping", category: "services", quantity: 1, priceKsh: 20000, priceUSD: 155, description: "Coverage analysis report" },
      { id: genId(), name: "Remote System Monitoring (Monthly)", category: "services", quantity: 12, priceKsh: 5000, priceUSD: 40, description: "Victron VRM / Ubiquiti remote support" },
      { id: genId(), name: "IT Support Retainer (Standard)", category: "services", quantity: 12, priceKsh: 30000, priceUSD: 230, description: "Monthly support fee" },
      { id: genId(), name: "Emergency Troubleshooting Call-out", category: "services", quantity: 1, priceKsh: 10000, priceUSD: 80, description: "Urgent site visit fee" },
      { id: genId(), name: "Firmware Update & Optimization", category: "services", quantity: 1, priceKsh: 8000, priceUSD: 60, description: "System software upgrade" },
    ],
  };
};

const getInitialCurrencyRate = (): number => {
  const raw = localStorage.getItem(STORAGE_KEYS.CURRENCY_RATE);
  return raw ? Number(raw) : DEFAULT_RATES.CURRENCY;
};

const Stock: React.FC = () => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // State
  const [stock, setStock] = useState<Record<Category, StockItem[]>>(getInitialStock);
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [search, setSearch] = useState<string>("");

  // Configuration Rates (Persisted)
  const [currencyRate, setCurrencyRate] = useState<number>(getInitialCurrencyRate);

  // UI Toggles
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);

  // Form State (Controlled inputs for Add)
  const [formName, setFormName] = useState<string>("");
  const [formQty, setFormQty] = useState<number>(1);
  const [formPriceKsh, setFormPriceKsh] = useState<number>(0);
  const [formPriceUSD, setFormPriceUSD] = useState<number>(0);
  const [formDescription, setFormDescription] = useState<string>("");

  // Modal State
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY_RATE, String(currencyRate));
  }, [currencyRate]);

  // Autosave Draft: Persist form state so refresh doesn't lose partially typed data.
  useEffect(() => {
    const draft = {
      formName,
      formQty,
      formPriceKsh,
      formPriceUSD,
      formDescription,
      activeCategory,
      showDescriptions,
    };
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  }, [formName, formQty, formPriceKsh, formPriceUSD, formDescription, activeCategory, showDescriptions]);

  // Restore Draft on Mount
  useEffect(() => {
    const d = safeParse(localStorage.getItem(STORAGE_KEYS.DRAFT));
    if (d) {
      setFormName(d.formName ?? "");
      setFormQty(d.formQty ?? 1);
      setFormPriceKsh(d.formPriceKsh ?? 0);
      setFormPriceUSD(d.formPriceUSD ?? 0);
      setFormDescription(d.formDescription ?? "");
      setActiveCategory(d.activeCategory ?? "products");
      setShowDescriptions(typeof d.showDescriptions === "boolean" ? d.showDescriptions : true);
    }
  }, []);

  // Computed
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


  // Currency sync handlers
  const onKshChangeInForm = (value: number) => {
    setFormPriceKsh(value);
    setFormPriceUSD(Number((value / currencyRate).toFixed(2)));
  };

  // Updates Ksh when USD changes
  const onUsdChangeInForm = (value: number) => {
    setFormPriceUSD(value);
    setFormPriceKsh(Number((value * currencyRate).toFixed(2)));
  };

  /* ---------------------
     CRUD Operations
     --------------------- */

  // Handles both Adding new items and Updating existing ones.
  // Implements 'Merge-on-add' if a duplicate name is detected in the same category.
  // Actions

  // Handle Add (Top Form)
  const handleAdd = () => {
    if (!formName.trim()) {
      showToast('warning', 'Please enter a name');
      return;
    }

    const cat = activeCategory;
    const existingIndex = stock[cat].findIndex(
      (it) => it.name.trim().toLowerCase() === formName.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      // Merge with existing
      const updated = [...stock[cat]];
      const found = updated[existingIndex];
      const newQty = (found.quantity || 0) + formQty;
      updated[existingIndex] = {
        ...found,
        quantity: newQty,
        priceKsh: formPriceKsh || found.priceKsh,
        priceUSD: formPriceUSD || found.priceUSD,
        description: showDescriptions ? formDescription || found.description : undefined,
      };
      setStock({ ...stock, [cat]: updated });
      showToast('info', 'Merged with existing item');
    } else {
      // Create new
      const id = genId(cat === 'products' ? 'P' : cat === 'mobilization' ? 'M' : 'S');
      const newItem: StockItem = {
        id,
        name: formName.trim(),
        category: cat,
        quantity: formQty,
        priceKsh: formPriceKsh,
        priceUSD: formPriceUSD,
        description: showDescriptions ? formDescription || undefined : undefined,
      };
      setStock({ ...stock, [cat]: [...stock[cat], newItem] });
      showToast('success', 'Item added');
    }

    // Reset Form
    setFormName("");
    setFormQty(1);
    setFormPriceKsh(0);
    setFormPriceUSD(0);
    setFormDescription("");
  };

  // Handle Update (Modal Form)
  const handleUpdateSubmit = () => {
    if (!editingItem) return;

    const cat = editingItem.category;
    const updatedList = stock[cat].map(it =>
      it.id === editingItem.id ? editingItem : it
    );

    setStock({ ...stock, [cat]: updatedList });
    setEditingItem(null);
    showToast('success', 'Item updated');
  };

  // Populate form for editing
  const handleEdit = (it: StockItem) => {
    setEditingItem(it);
  };

  // Remove item
  const handleDelete = (id: string) => {
    if (!confirm("Delete this item?")) return;
    const cat = activeCategory;
    setStock({ ...stock, [cat]: stock[cat].filter((i) => i.id !== id) });
  };

  // Nuke all data
  const handleClearAll = () => {
    if (!confirm("This will clear ALL stock data and rates. Proceed?")) return;
    localStorage.removeItem(STORAGE_KEYS.STOCK);
    localStorage.removeItem(STORAGE_KEYS.FREIGHT_RATE); // Clean up
    localStorage.removeItem(STORAGE_KEYS.CURRENCY_RATE);
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
    setStock({ products: [], mobilization: [], services: [] });

    setCurrencyRate(getInitialCurrencyRate());
    // clear form
    setFormName("");
    setFormQty(1);
    setFormPriceKsh(0);
    setFormPriceUSD(0);
    setFormDescription("");
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
      // Skip header if present (simple check for 'name' or 'category')
      const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;

      const newItems: Record<Category, StockItem[]> = { products: [], mobilization: [], services: [] };
      let count = 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));

        // Expected Format V2: Category, Name, PriceKsh, PriceUSD, Description (Flexible)
        // We will try to be smart about column mapping

        let catRaw = cols[0].toLowerCase();
        let name = cols[1] || "Unknown Item";
        let qty = 1;
        let pKsh = 0;
        let pUsd = 0;
        let desc = "";

        // Check columns for new format: Category, Name, Qty, PriceKsh, PriceUSD, Desc
        if (cols.length >= 3) qty = parseFloat(cols[2]) || 1;
        if (cols.length >= 4) pKsh = parseFloat(cols[3]) || 0;
        if (cols.length >= 5) pUsd = parseFloat(cols[4]) || 0;
        if (cols.length >= 6) desc = cols[5] || "";

        let cat: Category = "products";
        if (catRaw.includes("mob")) cat = "mobilization";
        else if (catRaw.includes("serv")) cat = "services";

        // Auto-generate ID without requiring it in CSV
        const newItem: StockItem = {
          id: genId(cat === 'products' ? 'P' : cat === 'mobilization' ? 'M' : 'S'),
          name: name,
          category: cat,
          quantity: qty,
          priceKsh: pKsh,
          priceUSD: pUsd,
          description: desc
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
          showToast('success', 'Import successful!');
        }
      } else {
        showToast('warning', 'No valid items found. Check format: Category,Name,PriceKsh,PriceUSD,Description');
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
        { id: "P1001", name: "Mono Perc Solar Panel (450W)", category: "products", quantity: 50, priceKsh: 18500, priceUSD: 145, description: "High-efficiency monocrystalline solar panel" },
        { id: "P1002", name: "Victron MultiPlus-II 48/5000", category: "products", quantity: 8, priceKsh: 245000, priceUSD: 1900, description: "48V Inverter/Charger 5000VA" },
        { id: "P1003", name: "SmartSolar MPPT 250/100", category: "products", quantity: 15, priceKsh: 85000, priceUSD: 650, description: "Solar Max Power Point Tracker" },
        { id: "P1004", name: "LiFePO4 Lithium Battery (48V 100Ah)", category: "products", quantity: 12, priceKsh: 165000, priceUSD: 1280, description: "Deep cycle lithium energy storage" },
        { id: genId(), name: "Pylontech US3000C Battery Module", category: "products", quantity: 10, priceKsh: 195000, priceUSD: 1500, description: "3.5kWh Li-ion Battery Module" },
        { id: genId(), name: "Victron Cerbo GX", category: "products", quantity: 20, priceKsh: 45000, priceUSD: 350, description: "System monitoring center" },
        { id: genId(), name: "Victron Lynx Distributor", category: "products", quantity: 25, priceKsh: 28000, priceUSD: 215, description: "Modular DC distribution system" },
        { id: genId(), name: "Solar PV Cable (6mm²)", category: "products", quantity: 1000, priceKsh: 150, priceUSD: 1.2, description: "UV resistant DC solar cable (per meter)" },
        { id: genId(), name: "MC4 Solar Connectors (Pair)", category: "products", quantity: 500, priceKsh: 250, priceUSD: 2, description: "Male/Female connector pair" },
        { id: genId(), name: "12U Wall Mount Server Rack", category: "products", quantity: 5, priceKsh: 12000, priceUSD: 95, description: "Network cabinet with glass door" },
        { id: genId(), name: "Ubiquiti UniFi Access Point (WiFi 6)", category: "products", quantity: 30, priceKsh: 22000, priceUSD: 170, description: "Long-range enterprise WiFi AP" },
        { id: genId(), name: "Mikrotik Cloud Core Router", category: "products", quantity: 4, priceKsh: 65000, priceUSD: 500, description: "High performance enterprise router" },
        { id: genId(), name: "Agilon HF UPS 1kVA / 2kVA / 3kVA", category: "products", quantity: 10, priceKsh: 45000, priceUSD: 350, description: "Online Double Conversion UPS" },
        { id: genId(), name: "Cisco 24-Port Gigabit Switch", category: "products", quantity: 6, priceKsh: 35000, priceUSD: 270, description: "Managed L2 switch" },
        { id: genId(), name: "Cat6 Ethernet Cable (305m Box)", category: "products", quantity: 20, priceKsh: 18000, priceUSD: 140, description: "Pure Copper UTP Cable" },
      ],
      mobilization: [
        { id: genId(), name: "Freight Charges", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 38, description: "Shipping and transport costs" },
        { id: genId(), name: "Site Mobilization & Logistics (Local)", category: "mobilization", quantity: 1, priceKsh: 15000, priceUSD: 115, description: "Transport and setup costs within Nairobi" },
        { id: genId(), name: "Site Mobilization & Logistics (Upcountry)", category: "mobilization", quantity: 1, priceKsh: 45000, priceUSD: 350, description: "Transport and setup costs outside Nairobi" },
        { id: genId(), name: "Specialized Equipment Rental (Crane)", category: "mobilization", quantity: 1, priceKsh: 25000, priceUSD: 195, description: "Crane hire for panel lifting" },
        { id: genId(), name: "Scaffolding Setup & Rental", category: "mobilization", quantity: 1, priceKsh: 12000, priceUSD: 95, description: "Per week rental" },
        { id: genId(), name: "Technician Travel & Accommodation (Per Day)", category: "mobilization", quantity: 4, priceKsh: 8000, priceUSD: 60, description: "Per technician per day" },
        { id: genId(), name: "Safety Gear & PPE Provision", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, description: "Safety compliance kit" },
        { id: genId(), name: "Site Survey & Preliminary Assessment", category: "mobilization", quantity: 1, priceKsh: 10000, priceUSD: 80, description: "Initial site visit" },
        { id: genId(), name: "Transport - Pickup Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 100, priceUSD: 0.8, description: "Logistics cost per km" },
        { id: genId(), name: "Transport - 3 Ton Truck (Per Km)", category: "mobilization", quantity: 100, priceKsh: 150, priceUSD: 1.2, description: "Heavy load transport per km" },
        { id: genId(), name: "Generator Rental (Per Day)", category: "mobilization", quantity: 2, priceKsh: 8500, priceUSD: 65, description: "Backup power during installation" },
        { id: genId(), name: "Network Tool Kit Mobilization", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, description: "Specialized networking tools" },
        { id: genId(), name: "Fiber Splicing Kit Rental", category: "mobilization", quantity: 1, priceKsh: 5000, priceUSD: 40, description: "Fusion splicer daily rate" },
        { id: genId(), name: "Post-Installation Cleanup", category: "mobilization", quantity: 1, priceKsh: 3000, priceUSD: 25, description: "Site cleaning and waste disposal" },
      ],
      services: [
        { id: genId(), name: "Solar System Installation (Labor)", category: "services", quantity: 1, priceKsh: 25000, priceUSD: 195, description: "Professional installation labor charge" },
        { id: genId(), name: "Network Infrastructure Setup (Labor)", category: "services", quantity: 1, priceKsh: 35000, priceUSD: 270, description: "Cabling and configuration labor" },
        { id: genId(), name: "Solar Power Audit & Consulting", category: "services", quantity: 1, priceKsh: 15000, priceUSD: 115, description: "Energy needs assessment report" },
        { id: genId(), name: "Annual Maintenance Contract (Solar)", category: "services", quantity: 1, priceKsh: 50000, priceUSD: 385, description: "Preventive maintenance service per year" },
        { id: genId(), name: "Annual Maintenance Contract (IT/Network)", category: "services", quantity: 1, priceKsh: 120000, priceUSD: 920, description: "Comprehensive IT support per year" },
        { id: genId(), name: "Fiber Optic Splicing & Termination", category: "services", quantity: 24, priceKsh: 1500, priceUSD: 12, description: "Per core splicing charge" },
        { id: genId(), name: "CCTV Camera Installation & Config", category: "services", quantity: 8, priceKsh: 3500, priceUSD: 27, description: "Per camera installation" },
        { id: genId(), name: "Access Control System Setup", category: "services", quantity: 1, priceKsh: 18000, priceUSD: 140, description: "Biometric/Card reader config" },
        { id: genId(), name: "Structured Cabling (Per Point)", category: "services", quantity: 50, priceKsh: 2500, priceUSD: 20, description: "Cable pulling and termination" },
        { id: genId(), name: "Server Room Configuration", category: "services", quantity: 1, priceKsh: 45000, priceUSD: 350, description: "Rack mounting and cable management" },
        { id: genId(), name: "Wi-Fi Site Survey & Heatmapping", category: "services", quantity: 1, priceKsh: 20000, priceUSD: 155, description: "Coverage analysis report" },
        { id: genId(), name: "Remote System Monitoring (Monthly)", category: "services", quantity: 12, priceKsh: 5000, priceUSD: 40, description: "Victron VRM / Ubiquiti remote support" },
        { id: genId(), name: "IT Support Retainer (Standard)", category: "services", quantity: 12, priceKsh: 30000, priceUSD: 230, description: "Monthly support fee" },
        { id: genId(), name: "Emergency Troubleshooting Call-out", category: "services", quantity: 1, priceKsh: 10000, priceUSD: 80, description: "Urgent site visit fee" },
        { id: genId(), name: "Firmware Update & Optimization", category: "services", quantity: 1, priceKsh: 8000, priceUSD: 60, description: "System software upgrade" },
      ],
    };
    setStock(sample);
    showToast('success', 'Sample stock seeded');
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

          {/* ADMIN ONLY: Seed & Clear */}
          {user?.role === 'admin' && (
            <>
              <button title="Seed sample stock" onClick={seedSample} className="p-2.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm" aria-label="Seed sample">
                <FaPlus />
              </button>

              <button title="Clear All Data" onClick={handleClearAll} className="p-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all shadow-sm" aria-label="Clear all">
                <FaBroom />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Currency controls & totals */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-4">
        <div className="flex flex-wrap gap-3 items-center">
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

      {/* Add Item Form (Always Add) */}
      <div className="border rounded bg-white dark:bg-midnight-800 p-4 mb-6 shadow-sm dark:border-midnight-700">
        <h2 className="text-lg font-semibold mb-2">Add New Item • {activeCategory}</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end"
        >
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Name</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="border px-2 py-1 rounded w-full"
              placeholder="Item name"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Quantity</label>
            <input
              type="number"
              min={1}
              value={formQty}
              onChange={(e) => setFormQty(Number(e.target.value || 1))}
              className="border px-2 py-1 rounded w-full"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Price (Ksh)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formPriceKsh || ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormPriceKsh(val);
                setFormPriceUSD(val ? Number((val / currencyRate).toFixed(2)) : 0);
              }}
              className="border px-2 py-1 rounded w-full"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Price (USD)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formPriceUSD || ""}
              onChange={(e) => {
                const val = Number(e.target.value);
                setFormPriceUSD(val);
                setFormPriceKsh(val ? Number((val * currencyRate).toFixed(2)) : 0);
              }}
              className="border px-2 py-1 rounded w-full"
              placeholder="0"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              title="Add item"
              className="p-2 rounded bg-brand-600 hover:bg-brand-700 text-white transition-colors"
            >
              <FaPlus />
            </button>

            <button
              type="button"
              title="Clear form"
              onClick={() => { setFormName(""); setFormQty(1); setFormPriceKsh(0); setFormPriceUSD(0); setFormDescription(""); }}
              className="p-2 rounded bg-gray-200 text-gray-800"
            >
              <FaTrash />
            </button>
          </div>

          {/* Description toggle & textarea (full width) */}
          {showDescriptions && (
            <div className="md:col-span-6">
              <label className="block text-sm mb-1">Description (optional)</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="border px-2 py-1 rounded w-full"
              />
            </div>
          )}
        </form>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Edit Item</h3>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateSubmit(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Ksh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.priceKsh ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingItem({
                        ...editingItem,
                        priceKsh: val,
                        priceUSD: val ? Number((val / currencyRate).toFixed(2)) : 0
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.priceUSD ?? ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditingItem({
                        ...editingItem,
                        priceUSD: val,
                        priceKsh: val ? Number((val * currencyRate).toFixed(2)) : 0
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-lg font-medium shadow-md shadow-brand-500/20 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <FaSearch className="text-gray-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeCategory} by name...`} className="border px-2 py-1 rounded w-full" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-midnight-800 rounded shadow-sm border dark:border-midnight-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Unit Price (Ksh)</th>
              <th className="px-4 py-3 text-left">Total Value (Ksh)</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No entries in {activeCategory}.</td>
              </tr>
            ) : (
              filteredItems.map((it) => {
                const totalValue = (it.priceKsh || 0) * (it.quantity || 0);
                // Use a subtle distinct background if low stock
                const isLowStock = it.quantity < 5;
                return (
                  <tr key={it.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{it.id}</td>
                    <td className="px-4 py-3 text-gray-700">{it.name}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{it.category}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      <span className={`${isLowStock ? 'text-red-600 font-bold' : ''}`}>{it.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">Ksh {it.priceKsh.toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">Ksh {totalValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        <button title="Edit" onClick={() => handleEdit(it)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded-full hover:bg-brand-50 transition-colors">
                          <FaEdit size={14} />
                        </button>
                        <button title="Delete" onClick={() => handleDelete(it.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                          <FaTrash size={14} />
                        </button>
                        <button title={it.description || "No description"} className={`p-1.5 rounded-full transition-colors ${it.description ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' : 'text-gray-200 cursor-default'}`}>
                          <FaInfoCircle size={14} />
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