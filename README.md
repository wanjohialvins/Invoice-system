# KONSUT Ltd Invoice Management System

<<<<<<< HEAD
A professional, feature-rich invoice management system built with React, TypeScript, and Vite. This system provides comprehensive tools for creating quotations, managing invoices, tracking stock, and generating professional PDF documents.

![KONSUT Ltd](./public/konsut-banner.png)

## 🌟 Features

### Invoice & Quotation Management
- **Create Professional Invoices**: Generate detailed invoices with customer information, itemized products/services, and automatic calculations
- **Quotation System**: Create price quotes with validity periods and convert them to invoices
- **PDF Generation**: Export invoices and quotations as professionally formatted PDF documents with:
  - Bordered tables and sections
  - Company branding and logo
  - Itemized pricing with VAT calculations
  - Payment details and terms
  - Professional styling and layout

### Stock Management
- **Multi-Category Inventory**: Manage products, mobilization equipment, and services
- **Real-time Stock Tracking**: Monitor inventory levels and values
- **Pricing in Multiple Currencies**: Support for KSH and USD with automatic conversion
- **Weight-Based Freight Calculation**: Automatic freight cost calculation for products

### Customer Management
- **Customer Database**: Store and manage customer information
- **Auto-generated Customer IDs**: Unique identification for each customer
- **Contact Information**: Track phone, email, and address details
- **Purchase History**: View all invoices associated with each customer

### Analytics & Reporting
- **Dashboard Overview**: Real-time metrics and KPIs
- **Revenue Tracking**: Monitor total revenue, monthly trends, and growth
- **Invoice Status**: Track paid, pending, and overdue invoices
- **Top Customers**: Identify your best customers by revenue
- **Stock Valuation**: Real-time inventory value calculations

### Advanced Features
- **VAT Calculations**: Automatic 16% VAT calculation
- **Freight Management**: Product-based and manual freight charges
- **Currency Conversion**: Real-time USD to KSH conversion
- **Data Persistence**: All data saved locally in browser storage
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Professional UI**: Clean, modern interface with intuitive navigation

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18.0 or higher)
- **npm** (version 9.0 or higher) or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/konsut-invoice-sys.git
   cd konsut-invoice-sys
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

=======
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

>>>>>>> d34a91824de4269ec5876732b78732f152cb0e1c
3. **Start the development server**
   ```bash
   npm run dev
   ```
<<<<<<< HEAD

4. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Building for Production

To create a production-ready build:

```bash
npm run build
```

The optimized files will be generated in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## 📖 Usage Guide

### Creating Your First Invoice

1. **Navigate to "New Invoice"** from the sidebar
2. **Add Stock Items** (if not already added):
   - Click "Seed Stock" to add sample items, or
   - Go to "Stock" page to manually add products, mobilization, or services
3. **Fill in Customer Details**:
   - Customer name, phone, email, and address
   - Set the "Valid Till" date for quotations
4. **Add Items to Invoice**:
   - Select category (Products, Mobilization, or Services)
   - Choose items from the dropdown
   - Set quantity and add to invoice
5. **Review Totals**:
   - Subtotal, VAT (16%), and Grand Total are calculated automatically
   - Freight charges are added for products based on weight
6. **Generate PDF** or **Save Quotation**:
   - Click "Download PDF" to generate a professional invoice document
   - Click "Save Quotation" to store it in the system

### Managing Stock

1. **Go to Stock Page** from the sidebar
2. **Add New Items**:
   - Click "Add New Item"
   - Fill in item details (name, category, price, weight, etc.)
   - Save the item
3. **Edit or Delete Items**:
   - Use the action buttons in the stock table
   - Update quantities, prices, or descriptions as needed

### Viewing Invoices

1. **Navigate to "Invoices"** from the sidebar
2. **Search and Filter**:
   - Use the search bar to find specific invoices or customers
   - View invoice status (Paid, Pending, Overdue)
3. **Manage Invoices**:
   - Generate PDF for any invoice
   - Update invoice status
   - Delete invoices if needed

### Dashboard Analytics

The dashboard provides:
- **Total Revenue**: All-time and monthly revenue with growth percentage
- **Invoice Metrics**: Total invoices, average invoice value
- **Stock Value**: Current inventory valuation
- **Status Breakdown**: Count of paid, pending, and overdue invoices
- **Top Customers**: Your best customers by revenue
- **Recent Invoices**: Quick access to latest invoices

## 🛠️ Technology Stack

- **Frontend Framework**: React 19.1.1
- **Language**: TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Styling**: Tailwind CSS 3.4.13
- **PDF Generation**: jsPDF 2.5.2 + jspdf-autotable 5.0.2
- **Routing**: React Router DOM 7.9.4
- **Icons**: React Icons 5.5.0, Lucide React 0.546.0
- **Charts**: Recharts 3.2.1
- **Form Components**: React Datepicker 8.7.0, React Phone Input 2.15.1

## 📁 Project Structure

```
konsut-invoice-sys/
├── public/                 # Static assets
│   └── src/
│       └── assets/
│           └── logo.jpg   # Company logo
├── src/
│   ├── assets/            # Images and static files
│   ├── components/        # Reusable React components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── constants/         # App constants and configuration
│   │   └── index.ts
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── NewInvoice.tsx
│   │   ├── Invoices.tsx
│   │   ├── Clients.tsx
│   │   ├── Stock.tsx
│   │   ├── Settings.tsx
│   │   └── Analytics.tsx
│   ├── types/             # TypeScript type definitions
│   │   └── types.ts
│   ├── utils/             # Utility functions
│   │   └── pdfGenerator.ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 Customization

### Company Information & Rates

You can easily configure company details, freight rates, and currency conversion rates directly from the **Settings** page in the application.

1. **Navigate to Settings** from the sidebar.
2. **Company Info**: Update name, address, phone, email, PIN, and logo.
3. **Invoice Settings**: Configure default rates (Freight, Currency), toggle header/footer visibility, and manage PDF options (Watermark, Barcode).
4. **System**: Manage data persistence and reset options.

Changes made in the Settings page are saved locally and will be reflected in all new invoices and PDF documents.

## 💾 Data Storage

All data is stored locally in your browser's localStorage:
- **Invoices**: Saved quotations and invoices
- **Stock**: Product, mobilization, and service inventory
- **Drafts**: Auto-saved invoice drafts
- **Settings**: User preferences and rates

**Note**: Clearing browser data will remove all stored information. Consider implementing a backup solution for production use.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

The project uses:
- **ESLint**: For code linting
- **TypeScript**: For type safety
- **Prettier**: For code formatting (configure as needed)

## 📝 License

This project is proprietary software developed for KONSUT Ltd.

## 🤝 Support

For support, email info@konsutltd.co.ke or call +254 700 420 897.

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- PDF generation powered by jsPDF
- UI components styled with Tailwind CSS
- Icons from React Icons and Lucide React

---

**KONSUT Ltd** - Professional Invoice Management System
*Ruiru, Kenya*
=======

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
>>>>>>> d34a91824de4269ec5876732b78732f152cb0e1c
