# 📖 KONSUT Ltd Invoice System - User Manual

Welcome to the official user manual for the **KONSUT Ltd Invoice Management System**. This guide provides comprehensive instructions on how to use the system effectively, from basic setup to advanced analytics.

---

## 📑 Table of Contents
1. [Introduction](#introduction)
2. [Quick Start Guide](#quick-start-guide)
3. [Invoice & Quotation Management](#invoice--quotation-management)
4. [Stock & Inventory Management](#stock--inventory-management)
5. [Client Relationship Management](#client-relationship-management)
6. [Analytics & Reporting](#analytics--reporting)
7. [System Settings & Customization](#system-settings--customization)
8. [Data Security & Backups](#data-security--backups)
9. [Troubleshooting](#troubleshooting)

---

## 🛡️ License Notice
This software is **Proprietary**. Unauthorized copying, distribution, or modifications are strictly prohibited under international copyright laws. Refer to the [LICENSE](LICENSE) file for full details.

---

## 1. Introduction
The KONSUT Ltd Invoice System is a professional-grade solution designed to streamline the billing and inventory needs of modern businesses. It features a sleek "Futuristic Dark" interface, real-time analytics, and automated document generation.

---

## 2. Quick Start Guide
1. **Launch**: Run `npm run dev` and navigate to `localhost:5173`.
2. **Configure**: Go to `Settings` to set your company name, logo, and PIN.
3. **Seed**: If you're new, use the `Seed Stock` button on the Stock page to see how the system works.
4. **Create**: Head to `New Invoice` to generate your first professional document.

---

## 3. Invoice & Quotation Management
### Creating an Invoice
- **Select Client**: Start by entering customer details.
- **Add Items**: Choose from your Stock categories (Products, Services, Mobilization).
- **Automated Math**: The system handles VAT (16%), Freight, and Currency conversion (USD/KSH) automatically.
- **Download**: Click the "Download PDF" button to get a ready-to-print professional document.

### Quotations vs. Invoices
The system allows you to save drafts as "Quotations" with validity dates, which can later be converted into finalized invoices.

---

## 4. Stock & Inventory Management
### Managing Categories
The system splits inventory into three distinct modules:
- **Products**: Physical items (includes weight-based freight calculation).
- **Services**: Intangible offerings (no weight calculation).
- **Mobilization**: Logistics and setup costs.

### Bulk Operations
Use the **Import from CSV/Excel** feature to add hundreds of items in seconds. The system intelligently detects duplicates during import to maintain data cleanlines.

---

## 5. Client Relationship Management
Stay organized with the built-in CRM:
- **Client Profiles**: Automatic ID generation and color-coded avatars.
- **Spending History**: Track which clients generate the most revenue.
- **Exporting**: Download your entire client database to CSV for marketing or external backup.

---

## 6. Analytics & Reporting
The system provides two levels of data visualization:
- **Dashboard**: High-level KPIs (Total Revenue, Monthly Trends, Recent Activity).
- **Advanced Analytics**: Detailed breakdowns using high-end charts (Revenue Trends, Category Distribution, Payment Status).

---

## 7. System Settings & Customization
Tailor the system to your specific needs:
- **PDF Styling**: Manage watermarks, barcodes, custom footers, and page orientation.
- **Regional Settings**: Configure VAT rates, currency conversion factors, and default units.
- **Branding**: Upload your company logo to be used globally across all generated documents.

---

## 8. Data Security & Backups
### Local Storage
All data is stored **securely in your browser's local storage**. This means no external server is required, but it also means clearing browser data will reset the system.

### Backup Strategy
1. **Manual Export**: Regularly export Stock and Client data to CSV.
2. **System Backup**: Use the "Backup Data" feature in Settings to generate a JSON snapshot of your entire system.

---

## 9. Troubleshooting
- **Images not showing**: Ensure your uploaded logo is under 2MB for optimal performance.
- **PDF layout issues**: Reset your "PDF Settings" to default in the Settings page.
- **Data missing**: Check if you are using a different browser or "Incognito Mode", as data is tied to the specific browser instance.

---

**KONSUT Ltd** - Professional Invoice Management System  
*Version 1.1.0 // Developed by Alvins Wanjohi*
