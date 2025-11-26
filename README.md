# KONSUT Ltd Invoice Management System

A modern, full-featured invoice management application built with React, TypeScript, and Vite. This system allows businesses to manage clients, inventory, and generate professional PDF invoices with ease.

![Dashboard Screenshot](https://via.placeholder.com/800x450?text=Invoice+System+Dashboard)

## 🚀 Features

- **Dashboard**: Real-time overview of revenue, invoice status, and recent activities.
- **Invoice Management**: Create, edit, and manage invoices with a user-friendly interface.
- **PDF Generation**: Generate professional PDF invoices with customizable settings (watermarks, barcodes, headers/footers).
- **Client Management**: Maintain a database of clients with their contact details.
- **Inventory/Stock**: Track products and services, including pricing and stock levels.
- **Analytics**: Visual reports on revenue trends and business performance.
- **Comprehensive Settings**:
  - **Company Info**: Customize company details and logo.
  - **Invoice Configuration**: Adjust formats, currencies (Ksh/USD), and layout.
  - **User Preferences**: Theme support (Light/Dark) and notification settings.
  - **System Settings**: Data backup and management.
- **Data Persistence**: All data is securely stored locally in the browser (LocalStorage).

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: React Icons (Lucide, FontAwesome)
- **Charts**: Recharts
- **PDF Generation**: jsPDF, jspdf-autotable
- **Routing**: React Router DOM

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Invoice-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 📖 Usage Guide

### Creating an Invoice
1. Navigate to "New Invoice".
2. Select a client or add a new one.
3. Add items from your stock or create custom entries.
4. Adjust quantities and prices.
5. Click "Save Invoice" or "Download PDF".

### Managing Settings
Go to the **Settings** page to configure:
- **Company Profile**: Update your business address and logo.
- **Invoice Defaults**: Set your preferred currency, tax rates, and terms.
- **System**: Backup your data or reset the application.

## 💾 Data Management

This application uses **LocalStorage** for data persistence. This means:
- Your data stays on your device.
- Clearing browser cache will remove your data (use the Backup feature in Settings!).
- No external database connection is required.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
