// src/pages/Dashboard.tsx
/**
 * Dashboard Component - The "Command Center"
 * 
 * Features:
 * - "Jarvis-like" interactive UI with glassmorphism and tilt effects.
 * - Real-time Revenue Chart using Recharts.
 * - Live Activity Feed simulating system events.
 * - Smart Alerts for business intelligence.
 * - Renamed "Invoice" to "Order" terminology.
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  FaFileInvoice,
  FaPlus,
  FaChartLine,
  FaUsers,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaBell,
  FaBolt,
  FaBoxOpen
} from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// --- Interfaces ---
interface InvoiceLine {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
}

interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  dueDate?: string;
  customer?: {
    name?: string;
  };
  clientName?: string;
  items?: InvoiceLine[];
  grandTotal?: number;
  total?: number;
  status: "Paid" | "Pending" | "Overdue" | "draft" | "sent" | "cancelled" | "paid" | "pending" | "overdue";
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  priceKsh: number;
}

const Dashboard: React.FC = () => {
  // --- State Management ---
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stock, setStock] = useState<Record<string, StockItem[]>>({ products: [], mobilization: [], services: [] });
  const [loading, setLoading] = useState(true);

  // --- Data Loading ---
  useEffect(() => {
    try {
      const storedInvoices = localStorage.getItem("invoices");
      if (storedInvoices) setInvoices(JSON.parse(storedInvoices));

      const storedStock = localStorage.getItem("stockData");
      if (storedStock) setStock(JSON.parse(storedStock));
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Metrics & Intelligence ---
  const { metrics, chartData, recentActivity, smartAlerts } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Financial Metrics
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === "Paid" || inv.status === "paid");
    const pendingInvoices = invoices.filter(inv => ["Pending", "sent", "draft"].includes(inv.status));
    const overdueInvoices = invoices.filter(inv => inv.status === "Overdue");

    const averageOrderValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

    // Stock Value
    const stockValue = Object.values(stock).flat().reduce((sum, item) => sum + (item.priceKsh * item.quantity), 0);
    const lowStockItems = Object.values(stock).flat().filter(item => item.quantity < 5);

    // 2. Chart Data (Last 6 Months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        month: d.getMonth(),
        year: d.getFullYear(),
        revenue: 0
      };
    });

    invoices.forEach(inv => {
      const d = new Date(inv.issuedDate || inv.date || "");
      const monthData = last6Months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (monthData) {
        monthData.revenue += (inv.grandTotal || inv.total || 0);
      }
    });

    // 3. Recent Activity (Simulated from Invoices)
    const activity = invoices
      .sort((a, b) => new Date(b.issuedDate || "").getTime() - new Date(a.issuedDate || "").getTime())
      .slice(0, 5)
      .map(inv => ({
        id: inv.id,
        type: 'order',
        message: `Order ${inv.id} created for ${inv.customer?.name || "Client"}`,
        time: inv.issuedDate || "Just now",
        amount: inv.grandTotal || 0
      }));

    // 4. Smart Alerts
    const alerts = [];
    if (overdueInvoices.length > 0) alerts.push({ type: 'danger', message: `${overdueInvoices.length} orders are overdue` });
    if (lowStockItems.length > 0) alerts.push({ type: 'warning', message: `${lowStockItems.length} items are running low on stock` });
    if (pendingInvoices.length > 5) alerts.push({ type: 'info', message: `${pendingInvoices.length} orders pending processing` });

    return {
      metrics: { totalRevenue, totalInvoices: invoices.length, averageOrderValue, stockValue, paidCount: paidInvoices.length },
      chartData: last6Months,
      recentActivity: activity,
      smartAlerts: alerts
    };
  }, [invoices, stock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-brand-600 font-medium animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-slide-up delay-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Operational • {new Date().toLocaleDateString()}
            </p>
          </div>
          <Link
            to="/new-invoice"
            className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl shadow-lg shadow-brand-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 font-medium btn-liquid overflow-hidden group"
          >
            <FaPlus className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="relative z-10">New Order</span>
          </Link>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up delay-200">
          {[
            { label: "Total Revenue", value: `Ksh ${metrics.totalRevenue.toLocaleString()}`, icon: FaMoneyBillWave, color: "text-brand-600", bg: "bg-brand-50" },
            { label: "Total Orders", value: metrics.totalInvoices, icon: FaFileInvoice, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Avg. Order Value", value: `Ksh ${Math.round(metrics.averageOrderValue).toLocaleString()}`, icon: FaChartLine, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Stock Value", value: `Ksh ${metrics.stockValue.toLocaleString()}`, icon: FaUsers, color: "text-purple-600", bg: "bg-purple-50" }
          ].map((card, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 jarvis-card relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/20 to-transparent -mr-10 -mt-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Revenue Chart */}
          <div className="lg:col-span-2 space-y-8 animate-slide-up delay-300">

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 jarvis-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FaChartLine className="text-brand-500" /> Revenue Trends
                </h2>
                <select className="text-sm bg-slate-50 border-none rounded-lg text-slate-600 focus:ring-0 cursor-pointer hover:bg-slate-100 transition-colors px-3 py-1">
                  <option>Last 6 Months</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `Ksh${value / 1000}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      formatter={(value: number) => [`Ksh ${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 jarvis-card">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FaBolt className="text-amber-500" /> Live System Activity
              </h2>
              <div className="space-y-6">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors ring-2 ring-white ring-offset-2">
                        <FaFileInvoice className="text-slate-500 group-hover:text-brand-600 transition-colors" size={14} />
                      </div>
                      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-100 -z-10 last:hidden"></div>
                    </div>
                    <div className="flex-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <FaClock size={10} /> {activity.time}
                        </span>
                        <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          Ksh {activity.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Alerts & Quick Actions */}
          <div className="space-y-6 animate-slide-up delay-400">

            {/* Smart Alerts */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 jarvis-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FaBell className="text-red-500" /> Intelligence
              </h2>
              <div className="space-y-3">
                {smartAlerts.length === 0 ? (
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-green-700 text-sm flex items-center gap-3">
                    <FaCheckCircle /> All systems nominal.
                  </div>
                ) : (
                  smartAlerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-xl text-sm border flex items-start gap-3 transition-transform hover:scale-105 ${alert.type === 'danger' ? 'bg-red-50 border-red-100 text-red-800' :
                      alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                        'bg-blue-50 border-blue-100 text-blue-800'
                      }`}>
                      <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                      <span>{alert.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg jarvis-card">
              <h2 className="text-lg font-bold mb-4">Quick Command</h2>
              <div className="space-y-3">
                <Link to="/new-invoice" className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-brand-600 transition-all group">
                  <span className="text-sm font-medium">Create New Order</span>
                  <FaPlus className="text-slate-400 group-hover:text-white transition-colors" />
                </Link>
                <Link to="/stock" className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-brand-600 transition-all group">
                  <span className="text-sm font-medium">Manage Inventory</span>
                  <FaBoxOpen className="text-slate-400 group-hover:text-white transition-colors" />
                </Link>
                <Link to="/invoices" className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-brand-600 transition-all group">
                  <span className="text-sm font-medium">View All Orders</span>
                  <FaEye className="text-slate-400 group-hover:text-white transition-colors" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;