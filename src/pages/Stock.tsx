 // src/pages/Stock.tsx
// Final integrated Stock manager for KONSUT Ltd
// - Auto freight calculation (weight * freightRate)
// - Currency sync Ksh <-> USD (currencyRate persisted)
// - Category toggles (products, mobilization, services)
// - Description show/hide toggle (controls UI + saved descriptions)
// - Merge-on-add (same name+category increments quantity instead of duplicate entry)
// - Export stock CSV
// - All data persisted in localStorage (only cleared by "Clear Data")
// - Icon-only buttons with title attributes for accessibility
// - Poppins friendly (use className="font-poppins" where appropriate)
// - Exports a helper `getTodayISO` which other components can import for "issued date"
// NOTE: This file is TypeScript + React (no external network calls)

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
} from "react-icons/fa";
import { FiBox, FiTruck, FiTool } from "react-icons/fi";
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
const getInitialStock = (): Record<Category, StockItem[]> => {
  const raw = localStorage.getItem(STORAGE_KEYS.STOCK);
  if (!raw) return { products: [], mobilization: [], services: [] };
  const parsed = safeParse(raw);
  if (!parsed) return { products: [], mobilization: [], services: [] };
  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
    mobilization: Array.isArray(parsed.mobilization) ? parsed.mobilization : [],
    services: Array.isArray(parsed.services) ? parsed.services : [],
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
     Main state
     --------------------- */
  const [stock, setStock] = useState<Record<Category, StockItem[]>>(getInitialStock);
  const [activeCategory, setActiveCategory] = useState<Category>("products");
  const [search, setSearch] = useState<string>("");

  /* freight & currency */
  const [freightRate, setFreightRate] = useState<number>(getInitialFreight);
  const [currencyRate, setCurrencyRate] = useState<number>(getInitialCurrencyRate);

  /* description toggle (control whether descriptions show/are editable) */
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);

  /* form state (add/edit) */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formQty, setFormQty] = useState<number>(1);
  const [formPriceKsh, setFormPriceKsh] = useState<number>(0);
  const [formPriceUSD, setFormPriceUSD] = useState<number>(0);
  const [formWeight, setFormWeight] = useState<number | undefined>(undefined);
  const [formDescription, setFormDescription] = useState<string>("");

  /* ---------------------
     Effects: persist to localStorage
     --------------------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FREIGHT_RATE, String(freightRate));
  }, [freightRate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENCY_RATE, String(currencyRate));
  }, [currencyRate]);

  /* Persist draft form so refresh doesn't lose partially typed data (not destructive) */
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

  /* Load draft on mount */
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
     Derived values & helpers
     --------------------- */

  // filtered list for active category + search
  const filteredItems = useMemo(() => {
    return stock[activeCategory].filter((it) =>
      it.name.toLowerCase().includes(search.trim().toLowerCase())
    );
  }, [stock, activeCategory, search]);

  // totals
  const totalStockValue = useMemo(() => {
    return (Object.values(stock) as StockItem[][])
      .flat()
      .reduce((s, it) => s + (it.priceKsh || 0) * (it.quantity || 0), 0);
  }, [stock]);

  const totalFreight = useMemo(() => {
    return (Object.values(stock) as StockItem[][])
      .flat()
      .reduce((s, it) => s + ((it.weight || 0) * freightRate * (it.quantity || 0)), 0);
  }, [stock, freightRate]);

  /* ---------------------
     Currency sync helpers
     - When user edits Ksh, USD is auto updated and vice versa.
     - currencyRate persisted in localStorage already.
     --------------------- */
  const onKshChangeInForm = (value: number) => {
    setFormPriceKsh(value);
    // keep 2 decimal places for USD
    setFormPriceUSD(Number((value / currencyRate).toFixed(2)));
  };

  const onUsdChangeInForm = (value: number) => {
    setFormPriceUSD(value);
    setFormPriceKsh(Math.round(value * currencyRate));
  };

  /* ---------------------
     Add or update item
     - Merge-on-add: if same name + category exists, increment quantity
     - weight optional; freight auto-calculated later from weight * freightRate * qty
     --------------------- */
  const handleAddOrUpdate = () => {
    if (!formName.trim()) return alert("Please enter a name.");
    if (formPriceKsh <= 0) return alert("Enter a valid unit price in Ksh.");
    if (formQty <= 0) return alert("Enter a valid quantity.");

    const cat = activeCategory;
    const existingIndex = stock[cat].findIndex(
      (it) => it.name.trim().toLowerCase() === formName.trim().toLowerCase()
    );

    if (editingId) {
      // update existing by id (editing)
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
      // merge on add: increment qty & update price if needed
      const updated = [...stock[cat]];
      const found = updated[existingIndex];
      const newQty = (found.quantity || 0) + formQty;
      updated[existingIndex] = {
        ...found,
        quantity: newQty,
        // decide: keep existing price or replace? We'll update to latest entered price
        priceKsh: formPriceKsh,
        priceUSD: formPriceUSD,
        weight: formWeight ?? found.weight,
        description: showDescriptions ? formDescription || found.description : undefined,
      };
      setStock({ ...stock, [cat]: updated });
    } else {
      // create new entry
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

    // reset form after add/update
    setFormName("");
    setFormQty(1);
    setFormPriceKsh(0);
    setFormPriceUSD(0);
    setFormWeight(undefined);
    setFormDescription("");
    setEditingId(null);
  };

  /* ---------------------
     Edit item: populate form with item values
     --------------------- */
  const handleEdit = (it: StockItem) => {
    setActiveCategory(it.category);
    setEditingId(it.id);
    setFormName(it.name);
    setFormQty(it.quantity || 1);
    setFormPriceKsh(it.priceKsh || 0);
    setFormPriceUSD(it.priceUSD ?? Number(((it.priceKsh || 0) / currencyRate).toFixed(2)));
    setFormWeight(it.weight);
    setFormDescription(it.description || "");
    // Ensure descriptions are visible if editing description
    if (it.description) setShowDescriptions(true);
  };

  /* ---------------------
     Delete item
     --------------------- */
  const handleDelete = (id: string) => {
    if (!confirm("Delete this item?")) return;
    const cat = activeCategory;
    setStock({ ...stock, [cat]: stock[cat].filter((i) => i.id !== id) });
  };

  /* ---------------------
     Clear all stock data (explicit user action)
     --------------------- */
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
     Export stock CSV (uses downloadCSV helper)
     --------------------- */
  const handleExportCSV = () => {
    downloadCSV(stock, `konsut_stock_${getTodayISO()}.csv`);
  };

  /* ---------------------
     Quick seed sample data (for dev/testing)
     --------------------- */
  const seedSample = () => {
    const sample: Record<Category, StockItem[]> = {
      products: [
        { id: "P1001", name: "Cement 50kg", category: "products", quantity: 120, priceKsh: 600, priceUSD: 600 / currencyRate, weight: 50, description: "OPC 42.5R" },
        { id: "P1002", name: "Rebar 12mm", category: "products", quantity: 200, priceKsh: 900, priceUSD: 900 / currencyRate, weight: 12, description: "TMT rebar" },
      ],
      mobilization: [
        { id: "M2001", name: "Truck Hire - day", category: "mobilization", quantity: 5, priceKsh: 12000, priceUSD: 12000 / currencyRate, description: "Medium truck" },
      ],
      services: [
        { id: "S3001", name: "Site Survey", category: "services", quantity: 10, priceKsh: 8000, priceUSD: 8000 / currencyRate, description: "Per day" },
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
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#007FFF" }}>Stock Management</h1>
          <p className="text-sm text-gray-600">Products · Mobilization · Services — auto freight & currency sync</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button title="Export CSV" onClick={handleExportCSV} className="p-2 rounded bg-gray-200 text-gray-800" aria-label="Export CSV">
            <FaFileCsv />
          </button>

          <button title="Seed sample stock" onClick={seedSample} className="p-2 rounded bg-gray-200 text-gray-800" aria-label="Seed sample">
            <FaPlus />
          </button>

          <button title="Clear All Data" onClick={handleClearAll} className="p-2 rounded bg-red-600 text-white" aria-label="Clear all">
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
          className={`p-3 rounded ${activeCategory === "products" ? "bg-[#007FFF] text-white" : "bg-gray-200 text-gray-800"}`}
          title="Products"
        >
          <FiBox />
        </button>
        <button
          onClick={() => setActiveCategory("mobilization")}
          className={`p-3 rounded ${activeCategory === "mobilization" ? "bg-[#007FFF] text-white" : "bg-gray-200 text-gray-800"}`}
          title="Mobilization"
        >
          <FiTruck />
        </button>
        <button
          onClick={() => setActiveCategory("services")}
          className={`p-3 rounded ${activeCategory === "services" ? "bg-[#007FFF] text-white" : "bg-gray-200 text-gray-800"}`}
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
            <button title={editingId ? "Update item" : "Add item"} onClick={handleAddOrUpdate} className="p-2 rounded bg-[#007FFF] text-white">
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
                        <button title="Edit" onClick={() => handleEdit(it)} className="p-1 text-blue-600">
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
          <button title="Download stock CSV" onClick={handleExportCSV} className="p-2 rounded bg-[#007FFF] text-white">
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