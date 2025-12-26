// src/pages/Settings.tsx
// Settings Page for KONSUT Ltd Invoice Management System

import React, { useEffect, useState } from "react";
import {
  FaSave,
  FaSync,
  FaBuilding,
  FaFileInvoice,
  FaUserCog,
  FaBell,
  FaServer,
  FaInfoCircle,
  FaCheck,
  FaExclamationTriangle
} from "react-icons/fa";

// Types
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
  inApp: boolean;
  email: boolean;
  desktop: boolean;
  mobile: boolean;
  system: boolean;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
  desktop: boolean;
  mobile: boolean;
}

interface SystemSettings {
  backupEnabled: boolean;
  backupPath: string;
  autoBackupInterval: number; // minutes
  lastBackupDate: string;
  maxBackups: number;
}

interface AppSettings {
  appName: string;
  version: string;
  buildDate: string;
  lastSaved: string;
}

// Default values
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
  inApp: true,
  email: true,
  desktop: true,
  mobile: true,
  system: true,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: true,
  sms: true,
  push: true,
  inApp: true,
  desktop: true,
  mobile: true,
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

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    // Load saved settings from localStorage
    const savedCompany = localStorage.getItem("company");
    const savedInvoiceSettings = localStorage.getItem("invoiceSettings");
    const savedUserPreferences = localStorage.getItem("userPreferences");
    const savedNotifications = localStorage.getItem("notificationSettings");
    const savedSystem = localStorage.getItem("systemSettings");
    const savedApp = localStorage.getItem("appSettings");

    if (savedCompany) setCompany(JSON.parse(savedCompany));
    if (savedInvoiceSettings) setInvoiceSettings(JSON.parse(savedInvoiceSettings));
    if (savedUserPreferences) setUserPreferences(JSON.parse(savedUserPreferences));
    if (savedNotifications) setNotificationSettings(JSON.parse(savedNotifications));
    if (savedSystem) setSystemSettings(JSON.parse(savedSystem));
    if (savedApp) setAppSettings(JSON.parse(savedApp));

    setLoading(false);
  }, []);

  const saveSettings = () => {
    setSaveStatus("saving");
    try {
      localStorage.setItem("company", JSON.stringify(company));
      localStorage.setItem("invoiceSettings", JSON.stringify(invoiceSettings));
      localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
      localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
      localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
      localStorage.setItem("appSettings", JSON.stringify(appSettings));

      setTimeout(() => {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }, 500);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
    }
  };

  const tabs = [
    { id: "company", label: "Company Info", icon: FaBuilding },
    { id: "invoice", label: "Invoice Settings", icon: FaFileInvoice },
    { id: "user", label: "Preferences", icon: FaUserCog },
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "system", label: "System", icon: FaServer },
    { id: "about", label: "About", icon: FaInfoCircle },
  ];

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <div className="flex gap-3">
            <button
              onClick={saveSettings}
              disabled={saveStatus === "saving"}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${saveStatus === "saved"
                  ? "bg-green-600 text-white"
                  : saveStatus === "error"
                    ? "bg-red-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {saveStatus === "saving" ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <FaCheck /> Saved!
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <FaSync /> Reload
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                >
                  <tab.icon className="text-lg" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {activeTab === "company" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                    <input
                      type="text"
                      value={company.pin}
                      onChange={(e) => setCompany({ ...company, pin: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={company.address1}
                      onChange={(e) => setCompany({ ...company, address1: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                    <input
                      type="text"
                      value={company.address2}
                      onChange={(e) => setCompany({ ...company, address2: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo Path (URL or Local Path)</label>
                    <input
                      type="text"
                      value={company.logoPath}
                      onChange={(e) => setCompany({ ...company, logoPath: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter the path to your logo image.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "invoice" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Invoice Configuration</h2>

                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700">Display Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "includeHeader", label: "Include Header" },
                      { key: "includeFooter", label: "Include Footer" },
                      { key: "includeWatermark", label: "Include Watermark" },
                      { key: "includeBarcode", label: "Include Barcode" },
                      { key: "includeFreight", label: "Show Freight Column" },
                      { key: "includeDescriptions", label: "Show Item Descriptions" },
                      { key: "includePaymentDetails", label: "Show Payment Details" },
                      { key: "includeTerms", label: "Show Terms & Conditions" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invoiceSettings[item.key as keyof InvoiceSettings] as boolean}
                          onChange={(e) => setInvoiceSettings({ ...invoiceSettings, [item.key]: e.target.checked })}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-md font-medium text-gray-700">Footer Content</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                    <textarea
                      value={invoiceSettings.footerText}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "user" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">User Preferences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select
                      value={userPreferences.theme}
                      onChange={(e) => setUserPreferences({ ...userPreferences, theme: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">System Default</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={userPreferences.language}
                      onChange={(e) => setUserPreferences({ ...userPreferences, language: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userPreferences.autoSaveDrafts}
                        onChange={(e) => setUserPreferences({ ...userPreferences, autoSaveDrafts: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="block font-medium text-gray-700">Auto-save Drafts</span>
                        <span className="text-sm text-gray-500">Automatically save invoice drafts while typing</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
                    { key: "inApp", label: "In-App Notifications", desc: "Show notifications within the application" },
                    { key: "desktop", label: "Desktop Notifications", desc: "Show browser push notifications" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof NotificationSettings] as boolean}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="block font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm text-gray-500">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">System Settings</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <FaInfoCircle className="text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-medium text-blue-800">Data Storage</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      All data is currently stored in your browser's LocalStorage. Clearing your browser cache will remove all data.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700">Backup & Restore</h3>
                  <div className="flex gap-4">
                    <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors">
                      Download Backup
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Restore from File
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-md font-medium text-gray-700">Danger Zone</h3>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-red-800 mb-2">Reset Application</h4>
                    <p className="text-sm text-red-600 mb-4">
                      This will delete all invoices, customers, and settings. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete all data? This cannot be undone.")) {
                          localStorage.clear();
                          window.location.reload();
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "about" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">About</h2>
                <div className="text-center py-8">
                  <img src={company.logoPath} alt="Logo" className="h-24 mx-auto mb-4 object-contain" />
                  <h3 className="text-2xl font-bold text-gray-900">{appSettings.appName}</h3>
                  <p className="text-gray-500 mt-2">Version {appSettings.version}</p>
                  <p className="text-gray-400 text-sm mt-1">Built on {new Date(appSettings.buildDate).toLocaleDateString()}</p>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-800 mb-2">Credits</h4>
                  <p className="text-gray-600">
                    Developed for KONSUT Ltd.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
