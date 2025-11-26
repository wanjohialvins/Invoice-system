// src/pages/Settings.tsx
// Settings Page for KONSUT Ltd Invoice Management System

import React, { useEffect, useState } from "react";
import { FaSave, FaUndo, FaBuilding, FaFileInvoice, FaUser, FaBell, FaCog, FaInfoCircle } from "react-icons/fa";

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

type TabType = "company" | "invoice" | "preferences" | "notifications" | "system" | "about";

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("company");
  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>(DEFAULT_INVOICE_SETTINGS);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

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
    const updatedAppSettings = { ...appSettings, lastSaved: new Date().toISOString() };
    
    localStorage.setItem("company", JSON.stringify(company));
    localStorage.setItem("invoiceSettings", JSON.stringify(invoiceSettings));
    localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
    localStorage.setItem("notificationSettings", JSON.stringify(notificationSettings));
    localStorage.setItem("systemSettings", JSON.stringify(systemSettings));
    localStorage.setItem("appSettings", JSON.stringify(updatedAppSettings));
    
    setAppSettings(updatedAppSettings);
    setSaveMessage("Settings saved successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      setCompany(DEFAULT_COMPANY);
      setInvoiceSettings(DEFAULT_INVOICE_SETTINGS);
      setUserPreferences(DEFAULT_USER_PREFERENCES);
      setNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      setSystemSettings(DEFAULT_SYSTEM_SETTINGS);
      setSaveMessage("Settings reset to defaults. Click Save to apply.");
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  const tabs = [
    { id: "company" as TabType, label: "Company", icon: FaBuilding },
    { id: "invoice" as TabType, label: "Invoice", icon: FaFileInvoice },
    { id: "preferences" as TabType, label: "Preferences", icon: FaUser },
    { id: "notifications" as TabType, label: "Notifications", icon: FaBell },
    { id: "system" as TabType, label: "System", icon: FaCog },
    { id: "about" as TabType, label: "About", icon: FaInfoCircle },
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
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Save Message */}
        {saveMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {saveMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="text-lg" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Company Information Tab */}
            {activeTab === "company" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.name}
                      onChange={(e) => setCompany({ ...company, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PIN/Tax ID
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.pin}
                      onChange={(e) => setCompany({ ...company, pin: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.address1}
                      onChange={(e) => setCompany({ ...company, address1: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.address2}
                      onChange={(e) => setCompany({ ...company, address2: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.email}
                      onChange={(e) => setCompany({ ...company, email: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo Path
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={company.logoPath}
                      onChange={(e) => setCompany({ ...company, logoPath: e.target.value })}
                      placeholder="/src/assets/logo.jpg"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invoice Settings Tab */}
            {activeTab === "invoice" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Invoice Settings</h2>

                {/* Format Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Format Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number Format
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.numberFormat}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, numberFormat: e.target.value as "comma" | "decimal" | "compact" })}
                      >
                        <option value="comma">Comma (1,234.56)</option>
                        <option value="decimal">Decimal (1234.56)</option>
                        <option value="compact">Compact (1.2K)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.currency}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, currency: e.target.value as "Ksh" | "USD" })}
                      >
                        <option value="Ksh">Kenyan Shilling (Ksh)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.dateFormat}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, dateFormat: e.target.value as "DD/MM/YYYY" })}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PDF Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">PDF Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Page Size
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.pageSize}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, pageSize: e.target.value as "a4" | "letter" | "legal" })}
                      >
                        <option value="a4">A4</option>
                        <option value="letter">Letter</option>
                        <option value="legal">Legal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orientation
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.pageOrientation}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, pageOrientation: e.target.value as "portrait" | "landscape" })}
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Family
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.fontFamily}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, fontFamily: e.target.value as "Helvetica" | "Courier New" | "Times New Roman" })}
                      >
                        <option value="Helvetica">Helvetica</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Times New Roman">Times New Roman</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={invoiceSettings.fontSize}
                        onChange={(e) => setInvoiceSettings({ ...invoiceSettings, fontSize: Number(e.target.value) as 8 | 10 | 12 })}
                      >
                        <option value="8">8pt</option>
                        <option value="10">10pt</option>
                        <option value="12">12pt</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Include Options */}
                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Include in Invoice</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: "includeHeader", label: "Header" },
                      { key: "includeFooter", label: "Footer" },
                      { key: "includeWatermark", label: "Watermark" },
                      { key: "includeBarcode", label: "Barcode" },
                      { key: "includeFreight", label: "Freight Charges" },
                      { key: "includeDescriptions", label: "Item Descriptions" },
                      { key: "includeCustomerDetails", label: "Customer Details" },
                      { key: "includePaymentDetails", label: "Payment Details" },
                      { key: "includeCompanyDetails", label: "Company Details" },
                      { key: "includeTerms", label: "Terms & Conditions" },
                    ].map((option) => (
                      <label key={option.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={invoiceSettings[option.key as keyof InvoiceSettings] as boolean}
                          onChange={(e) => setInvoiceSettings({ ...invoiceSettings, [option.key]: e.target.checked })}
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={invoiceSettings.footerText}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, footerText: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* User Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">User Preferences</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={userPreferences.language}
                      onChange={(e) => setUserPreferences({ ...userPreferences, language: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="sw">Swahili</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={userPreferences.theme}
                      onChange={(e) => setUserPreferences({ ...userPreferences, theme: e.target.value as "light" | "dark" | "auto" })}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={userPreferences.autoSaveDrafts}
                      onChange={(e) => setUserPreferences({ ...userPreferences, autoSaveDrafts: e.target.checked })}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Auto-save Drafts</span>
                      <p className="text-xs text-gray-500">Automatically save invoice drafts as you work</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={userPreferences.notifications}
                      onChange={(e) => setUserPreferences({ ...userPreferences, notifications: e.target.checked })}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Enable Notifications</span>
                      <p className="text-xs text-gray-500">Receive notifications for important events</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
                <p className="text-sm text-gray-600">Choose how you want to receive notifications</p>

                <div className="space-y-4">
                  {[
                    { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
                    { key: "sms", label: "SMS Notifications", description: "Receive notifications via SMS" },
                    { key: "push", label: "Push Notifications", description: "Receive browser push notifications" },
                    { key: "inApp", label: "In-App Notifications", description: "Show notifications within the app" },
                  ].map((option) => (
                    <label key={option.key} className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={notificationSettings[option.key as keyof NotificationSettings]}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [option.key]: e.target.checked })}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                        <p className="text-xs text-gray-500">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">System Settings</h2>

                <div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Backup Configuration</h3>
                  
                  <div className="space-y-4 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={systemSettings.backupEnabled}
                        onChange={(e) => setSystemSettings({ ...systemSettings, backupEnabled: e.target.checked })}
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Enable Automatic Backups</span>
                        <p className="text-xs text-gray-500">Automatically backup your data at regular intervals</p>
                      </div>
                    </label>
                  </div>

                  {systemSettings.backupEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Backup Path
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={systemSettings.backupPath}
                          onChange={(e) => setSystemSettings({ ...systemSettings, backupPath: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auto-Backup Interval (minutes)
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={systemSettings.autoBackupInterval}
                          onChange={(e) => setSystemSettings({ ...systemSettings, autoBackupInterval: Number(e.target.value) })}
                          min="5"
                          max="1440"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Backups to Keep
                        </label>
                        <input
                          type="number"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={systemSettings.maxBackups}
                          onChange={(e) => setSystemSettings({ ...systemSettings, maxBackups: Number(e.target.value) })}
                          min="1"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Backup
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          value={systemSettings.lastBackupDate || "Never"}
                          readOnly
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">Data Management</h3>
                  <button
                    onClick={() => {
                      if (window.confirm("This will clear all invoices, clients, and stock data. Are you sure?")) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear All Data
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Warning: This action cannot be undone</p>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === "about" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">About</h2>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{appSettings.appName}</h3>
                  <p className="text-sm text-gray-600">Invoice Management System</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Version</p>
                    <p className="text-lg font-semibold text-gray-900">{appSettings.version}</p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Build Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(appSettings.buildDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Last Saved</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {appSettings.lastSaved ? new Date(appSettings.lastSaved).toLocaleString() : "Never"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <p className="text-lg font-semibold text-gray-900">{company.name}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Technology Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {["React", "TypeScript", "Vite", "Tailwind CSS", "jsPDF", "Recharts"].map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={saveSettings}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaSave /> Save All Settings
          </button>
          <button
            onClick={resetToDefaults}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center gap-2"
          >
            <FaUndo /> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
