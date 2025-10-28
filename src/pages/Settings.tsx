// src/pages/Settings.tsx
// Settings Page for KONSUT Ltd Invoice Management System

import React, { useEffect, useState } from "react";
import { FaSave, FaSync } from "react-icons/fa";

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
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);

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
    localStorage.setItem("company", JSON.stringify(company));
    localStorage.setItem("invoiceSettings", JSON.stringify(invoiceSettings));
    localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
    localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
    localStorage.setItem("appSettings", JSON.stringify(appSettings));
    alert("Settings saved!");
  };

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
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{company.name} - Settings</h1>

        {/* PDF Settings */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">PDF Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={invoiceSettings.includeWatermark}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, includeWatermark: e.target.checked })}
              />
              Include Watermark
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={invoiceSettings.includeBarcode}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, includeBarcode: e.target.checked })}
              />
              Include Barcode
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={invoiceSettings.includeHeader}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, includeHeader: e.target.checked })}
              />
              Include Header
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={invoiceSettings.includeFooter}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, includeFooter: e.target.checked })}
              />
              Include Footer
            </label>
            <div className="col-span-1 md:col-span-2">
              <label className="block mb-1">Footer Text:</label>
              <input
                type="text"
                className="border px-3 py-1 rounded w-full"
                value={invoiceSettings.footerText}
                onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={saveSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <FaSave /> Save Settings
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg flex items-center gap-2"
          >
            <FaSync /> Reload
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
