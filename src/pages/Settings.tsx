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

import React, { useEffect, useState } from "react";
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
  FaSync
} from "react-icons/fa";
import logo from "../assets/logo.jpg";

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
  includeFreight: boolean;
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
  name: "KONSUT Ltd",
  address1: "P.O BOX 21162-00100",
  address2: "G.P.O NAIROBI",
  phone: "+254 700 420 897",
  email: "info@konsutltd.co.ke",
  pin: "P052435869T",
  logoPath: "/src/assets/logo.jpg",
};

const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  numberFormat: "comma",
  dateFormat: "DD/MM/YYYY",
  includeFreight: true,
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
  footerText: "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya",
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

  // Render Helpers
  const renderInput = (label: string, value: string, onChange: (val: string) => void, type = "text", placeholder = "") => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none"
      />
    </div>
  );

  const renderSelect = (label: string, value: string, options: { value: string; label: string }[], onChange: (val: string) => void) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow outline-none bg-white"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
            <FaUserCog size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">System Settings</h1>
            <p className="text-sm text-gray-500">Manage application configurations</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <FaUndo size={14} /> Reset Defaults
          </button>
          <button
            onClick={saveSettings}
            disabled={saveStatus === 'saving'}
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
                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={activeTab === tab.id ? "text-brand-500" : "text-gray-400"} size={18} />
                    {tab.label}
                  </div>
                  {activeTab === tab.id && <FaChevronRight size={12} className="text-brand-400" />}
                </button>
              ))}
            </nav>

            {/* Quick Stats Widget */}
            <div className="mt-8 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">System Status</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium text-gray-900">{appSettings.version}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Setup</span>
                  <span className="font-medium text-gray-900 text-xs">
                    {new Date(appSettings.lastSaved).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[500px]">

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
                        placeholder="/src/assets/logo.jpg"
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
                      {renderToggle("Freight Col", "Show shipping/freight", invoiceSettings.includeFreight, v => setInvoiceSettings({ ...invoiceSettings, includeFreight: v }))}
                      {renderToggle("Payment Info", "Bank details block", invoiceSettings.includePaymentDetails, v => setInvoiceSettings({ ...invoiceSettings, includePaymentDetails: v }))}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">User Preferences</h3>
                    <div className="space-y-4">
                      {renderSelect("Theme Mode", userPreferences.theme, [
                        { value: "light", label: "Light Mode" },
                        { value: "dark", label: "Dark Mode" },
                        { value: "auto", label: "System Default" }
                      ], v => setUserPreferences({ ...userPreferences, theme: v as any }))}

                      {renderSelect("Language", userPreferences.language, [
                        { value: "en", label: "English" },
                        { value: "sw", label: "Swahili" }
                      ], v => setUserPreferences({ ...userPreferences, language: v }))}

                      <div className="pt-2">
                        {renderToggle("Auto-Save", "Save drafts automatically", userPreferences.autoSaveDrafts, v => setUserPreferences({ ...userPreferences, autoSaveDrafts: v }))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
                    <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                          <FaExclamationTriangle size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-red-800">Advanced Actions</h4>
                          <p className="text-sm text-red-600 mt-1 mb-4">
                            Resetting data is irreversible. Please proceed with caution.
                          </p>
                          <button
                            onClick={clearAllData}
                            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <FaTrash size={14} /> Clear All App Data
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Channels</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderToggle("Email Alerts", "Send copies via email", notificationSettings.email, v => setNotificationSettings({ ...notificationSettings, email: v }))}
                    {renderToggle("In-App Alerts", "Show toast messages", notificationSettings.inApp, v => setNotificationSettings({ ...notificationSettings, inApp: v }))}
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
        </div>
      </main>
    </div>
  );
};

export default Settings;
