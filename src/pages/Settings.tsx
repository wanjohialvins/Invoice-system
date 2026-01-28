// src/pages/Settings.tsx
/**
 * System Settings & Configuration
 * 
 * Central hub for managing application-wide preferences.
 * 
 * Key Features:
 * - Company Profile: Edit business details (address, PIN, logo) used in invoices.
 * - Invoice Configuration: Customize PDF output (currency, layout, columns).
 * - System Preferences: Theme, language, and auto-save toggles.
 * - Data Management: Options to reset defaults or clear all local data.
 * 
 * Technical Implementation:
 * - All settings are persisted to localStorage using specific keys.
 * - Changes are applied immediately to the global state (refresh may be required for some).
 * - "Save" simulates a network request for better UX feedback.
 */

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../contexts/AuthContext";
import {
  FaSave,
  FaUndo,
  FaBuilding,
  FaFileInvoice,
  FaUserCog,
  FaBell,
  FaServer,
  FaInfoCircle,
  FaCheck,
  FaExclamationTriangle,
  FaChevronRight,
  FaTrash,
  FaSync,
  FaDownload,
  FaUpload,
  FaDatabase,
  FaFolder,
  FaSeedling,
  FaEraser,
} from "react-icons/fa";
import logo from "../assets/logo.jpg";
import {
  exportBackup,
  importBackup,
  clearAllData as clearBackupData,
  getBackupInfo,
  updateLastBackupDate,
  getBrowserStorageInfo
} from "../utils/backupManager";
import { seedWorkload, clearSeedData } from "../utils/devSeeder";

// --- Types & Interfaces ---

interface CompanyInfo {
  name: string;
  address1: string;
  address2: string;
  phone: string;
  email: string;
  pin: string;
  logoPath: string;
}

interface InvoiceSettings {
  numberFormat: "comma" | "decimal" | "compact";
  dateFormat: "DD/MM/YYYY";
  includeDescriptions: boolean;
  includeCustomerDetails: boolean;
  includePaymentDetails: boolean;
  includeCompanyDetails: boolean;
  includeTerms: boolean;
  includeWatermark: boolean;
  includeBarcode: boolean;
  includeHeader: boolean;
  includeFooter: boolean;
  defaultStatus: "Pending";
  currency: "Ksh" | "USD";
  pageOrientation: "portrait" | "landscape";
  pageSize: "a4" | "letter" | "legal";
  fontSize: 8 | 10 | 12;
  fontFamily: "Helvetica" | "Courier New" | "Times New Roman";
  footerText: string;
}

interface UserPreferences {
  language: string;
  theme: "light" | "dark" | "auto";
  autoSaveDrafts: boolean;
  notifications: boolean;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

interface SystemSettings {
  backupEnabled: boolean;
  backupPath: string;
  autoBackupInterval: number;
  lastBackupDate: string;
  maxBackups: number;
}

interface AppSettings {
  appName: string;
  version: string;
  buildDate: string;
  lastSaved: string;
}

// --- Default Values ---

const DEFAULT_COMPANY: CompanyInfo = {
  name: "KONSUT LTD",
  address1: "P.O BOX 21162-00100",
  address2: "G.P.O NAIROBI",
  phone: "+254 700 420 897",
  email: "info@konsut.co.ke",
  pin: "P052435869T",
  logoPath: logo,
};

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  numberFormat: "comma",
  dateFormat: "DD/MM/YYYY",
  includeDescriptions: true,
  includeCustomerDetails: true,
  includePaymentDetails: true,
  includeCompanyDetails: true,
  includeTerms: true,
  includeWatermark: true,
  includeBarcode: true,
  includeHeader: true,
  includeFooter: true,
  defaultStatus: "Pending",
  currency: "Ksh",
  pageOrientation: "portrait",
  pageSize: "a4",
  fontSize: 10,
  fontFamily: "Helvetica",
  footerText: "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsut.co.ke | Ruiru, Kenya",
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: "en",
  theme: "light",
  autoSaveDrafts: true,
  notifications: true,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: true,
  sms: true,
  push: true,
  inApp: true,
};

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  backupEnabled: true,
  backupPath: "/konsut_invoices",
  autoBackupInterval: 30,
  lastBackupDate: "",
  maxBackups: 10,
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  appName: "KONSUT Invoice System",
  version: "1.0.0",
  buildDate: new Date().toISOString(),
  lastSaved: new Date().toISOString(),
};

// --- Components ---

const Settings: React.FC = () => {
  const { user } = useAuth();
  // State
  const [activeTab, setActiveTab] = useState("company");
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  // Backup state
  const [backupInfo, setBackupInfo] = useState(getBackupInfo());
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme Hook for Instant Switching
  const { applyTheme: instantSetTheme } = useTheme();

  const handleThemeChange = (newTheme: "light" | "dark" | "auto") => {
    // 1. Update local state for the UI
    setUserPreferences(prev => ({ ...prev, theme: newTheme }));

    // 2. Trigger "Iron Man" transition immediately
    instantSetTheme(newTheme);
  };

  // Load Data
  useEffect(() => {
    try {
      const load = (key: string, setter: any) => {
        const stored = localStorage.getItem(key);
        if (stored) setter(JSON.parse(stored));
      };

      load("company", setCompany);
      load("invoiceSettings", setInvoiceSettings);
      load("userPreferences", setUserPreferences);
      load("notificationSettings", setNotificationSettings);
      load("systemSettings", setSystemSettings);
      load("appSettings", setAppSettings);
    } catch (e) {
      console.error("Error loading settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fix legacy default logo path
  useEffect(() => {
    if (company.logoPath === "/src/assets/logo.jpg") {
      setCompany(prev => ({ ...prev, logoPath: logo }));
    }
  }, [company.logoPath]);

  // Apply Theme Helper
  const applyThemeChange = (themeMode: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;

    if (themeMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  // Actions
  const saveSettings = () => {
    setSaveStatus("saving");
    try {
      const now = new Date().toISOString();
      const updatedApp = { ...appSettings, lastSaved: now };
      setAppSettings(updatedApp);

      localStorage.setItem("company", JSON.stringify(company));
      localStorage.setItem("invoiceSettings", JSON.stringify(invoiceSettings));
      localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
      localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
      localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
      localStorage.setItem("appSettings", JSON.stringify(updatedApp));

      // Apply theme immediately
      applyThemeChange(userPreferences.theme);

      // Simulate network delay for better UX feel
      setTimeout(() => {
        setSaveStatus("saved");
        setSaveMessage("All settings saved successfully.");
        setTimeout(() => {
          setSaveStatus("idle");
          setSaveMessage("");
        }, 3000);
      }, 600);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
      setSaveMessage("Failed to save settings.");
    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset ALL settings? This cannot be undone.")) {
      setCompany(DEFAULT_COMPANY);
      setInvoiceSettings(DEFAULT_INVOICE_SETTINGS);
      setUserPreferences(DEFAULT_USER_PREFERENCES);
      setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
      setAppSettings(DEFAULT_APP_SETTINGS);

      setSaveStatus("saved");
      setSaveMessage("Settings restored to defaults.");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);
    }
  };

  const clearAllData = () => {
    const confirmText = "DANGER ZONE: This will permanently delete ALL invoices, clients, and stored data. Are you absolutely sure?";
    if (window.confirm(confirmText)) {
      // Double confirmation
      if (window.confirm("Really delete everything?")) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  // Backup and Restore Functions
  const handleBackup = () => {
    try {
      exportBackup();
      updateLastBackupDate();
      setBackupInfo(getBackupInfo());
      setSaveStatus("saved");
      setSaveMessage("Backup created successfully!");
      setTimeout(() => {
        setSaveStatus("idle");
        setSaveMessage("");
      }, 3000);
    } catch (error) {
      console.error("Backup failed:", error);
      setSaveStatus("error");
      setSaveMessage("Failed to create backup");
    }
  };

  const handleRestore = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mode = window.confirm(
      "Choose restore mode:\n\nOK = Replace all existing data\nCancel = Merge with existing data"
    ) ? "replace" : "merge";

    setRestoring(true);
    try {
      const backup = await importBackup(file, mode);
      setSaveStatus("saved");
      setSaveMessage(`Backup restored successfully! (${backup.metadata.invoiceCount} invoices, ${backup.metadata.clientCount} clients)`);

      // Reload after 2 seconds to reflect changes
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Restore failed:", error);
      setSaveStatus("error");
      setSaveMessage(error.message || "Failed to restore backup");
      setRestoring(false);
    }
  };

  // --- Migration Logic ---
  const handleMigrateIDs = () => {
    if (!confirm("This will rewrite all IDs for Clients, Stock, and Invoices to a shorter, standardized format. This action cannot be undone. Proceed?")) return;

    try {
      setSaveStatus("saving");
      setSaveMessage("Migrating data...");

      // 1. Load Data
      const clientsRaw = localStorage.getItem("konsut_clients");
      const stockRaw = localStorage.getItem("stockData"); // Assuming simple stock structure or mapped
      const invoicesRaw = localStorage.getItem("invoices");

      const clients: any[] = clientsRaw ? JSON.parse(clientsRaw) : [];
      const invoices: any[] = invoicesRaw ? JSON.parse(invoicesRaw) : [];
      // Stock is usually {products: [], services: []}
      const stockData: any = stockRaw ? JSON.parse(stockRaw) : { products: [], mobilization: [], services: [] };

      // Maps to track old -> new IDs
      const clientMap = new Map<string, string>();
      const stockMap = new Map<string, string>();

      // 2. Migrate Clients
      // Format: C + 4 random digits (e.g. C1234)
      const newClients = clients.map((c: any) => {
        // If already short, keep it? Or force regen? let's force regen for consistency if it's long
        // Check if ID is already short format (e.g. C1234)
        const isShort = /^C\d{4}$/.test(c.id);
        if (isShort) {
          clientMap.set(c.id, c.id);
          return c;
        }

        let newId = "C" + Math.floor(1000 + Math.random() * 9000);
        // Collision check
        while (Array.from(clientMap.values()).includes(newId)) {
          newId = "C" + Math.floor(1000 + Math.random() * 9000);
        }
        clientMap.set(c.id, newId);
        return { ...c, id: newId };
      });

      // 3. Migrate Stock
      // Format: P + 4 digits (e.g. P5678)
      // Iterate through categories
      const categories = ["products", "mobilization", "services"];
      const newStockData = { ...stockData };

      categories.forEach(cat => {
        if (newStockData[cat] && Array.isArray(newStockData[cat])) {
          newStockData[cat] = newStockData[cat].map((item: any) => {
            const isShort = /^P\d{4}$/.test(item.id);
            if (isShort) {
              stockMap.set(item.id, item.id);
              return item;
            }
            let newId = "P" + Math.floor(1000 + Math.random() * 9000);
            // Simple collision check within category (global uniqueness preferred but category-scoped is okay if handled)
            // Let's assume global stock ID uniqueness
            while (Array.from(stockMap.values()).includes(newId)) {
              newId = "P" + Math.floor(1000 + Math.random() * 9000);
            }
            stockMap.set(item.id, newId);
            return { ...item, id: newId };
          });
        }
      });


      // 4. Migrate Invoices
      // User requested Invoice IDs should remain UNTOUCHED.
      // We only update references to Clients and Stock items.
      const newInvoices = invoices.map((inv: any) => {
        // Update Customer Reference in Invoice
        let newCustomerId = inv.customerId;
        if (newCustomerId && clientMap.has(newCustomerId)) {
          newCustomerId = clientMap.get(newCustomerId);
        }

        // Also update snapshot ID if present
        let newCustomerSnapshot = inv.customer;
        if (inv.customer && inv.customer.id && clientMap.has(inv.customer.id)) {
          newCustomerSnapshot = { ...inv.customer, id: clientMap.get(inv.customer.id) };
        }

        // Update Line Items (Product Refs)
        let newLineItems = inv.items || []; // items or lineItems? Dashboard uses 'items', code uses 'lineItems' often. Let's check.
        // The InvoiceData interface in Invoices.tsx uses `items` for line items? 
        // Wait, Invoices.tsx interface says `items?: InvoiceLine[]`. 
        // But NewInvoice.tsx often uses `lineItems`. Let's handle both just in case or check usage.
        // Dashboard.tsx line 58 says `items?: InvoiceLine[]`.
        // Let's stick to updating both keys if they exist to be safe.

        const updateItem = (item: any) => {
          if (item.productId && stockMap.has(item.productId)) {
            return { ...item, productId: stockMap.get(item.productId) };
          }
          if (item.id && stockMap.has(item.id)) {
            // Sometimes item.id IS the product id in line items? Rare but possible.
            // Usually item.id is line item unique id.
            // Let's trust productId.
          }
          return item;
        };

        if (Array.isArray(inv.items)) {
          newLineItems = inv.items.map(updateItem);
        } else if (Array.isArray(inv.lineItems)) {
          // Handle alternative key
          newLineItems = inv.lineItems.map(updateItem);
          // Re-assign to correct key? If `items` is primary, invalidating `lineItems` might be good or keeping sync.
          // Best to just update what is there.
          inv.lineItems = newLineItems;
        }

        return {
          ...inv,
          customerId: newCustomerId,
          customer: newCustomerSnapshot,
          items: Array.isArray(inv.items) ? newLineItems : inv.items,
          // If lineItems exists, we updated it in place above or need to return it.
          // Let's be rigorous.
        };
      });


      // 5. Save Back
      localStorage.setItem("konsut_clients", JSON.stringify(newClients));
      localStorage.setItem("stockData", JSON.stringify(newStockData));
      localStorage.setItem("invoices", JSON.stringify(newInvoices));

      // 6. Update App State if necessary (reload is easiest)
      setSaveStatus("saved");
      setSaveMessage("Migration Complete! Reloading...");

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("Migration failed:", error);
      setSaveStatus("error");
      setSaveMessage("Migration failed. Check console.");
    }
  };

  const handleClearAllData = () => {
    if (window.confirm("⚠️ WARNING: This will delete ALL data (invoices, clients, stock, settings). Create a backup first!\n\nAre you sure?")) {
      if (window.confirm("Last chance! This action cannot be undone. Proceed?")) {
        clearBackupData();
        setSaveStatus("saved");
        setSaveMessage("All data cleared");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  };

  // --- Duplicate Cleanup ---
  const handleCleanupDuplicates = () => {
    if (!confirm("This will remove duplicate invoices based on ID and Content, keeping only the LATEST version of each. Proceed?")) return;

    try {
      setSaveStatus("saving");
      setSaveMessage("Scanning for duplicates...");

      const raw = localStorage.getItem("invoices");
      if (!raw) {
        setSaveStatus("idle");
        setSaveMessage("No invoices found.");
        return;
      }

      const invoices: any[] = JSON.parse(raw);
      // Invoices are typically stored newest-first.
      // We iterate and keep the first occurrence (latest) of an ID or content signature.

      const seenIds = new Set<string>();
      const seenSignatures = new Set<string>();
      const validInvoices: any[] = [];
      let removedCount = 0;

      for (const inv of invoices) {
        // 1. Strict ID Check (Prevent multiple rows with same Invoice ID)
        if (inv.id && seenIds.has(inv.id)) {
          removedCount++;
          continue;
        }

        // 2. Content Signature Check (Prevent multiple saved copies with different IDs but same content)
        // Signature: Customer + Date + Total + Items(ID+Qty+Price)
        const itemsSig = (inv.items || []).map((i: any) => `${i.id}-${i.quantity}-${i.unitPrice}`).join('|');
        const signature = `${inv.customer?.name}|${inv.grandTotal}|${inv.issuedDate}|${itemsSig}`;

        if (seenSignatures.has(signature)) {
          removedCount++;
          continue;
        }

        // Mark as seen and keep
        if (inv.id) seenIds.add(inv.id);
        seenSignatures.add(signature);
        validInvoices.push(inv);
      }

      if (removedCount === 0) {
        setSaveStatus("saved");
        setSaveMessage("No duplicates found.");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return;
      }

      localStorage.setItem("invoices", JSON.stringify(validInvoices));

      setSaveStatus("saved");
      setSaveMessage(`Cleanup Complete! Removed ${removedCount} duplicate(s). Reloading...`);

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (e) {
      console.error("Cleanup failed", e);
      setSaveStatus("error");
      setSaveMessage("Cleanup failed.");
    }
  };

  // Render Helpers
  const renderInput = (label: string, value: string, onChange: (val: string) => void, type = "text", placeholder = "") => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-midnight-text-secondary mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 dark:border-midnight-700 rounded-lg bg-white dark:bg-midnight-950 text-gray-900 dark:text-midnight-text-primary focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
      />
    </div>
  );

  const renderSelect = (label: string, value: string, options: { value: string; label: string }[], onChange: (val: string) => void) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-midnight-text-secondary mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-midnight-700 rounded-lg appearance-none bg-white dark:bg-midnight-950 text-gray-900 dark:text-midnight-text-primary focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700 dark:text-midnight-text-secondary">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
      </div>
    </div>
  );

  const renderToggle = (label: string, description: string, checked: boolean, onChange: (val: boolean) => void) => (
    <label className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
      <div className="relative inline-flex items-center cursor-pointer mt-1">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
      </div>
      <div>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="block text-xs text-gray-500">{description}</span>
      </div>
    </label>
  );

  const tabs = [
    { id: "company", label: "Company", icon: FaBuilding },
    { id: "invoice", label: "Invoicing", icon: FaFileInvoice },
    { id: "system", label: "System", icon: FaServer }, // Merged some for simplicity
    { id: "about", label: "About", icon: FaInfoCircle },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center text-gray-500">Loading Configuration...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-midnight-900 border-b border-gray-200 dark:border-midnight-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-lg">
            <FaUserCog size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-midnight-text-primary">System Settings</h1>
            <p className="text-sm text-gray-500 dark:text-midnight-text-secondary">Manage application configurations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            title="Reset all settings to default"
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FaUndo size={14} /> Reset Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
            title="Save all changes"
            className={`px-6 py-2 bg-[#0099ff] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${saveStatus === 'saving' ? 'opacity-75 cursor-wait' : ''}`}
          >
            {saveStatus === 'saving' ? <FaSync className="animate-spin" /> : <FaSave />}
            {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {/* Feedback Toast */}
        {saveMessage && (
          <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg text-white font-medium flex items-center gap-3 animate-slide-up z-50 ${saveStatus === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
            {saveStatus === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
            {saveMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-midnight-800 text-blue-700 dark:text-brand-400 shadow-sm ring-1 ring-blue-200 dark:ring-midnight-700'
                    : 'text-gray-600 dark:text-midnight-text-secondary hover:bg-white dark:hover:bg-midnight-800 hover:text-gray-900 dark:hover:text-midnight-text-primary'
                    }`}
                  title={tab.label}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={activeTab === tab.id ? "text-brand-500" : "text-gray-400 dark:text-gray-600"} size={18} />
                    {tab.label}
                  </div>
                  {activeTab === tab.id && <FaChevronRight size={12} className="text-brand-400" />}
                </button>
              ))}
            </nav>

            {/* Quick Stats Widget */}
            <div className="mt-8 bg-white dark:bg-midnight-900 p-4 rounded-xl border border-gray-100 dark:border-midnight-700 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">System Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-midnight-text-secondary">Version</span>
                  <span className="font-medium text-gray-900 dark:text-midnight-text-primary">{appSettings.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-midnight-text-secondary">Last Setup</span>
                  <span className="font-medium text-gray-900 dark:text-midnight-text-primary text-xs">
                    {new Date(appSettings.lastSaved).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 bg-white dark:bg-midnight-900 rounded-2xl shadow-sm border border-gray-200 dark:border-midnight-700 min-h-[500px] transition-colors duration-300">

            {/* Company Settings */}
            {activeTab === 'company' && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8 border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Company Profile</h2>
                  <p className="text-gray-500 mt-1">Manage your business identity and contact details</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderInput("Company Name", company.name, v => setCompany({ ...company, name: v }))}
                  {renderInput("Tax PIN / VAT ID", company.pin, v => setCompany({ ...company, pin: v }))}
                  {renderInput("Phone Number", company.phone, v => setCompany({ ...company, phone: v }), "tel")}
                  {renderInput("Email Address", company.email, v => setCompany({ ...company, email: v }), "email")}

                  <div className="md:col-span-2">
                    {renderInput("Address Line 1", company.address1, v => setCompany({ ...company, address1: v }))}
                  </div>
                  <div className="md:col-span-2">
                    {renderInput("Address Line 2", company.address2, v => setCompany({ ...company, address2: v }))}
                  </div>

                  <div className="md:col-span-2 mt-4 p-6 border-2 border-dashed border-gray-300 hover:border-[#0099ff] rounded-xl bg-gray-50 flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setCompany({ ...company, logoPath: ev.target.result as string });
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <div className="mb-4 h-24 w-auto flex items-center justify-center bg-white p-2 rounded shadow-sm">
                      <img src={company.logoPath} alt="Logo Preview" className="max-h-full max-w-full object-contain" onError={(e) => (e.currentTarget.src = logo)} />
                    </div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">Company Logo</label>
                    <p className="text-xs text-gray-500 mb-3">Drag and drop an image file here, or paste the URL below.</p>
                    <div className="flex gap-2 w-full max-w-md">
                      <input
                        type="text"
                        value={company.logoPath}
                        onChange={(e) => setCompany({ ...company, logoPath: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:border-[#0099ff] outline-none"
                        placeholder="Image URL"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Enter the asset path or URL. Recommended size: 200x120px</p>
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Settings */}
            {activeTab === 'invoice' && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8 border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Invoicing Configuration</h2>
                  <p className="text-gray-500 mt-1">Customize how your documents look and behave</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Format & Style</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderSelect("Currency", invoiceSettings.currency, [
                        { value: "Ksh", label: "Kenyan Shilling (Ksh)" },
                        { value: "USD", label: "US Dollar ($)" }
                      ], v => setInvoiceSettings({ ...invoiceSettings, currency: v as any }))}

                      {renderSelect("Number Format", invoiceSettings.numberFormat, [
                        { value: "comma", label: "1,234.56" },
                        { value: "decimal", label: "1234.56" },
                        { value: "compact", label: "1.2k" }
                      ], v => setInvoiceSettings({ ...invoiceSettings, numberFormat: v as any }))}

                      {renderSelect("Page Size", invoiceSettings.pageSize, [
                        { value: "a4", label: "A4" },
                        { value: "letter", label: "Letter" }
                      ], v => setInvoiceSettings({ ...invoiceSettings, pageSize: v as any }))}

                      {renderSelect("Font Family", invoiceSettings.fontFamily, [
                        { value: "Helvetica", label: "Helvetica (Clean)" },
                        { value: "Times New Roman", label: "Times New Roman (Serif)" },
                        { value: "Courier New", label: "Courier (Monospace)" }
                      ], v => setInvoiceSettings({ ...invoiceSettings, fontFamily: v as any }))}
                    </div>

                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default Footer Text</label>
                      <textarea
                        value={invoiceSettings.footerText}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm text-gray-600"
                        placeholder="e.g. Thank you for your business..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Visibility</h3>
                    <div className="space-y-3">
                      {renderToggle("Show Header", "Include company header", invoiceSettings.includeHeader, v => setInvoiceSettings({ ...invoiceSettings, includeHeader: v }))}
                      {renderToggle("Show Footer", "Include footer text", invoiceSettings.includeFooter, v => setInvoiceSettings({ ...invoiceSettings, includeFooter: v }))}
                      {renderToggle("Watermark", "Background branding", invoiceSettings.includeWatermark, v => setInvoiceSettings({ ...invoiceSettings, includeWatermark: v }))}
                      {renderToggle("Barcode", "Include ID barcode", invoiceSettings.includeBarcode, v => setInvoiceSettings({ ...invoiceSettings, includeBarcode: v }))}
                      {renderToggle("Payment Info", "Bank details block", invoiceSettings.includePaymentDetails, v => setInvoiceSettings({ ...invoiceSettings, includePaymentDetails: v }))}
                      {renderToggle("Company Info", "Your company details", invoiceSettings.includeCompanyDetails, v => setInvoiceSettings({ ...invoiceSettings, includeCompanyDetails: v }))}
                      {renderToggle("Customer Info", "Bill-to details block", invoiceSettings.includeCustomerDetails, v => setInvoiceSettings({ ...invoiceSettings, includeCustomerDetails: v }))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System & Preferences Settings */}
            {activeTab === 'system' && (
              <div className="p-8 animate-fade-in">
                <div className="mb-8 border-b border-gray-100 pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">System & Preferences</h2>
                  <p className="text-gray-500 mt-1">Application behavior, backups, and data management</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* LEFT COLUMN: Preferences & Config */}
                  <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">User Preferences</h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          {renderSelect("Theme Mode", userPreferences.theme, [
                            { value: "light", label: "Light Mode" },
                            { value: "dark", label: "Dark Mode" },
                            { value: "auto", label: "System Default" }
                          ], v => handleThemeChange(v as any))}

                          {renderSelect("Language", userPreferences.language, [
                            { value: "en", label: "English" },
                            { value: "sw", label: "Swahili" }
                          ], v => setUserPreferences({ ...userPreferences, language: v }))}
                        </div>

                        <div className="pt-2">
                          {renderToggle("Auto-Save Drafts", "Save work automatically", userPreferences.autoSaveDrafts, v => setUserPreferences({ ...userPreferences, autoSaveDrafts: v }))}
                        </div>
                      </div>
                    </div>

                    {/* Notification Settings */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">Notification Channels</h3>
                      <div className="space-y-2">
                        {renderToggle("Email Alerts", "Send copies via email", notificationSettings.email, v => setNotificationSettings({ ...notificationSettings, email: v }))}
                        {renderToggle("In-App Alerts", "Show toast messages", notificationSettings.inApp, v => setNotificationSettings({ ...notificationSettings, inApp: v }))}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN (Wide): Data Management */}
                  <div className="xl:col-span-2 space-y-6">

                    {/* Backup & Restore Dashboard */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <FaDatabase size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-blue-900">Data Management</h3>
                            <p className="text-sm text-blue-600">Backup, restore, and monitoring</p>
                          </div>
                        </div>
                        <div className="text-right hidden md:block">
                          <span className="text-xs text-blue-500 uppercase font-semibold">Last Backup</span>
                          <div className="text-blue-900 font-medium text-sm">
                            {backupInfo.lastBackup ? new Date(backupInfo.lastBackup).toLocaleString() : "Never"}
                          </div>
                        </div>
                      </div>

                      {/* Hidden file input for restore */}
                      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                          <div className="text-xs text-blue-500 uppercase">Invoices</div>
                          <div className="text-xl font-bold text-blue-900">{backupInfo.invoiceCount}</div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                          <div className="text-xs text-blue-500 uppercase">Clients</div>
                          <div className="text-xl font-bold text-blue-900">{backupInfo.clientCount}</div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                          <div className="text-xs text-blue-500 uppercase">Stock Items</div>
                          <div className="text-xl font-bold text-blue-900">{backupInfo.stockItemCount}</div>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-blue-100">
                          <div className="text-xs text-blue-500 uppercase">Data Size</div>
                          <div className="text-xl font-bold text-blue-900">{backupInfo.totalSize}</div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleBackup}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          <FaDownload size={14} /> Backup Data
                        </button>
                        <button
                          onClick={handleRestore}
                          disabled={restoring}
                          className="flex-1 py-3 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                          {restoring ? <FaSync className="animate-spin" /> : <FaUpload size={14} />}
                          {restoring ? "Restoring..." : "Restore Data"}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Browser Storage */}
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <FaFolder className="text-gray-400" />
                          <h4 className="font-semibold text-gray-700 text-sm">Local Storage Path</h4>
                        </div>
                        <code className="block text-xs bg-white p-2 rounded border border-gray-200 text-gray-600 font-mono break-all mb-2">
                          {getBrowserStorageInfo().path}
                        </code>
                        <p className="text-xs text-gray-500">Data is stored locally in your browser.</p>
                      </div>

                      {/* Danger Zone */}
                      <div className="bg-red-50 p-5 rounded-xl border border-red-100 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-3 mb-3">
                          <FaExclamationTriangle className="text-red-500" />
                          <h4 className="font-semibold text-red-800 text-sm">Danger Zone</h4>
                        </div>
                        <button
                          onClick={handleCleanupDuplicates}
                          className="w-full py-2 bg-white border border-orange-200 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 mb-3"
                        >
                          <FaEraser size={12} /> Cleanup Duplicates
                        </button>
                        <button
                          onClick={handleClearAllData}
                          className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                        >
                          <FaTrash size={12} /> Clear All App Data
                        </button>
                      </div>
                    </div>


                    {/* System Updates & Versioning */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-6">
                      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                        <h3 className="text-lg font-semibold text-gray-800">System Updates</h3>
                        <span className="px-2 py-1 bg-brand-100 text-brand-700 rounded text-xs font-bold">Current: v{appSettings.version}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Release Notes</label>
                          <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm text-gray-600 h-24 resize-none"
                            placeholder="Describe the changes in this version..."
                          />
                          <p className="text-xs text-gray-400 mt-2">Enter detailed notes before saving a new version.</p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">Bump Version Number:</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!confirm("Release Major Update (X.0.0)?")) return;
                                const [major] = appSettings.version.split('.').map(Number);
                                const newVer = `${major + 1}.0.0`;
                                setAppSettings(prev => {
                                  const updated = { ...prev, version: newVer, lastSaved: new Date().toISOString() };
                                  // Immediate Save
                                  localStorage.setItem("appSettings", JSON.stringify(updated));
                                  return updated;
                                });
                                setSaveMessage(`Version updated to ${newVer}`);
                                setTimeout(saveSettings, 500); // Trigger full save
                              }}
                              className="flex-1 py-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                              Major
                            </button>
                            <button
                              onClick={() => {
                                if (!confirm("Release Minor Update (0.X.0)?")) return;
                                const [major, minor] = appSettings.version.split('.').map(Number);
                                const newVer = `${major}.${minor + 1}.0`;
                                setAppSettings(prev => {
                                  const updated = { ...prev, version: newVer, lastSaved: new Date().toISOString() };
                                  localStorage.setItem("appSettings", JSON.stringify(updated));
                                  return updated;
                                });
                                setSaveMessage(`Version updated to ${newVer}`);
                                setTimeout(saveSettings, 500);
                              }}
                              className="flex-1 py-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                              Minor
                            </button>
                            <button
                              onClick={() => {
                                const [major, minor, patch] = appSettings.version.split('.').map(Number);
                                const newVer = `${major}.${minor}.${patch + 1}`;
                                setAppSettings(prev => {
                                  const updated = { ...prev, version: newVer, lastSaved: new Date().toISOString() };
                                  localStorage.setItem("appSettings", JSON.stringify(updated));
                                  return updated;
                                });
                                setSaveMessage(`Version updated to ${newVer}`);
                                setTimeout(saveSettings, 500);
                              }}
                              className="flex-1 py-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 rounded-lg text-xs font-bold uppercase transition-colors"
                            >
                              Patch
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            <strong>Major</strong>: Structural changes.<br />
                            <strong>Minor</strong>: New features.<br />
                            <strong>Patch</strong>: Bug fixes.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Developer Zone - ADMIN ONLY */}
                    {user?.role === 'admin' && (
                      <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 border-dashed mt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <FaUserCog className="text-gray-400" />
                          <h4 className="font-semibold text-gray-600 text-sm">Developer Tools</h4>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => {
                              if (confirm("Generate random data?")) {
                                seedWorkload();
                                window.location.reload();
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50"
                          >
                            Seed Initial Workload
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Remove test data?")) {
                                clearSeedData();
                                window.location.reload();
                              }
                            }}
                            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50"
                          >
                            Remove Seed Data
                          </button>

                          <button
                            onClick={handleMigrateIDs}
                            className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-50"
                            title="Updates all existing IDs (Clients, Stock, Invoices) to the new short format (e.g. P1234, C5678)."
                          >
                            Migrate Data IDs
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="p-8 animate-fade-in flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="bg-gradient-to-br from-brand-50 to-indigo-50 p-10 rounded-2xl border border-brand-100 mb-8 w-full max-w-lg">
                  <img src={logo} alt="KONSUT Ltd" className="h-32 mx-auto mb-6 object-contain drop-shadow-sm" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{appSettings.appName}</h2>
                  <p className="text-brand-600 font-medium tracking-wide">Enterprise Edition</p>
                  <div className="mt-6 flex justify-center gap-4 text-sm text-gray-500">
                    <span>Version {appSettings.version}</span>
                    <span>•</span>
                    <span>Build {new Date(appSettings.buildDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="max-w-2xl text-center space-y-2">
                  <p className="text-gray-600">
                    Designed and developed for <strong>{company.name}</strong> to streamline invoicing and client management operations.
                  </p>
                  <p className="text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} KONSUT Ltd. All rights reserved.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div >
      </main >
    </div >
  );
};

export default Settings;
