# KONSUT Ltd Invoice Management System

![Deploy to cPanel](https://github.com/wanjohialvins/Invoice-system/actions/workflows/deploy.yml/badge.svg)

A professional, feature-rich invoice management system built with React, TypeScript, and Vite. This comprehensive application provides tools for creating quotations, managing invoices, tracking inventory, maintaining client databases, and generating professional PDF documents.

![KONSUT Ltd](./public/konsut-banner.png)

## 🌟 Features

### Invoice & Quotation Management
- **Create Professional Invoices**: Generate detailed invoices with customer information, itemized products/services, and automatic calculations
- **Quotation System**: Create price quotes with validity periods and convert them to invoices
- **PDF Generation**: Export invoices and quotations as professionally formatted PDF documents with:
  - Bordered tables and sections
  - Company branding and logo
  - Itemized pricing with VAT calculations (16%)
  - Payment details and terms
  - Professional styling and layout
  - Customizable watermarks and barcodes
  - Configurable headers and footers
- **Auto-save Drafts**: Automatically save invoice drafts to prevent data loss
- **Invoice Status Tracking**: Monitor paid, pending, and overdue invoices

### Stock Management
- **Multi-Category Inventory**: Manage products, mobilization equipment, and services
- **Real-time Stock Tracking**: Monitor inventory levels and values
- **Pricing in Multiple Currencies**: Support for KSH and USD with automatic conversion
- **Weight-Based Freight Calculation**: Automatic freight cost calculation for products
- **CSV Import/Export**: Bulk import stock from CSV/Excel files and export inventory data
- **Merge-on-Add**: Intelligent duplicate detection when adding stock items
- **Seed Sample Data**: Quick-start with pre-populated sample inventory

### Client Management
- **Client Database**: Store and manage customer information with CRUD operations
- **Auto-generated Customer IDs**: Unique identification for each customer
- **Contact Information**: Track phone, email, address, company, and notes
- **Client Avatars**: Color-coded initials for visual identification
- **Purchase History**: View all invoices associated with each client
- **Client Statistics**: Track total spent, invoice count, and last purchase date
- **CSV Export**: Export client data with statistics.
- **Seed & Delete**: Populate test data or perform hard resets.
- **Multi-source Tracking**: Distinguish between manually added clients and invoice-generated entries

### Analytics & Reporting
- **Dashboard Overview**: Real-time metrics and KPIs including:
  - Total revenue with monthly trends and growth percentages
  - Invoice metrics and average invoice value
  - Stock valuation
  - Status breakdown (paid, pending, overdue)
  - Top customers by revenue
  - Recent invoices with quick actions
- **Advanced Analytics**: Comprehensive visual reports with:
  - Revenue trends over time (line charts)
  - Category-wise sales breakdown (bar charts)
  - Payment status distribution (pie charts)
  - Monthly comparisons
  - Top customers and products
  - Stock value analysis
- **Data Export**: Export analytics data to CSV

### Comprehensive Settings
- **Company Profile**:
  - Customize company name, address, phone, email, and PIN
  - Upload and manage company logo
- **Invoice Configuration**:
  - Number and date formatting options
  - Toggle freight, descriptions, customer details, and payment details
  - Default currency (KSH/USD) and conversion rates
  - Freight rate configuration
  - PDF customization (watermark, barcode, header/footer)
  - Page orientation, size, font family, and font size
  - Custom footer text
- **User Preferences**:
  - Theme support (Light/Dark/Auto)
  - Language selection
  - Auto-save drafts toggle
  - Notification preferences
- **System Settings**:
  - Data backup and restore
  - Reset to defaults
  - Clear all data

### Advanced Features
- **VAT Calculations**: Automatic 16% VAT calculation
- **Freight Management**: Product-based and manual freight charges
- **Currency Conversion**: Real-time USD to KSH conversion with configurable rates
- **Data Persistence**: All data saved locally in browser storage (localStorage)
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Professional UI**: Clean, modern interface with intuitive navigation
- **Search & Filter**: Quick search across invoices, clients, and stock
- **Comprehensive Comments**: Well-documented codebase for maintainability

## 📖 Documentation & Security

- **[USER_MANUAL.md](USER_MANUAL.md)**: Comprehensive guide for operators and developers.
- **[LICENSE](LICENSE)**: Proprietary license and copyright information.

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

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
   - Import from CSV/Excel for bulk additions
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
   - Prices sync between KSH and USD automatically
   - Save the item
3. **Import from CSV/Excel**:
   - Click "Import from CSV/Excel"
   - Select your file (CSV or Excel format)
   - Items are automatically parsed and added
4. **Edit or Delete Items**:
   - Use the action buttons in the stock table
   - Update quantities, prices, or descriptions as needed
5. **Export Data**:
   - Click "Export CSV" to download your inventory

### Managing Clients

1. **Navigate to "Clients"** from the sidebar
2. **Add New Client**:
   - Click "Add Client"
   - Fill in contact details (name, phone, email, address, company, notes)
   - Save the client
3. **View Client Statistics**:
   - See total spent, number of invoices, and last purchase date
   - Color-coded avatars for quick identification
4. **Export Client Data**:
   - Click "Export CSV" to download client database with statistics
5. **Seed or Delete**:
   - Use "Seed Clients" for test data
   - Use "Delete All" for hard reset

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
- **Recent Invoices**: Quick access to latest invoices with view and download actions

### Advanced Analytics

The Analytics page offers:
- **Revenue Trends**: Line charts showing revenue over time
- **Category Analysis**: Bar charts for sales by category
- **Payment Status**: Pie charts for invoice status distribution
- **Monthly Comparisons**: Track performance month-over-month
- **Top Performers**: Identify best customers and products
- **Stock Insights**: Analyze inventory value by category
- **Data Export**: Download analytics data as CSV

### Customizing Settings

1. **Navigate to Settings** from the sidebar
2. **Company Info**: Update name, address, phone, email, PIN, and logo
3. **Invoice Settings**: Configure default rates (Freight, Currency), toggle header/footer visibility, and manage PDF options (Watermark, Barcode)
4. **User Preferences**: Set theme, language, and notification preferences
5. **System**: Manage data persistence, backup, and reset options

Changes made in the Settings page are saved locally and will be reflected in all new invoices and PDF documents.

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
- **Utilities**: classnames 2.5.1, html2canvas 1.4.1

## 📁 Project Structure

```
konsut-invoice-sys/
├── public/                 # Static assets
│   └── src/
│       └── assets/
│           └── logo.jpg   # Company logo
├── src/
│   ├── assets/            # Images and static files
│   │   └── logo.jpg
│   ├── components/        # Reusable React components
│   │   ├── Layout.tsx     # Main layout wrapper
│   │   ├── Sidebar.tsx    # Navigation sidebar
│   │   └── Topbar.tsx     # Top navigation bar
│   ├── constants/         # App constants and configuration
│   │   └── index.ts       # Storage keys, company info, default rates
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx  # Main dashboard with KPIs
│   │   ├── NewInvoice.tsx # Invoice/quotation creator
│   │   ├── Invoices.tsx   # Invoice list and management
│   │   ├── Clients.tsx    # Client database management
│   │   ├── Stock.tsx      # Inventory management
│   │   ├── Settings.tsx   # Application settings
│   │   └── Analytics.tsx  # Advanced analytics and charts
│   ├── types/             # TypeScript type definitions
│   │   └── types.ts
│   ├── utils/             # Utility functions
│   │   ├── pdfGenerator.ts # PDF generation logic
│   │   └── config.ts      # Configuration utilities
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 💾 Data Storage

All data is stored locally in your browser's localStorage:
- **Invoices**: Saved quotations and invoices (`invoices`)
- **Stock**: Product, mobilization, and service inventory (`stockData`)
- **Clients**: Customer database (`konsut_clients`)
- **Drafts**: Auto-saved invoice drafts (`konsut_newinvoice_draft_vFinal`)
- **Settings**: Company info, invoice settings, user preferences, and rates
- **Last Saved Quote**: Reference to the most recently saved quotation

**Note**: Clearing browser data will remove all stored information. Use the backup feature in Settings or export data regularly for production use.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with host access
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

The project uses:
- **ESLint**: For code linting with React hooks and refresh plugins
- **TypeScript**: For type safety and better developer experience
- **Comprehensive Comments**: All files include detailed documentation explaining purpose, features, and implementation details

### Development Features

- **Hot Module Replacement**: Instant updates during development
- **Type Safety**: Full TypeScript support with strict type checking
- **Component-Based Architecture**: Modular, reusable components
- **Centralized Constants**: Shared configuration in `constants/index.ts`
- **Utility Functions**: Reusable helpers for common operations

## 🎨 Customization

### Company Information & Rates

You can easily configure company details, freight rates, and currency conversion rates directly from the **Settings** page in the application.

1. Navigate to Settings from the sidebar
2. Update company information, logo, and branding
3. Configure invoice defaults and PDF options
4. Set freight rates and currency conversion rates
5. Customize user preferences and system settings

All changes are saved to localStorage and applied immediately.

### Adding New Features

The codebase is well-structured for extensibility:
- Add new pages in `src/pages/`
- Create reusable components in `src/components/`
- Define types in `src/types/types.ts`
- Add utilities in `src/utils/`
- Update constants in `src/constants/index.ts`

## 📝 License

This project is proprietary software developed for KONSUT Ltd.

## 🤝 Support

For support, email info@konsutltd.co.ke or call +254 700 420 897.

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- PDF generation powered by jsPDF and jspdf-autotable
- UI components styled with Tailwind CSS
- Icons from React Icons and Lucide React
- Charts powered by Recharts
- Form components from React Datepicker and React Phone Input

---

**KONSUT Ltd** - Professional Invoice Management System  
*Ruiru, Kenya*

**Version**: 1.0.0  
**Last Updated**: December 2025
