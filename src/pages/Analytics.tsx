// src/pages/Analytics.tsx
// Comprehensive Analytics Dashboard for KONSUT Ltd

import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  FaChartLine, FaChartBar, FaChartPie, FaDollarSign, FaFileInvoice,
  FaUsers, FaTruck, FaCalendarAlt, FaDownload, FaSync, FaTrash
} from "react-icons/fa";
import logo from "../assets/logo.jpg";


// Types
interface InvoiceItem {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  freight?: number;
}

interface Customer {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  dueDate?: string;
  customer?: Customer;
  clientName?: string;
  items?: InvoiceItem[];
  subtotal?: number;
  grandTotal?: number;
  total?: number;
  status: "Paid" | "Pending" | "Overdue";
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  priceKsh: number;
  priceUSD?: number;
  weight?: number;
}

// Constants
const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  indigo: "#6366f1",
};

const Analytics: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [currency, setCurrency] = useState<"Ksh" | "USD">("Ksh");
  const [dateRange, setDateRange] = useState<"7days" | "30days" | "90days" | "1year">("30days");
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);

        const invoicesData = localStorage.getItem("invoices");
        if (invoicesData) {
          const parsed = JSON.parse(invoicesData);
          setInvoices(Array.isArray(parsed) ? parsed : []);
        }

        const stockData = localStorage.getItem("stockData");
        if (stockData) {
          const parsed = JSON.parse(stockData);
          const stockArray = parsed.products
            ? [...parsed.products, ...(parsed.mobilization || []), ...(parsed.services || [])]
            : [];
          setStock(stockArray);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter invoices by date range
  const filteredInvoices = useMemo(() => {
    if (!invoices.length) return [];

    const now = new Date();
    const filterDate = new Date();
    switch (dateRange) {
      case "7days": filterDate.setDate(now.getDate() - 7); break;
      case "30days": filterDate.setDate(now.getDate() - 30); break;
      case "90days": filterDate.setDate(now.getDate() - 90); break;
      case "1year": filterDate.setFullYear(now.getFullYear() - 1); break;
    }

    return invoices.filter(inv => {
      const invDate = new Date(inv.issuedDate || inv.date || "");
      return invDate >= filterDate;
    });
  }, [invoices, dateRange]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const paidInvoices = filteredInvoices.filter(inv => inv.status === "Paid");
    const pendingInvoices = filteredInvoices.filter(inv => inv.status === "Pending");
    const overdueInvoices = filteredInvoices.filter(inv => inv.status === "Overdue");

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    const averageInvoiceValue = filteredInvoices.length ? totalRevenue / filteredInvoices.length : 0;

    const customerTotals: Record<string, { name: string; total: number; count: number }> = {};
    filteredInvoices.forEach(inv => {
      const name = inv.customer?.name || inv.clientName || "Unknown";
      if (!customerTotals[name]) customerTotals[name] = { name, total: 0, count: 0 };
      customerTotals[name].total += inv.grandTotal || inv.total || 0;
      customerTotals[name].count += 1;
    });
    const topCustomers = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const categoryTotals: Record<string, { name: string; total: number; count: number }> = {};
    filteredInvoices.forEach(inv => {
      inv.items?.forEach(item => {
        const cat = item.category;
        if (!categoryTotals[cat]) categoryTotals[cat] = { name: cat, total: 0, count: 0 };
        categoryTotals[cat].total += item.totalPrice || 0;
        categoryTotals[cat].count += 1;
      });
    });
    const categoryPerformance = Object.values(categoryTotals);

    const stockValue = stock.reduce((sum, item) => sum + item.priceKsh * item.quantity, 0);

    const monthlyRevenue: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const date = new Date(inv.issuedDate || inv.date || "");
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (inv.grandTotal || inv.total || 0);
    });
    const monthlyTrend = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue })).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalInvoices: filteredInvoices.length,
      totalRevenue,
      paidRevenue: paidInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0),
      averageInvoiceValue,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      topCustomers,
      categoryPerformance,
      stockValue,
      monthlyTrend
    };
  }, [filteredInvoices, stock]);

  // Chart data
  const revenueTrendData = metrics.monthlyTrend.map(item => ({
    month: item.month,
    revenue: currency === "USD" ? +(item.revenue / 130).toFixed(2) : item.revenue
  }));

  const statusDistribution = [
    { name: "Paid", value: metrics.paidCount, color: COLORS.success },
    { name: "Pending", value: metrics.pendingCount, color: COLORS.warning },
    { name: "Overdue", value: metrics.overdueCount, color: COLORS.danger }
  ];

  const categoryData = metrics.categoryPerformance.map(cat => ({
    name: cat.name.charAt(0).toUpperCase() + cat.name.slice(1),
    value: currency === "USD" ? +(cat.total / 130).toFixed(2) : cat.total,
    count: cat.count
  }));

  const customerData = metrics.topCustomers.map(c => ({
    name: c.name,
    revenue: currency === "USD" ? +(c.total / 130).toFixed(2) : c.total,
    count: c.count
  }));

  // CSV export
  const exportData = () => {
    const rows = [
      ["Invoice ID", "Customer", "Date", "Status", "Total (Ksh)", "Total (USD)"],
      ...filteredInvoices.map(inv => [
        inv.id,
        inv.customer?.name || inv.clientName || "N/A",
        inv.issuedDate || inv.date || "N/A",
        inv.status,
        inv.grandTotal || inv.total || 0,
        ((inv.grandTotal || inv.total || 0) / 130).toFixed(2)
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `konsut_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-4">
            <img src={logo} alt="KONSUT LTD" className="h-16 w-auto object-contain" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600">KONSUT LTD - Business Insights</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button onClick={exportData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <FaDownload /> Export CSV
            </button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2">
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-2"><FaCalendarAlt className="text-gray-500" /><span className="font-medium">Date Range:</span></div>
          <div className="flex gap-2">
            {["7days", "30days", "90days", "1year"].map(dr => (
              <button
                key={dr}
                onClick={() => setDateRange(dr as any)}
                className={`px-3 py-1 rounded ${dateRange === dr ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}`}
              >
                {dr === "7days" ? "7 Days" : dr === "30days" ? "30 Days" : dr === "90days" ? "90 Days" : "1 Year"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="font-medium">Currency:</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="border px-3 py-1 rounded">
              <option value="Ksh">Ksh</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{currency === "USD" ? "$" : "Ksh"} {metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{metrics.paidRevenue > 0 && <span className="text-green-600">Paid: {currency === "USD" ? "$" : "Ksh"} {metrics.paidRevenue.toLocaleString()}</span>}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full"><FaDollarSign className="text-blue-600 text-xl" /></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalInvoices}</p>
              <p className="text-xs text-gray-500 mt-1">{metrics.paidCount} paid, {metrics.pendingCount} pending</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full"><FaFileInvoice className="text-indigo-600 text-xl" /></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Invoice</p>
              <p className="text-2xl font-bold text-gray-900">{currency === "USD" ? "$" : "Ksh"} {Math.round(metrics.averageInvoiceValue).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Per invoice</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full"><FaChartLine className="text-green-600 text-xl" /></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-gray-900">Ksh {metrics.stockValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Current inventory</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full"><FaTruck className="text-purple-600 text-xl" /></div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><FaChartLine className="text-blue-600" />Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${currency === "USD" ? "$" : "Ksh"} ${value}`]} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><FaChartPie className="text-blue-600" />Invoice Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}>
                  {statusDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value} invoices`]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
