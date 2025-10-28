// src/pages/Dashboard.tsx
// Comprehensive Dashboard for KONSUT Ltd Invoice Management System

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
  FaDownload
} from "react-icons/fa";
import { Link } from "react-router-dom";

// Define interfaces matching our invoice structure
interface InvoiceLine {
  id: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  productFreight?: number;
  lineTotal?: number;
}

interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  dueDate?: string;
  customer?: {
    id?: string;
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  clientName?: string;
  phone?: string;
  email?: string;
  items?: InvoiceLine[];
  subtotal?: number;
  productFreightTotal?: number;
  grandTotal?: number;
  total?: number;
  freightRate?: number;
  currencyRate?: number;
  status: "Paid" | "Pending" | "Overdue";
}

interface StockItem {
  id: string;
  name: string;
  category: "products" | "mobilization" | "services";
  quantity: number;
  priceKsh: number;
  priceUSD?: number;
  weight?: number;
  description?: string;
}

const Dashboard: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [stock, setStock] = useState<Record<string, StockItem[]>>({ products: [], mobilization: [], services: [] });
  const [loading, setLoading] = useState(true);

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load invoices
      const storedInvoices = localStorage.getItem("invoices");
      if (storedInvoices) {
        const parsedInvoices: InvoiceData[] = JSON.parse(storedInvoices);
        setInvoices(parsedInvoices);
      }

      // Load stock
      const storedStock = localStorage.getItem("stockData");
      if (storedStock) {
        const parsedStock = JSON.parse(storedStock);
        setStock(parsedStock);
      }
    } catch (err) {
      console.error("Failed to load data from localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issuedDate || inv.date || "");
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });

    const lastMonthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.issuedDate || inv.date || "");
      return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
    });

    const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    
    const paidInvoices = invoices.filter(inv => inv.status === "Paid");
    const pendingInvoices = invoices.filter(inv => inv.status === "Pending");
    const overdueInvoices = invoices.filter(inv => inv.status === "Overdue");
    
    const averageInvoiceValue = invoices.length > 0 
      ? totalRevenue / invoices.length 
      : 0;

    // Calculate top customers
    const customerTotals: Record<string, { name: string; total: number; count: number }> = {};
    invoices.forEach(inv => {
      const customerName = inv.customer?.name || inv.clientName || "Unknown";
      if (!customerTotals[customerName]) {
        customerTotals[customerName] = { name: customerName, total: 0, count: 0 };
      }
      customerTotals[customerName].total += inv.grandTotal || inv.total || 0;
      customerTotals[customerName].count += 1;
    });
    
    const topCustomers = Object.values(customerTotals)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Calculate stock value
    const stockValue = Object.values(stock).flat().reduce((sum, item) => 
      sum + (item.priceKsh * item.quantity), 0
    );

    return {
      totalInvoices: invoices.length,
      totalRevenue,
      currentMonthRevenue,
      lastMonthRevenue,
      revenueChange: lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
        : "0",
      averageInvoiceValue,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      topCustomers,
      stockValue,
      recentInvoices: invoices.slice(0, 5)
    };
  }, [invoices, stock]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">KONSUT Ltd Dashboard</h1>
            <p className="text-gray-600">Invoice Management System</p>
          </div>
          <Link 
            to="/new-invoice" 
            className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FaPlus /> New Invoice
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">Ksh {metrics.totalRevenue.toLocaleString()}</p>
                <p className={`text-sm ${Number(metrics.revenueChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(metrics.revenueChange) >= 0 ? '+' : ''}{metrics.revenueChange}% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FaMoneyBillWave className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalInvoices}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <FaFileInvoice className="text-indigo-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Invoice</p>
                <p className="text-2xl font-bold text-gray-900">Ksh {Math.round(metrics.averageInvoiceValue).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Per invoice</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FaChartLine className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stock Value</p>
                <p className="text-2xl font-bold text-gray-900">Ksh {metrics.stockValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Current inventory</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <FaUsers className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Status and Recent Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Invoice Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaCheckCircle className="text-green-500 mr-2" />
                  <span className="text-gray-700">Paid</span>
                </div>
                <span className="font-semibold">{metrics.paidInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaClock className="text-yellow-500 mr-2" />
                  <span className="text-gray-700">Pending</span>
                </div>
                <span className="font-semibold">{metrics.pendingInvoices}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-500 mr-2" />
                  <span className="text-gray-700">Overdue</span>
                </div>
                <span className="font-semibold">{metrics.overdueInvoices}</span>
              </div>
            </div>
          </div>

          {/* Top Customers */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Customers</h2>
            {metrics.topCustomers.length === 0 ? (
              <p className="text-gray-500">No customers yet</p>
            ) : (
              <div className="space-y-3">
                {metrics.topCustomers.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <p className="text-sm text-gray-500">{customer.count} invoice{customer.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-semibold">Ksh {customer.total.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link 
                to="/new-invoice" 
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create New Invoice
              </Link>
              <Link 
                to="/invoices" 
                className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                View All Invoices
              </Link>
              <Link 
                to="/stock" 
                className="block w-full text-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Manage Stock
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Invoices Table */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
            <Link to="/invoices" className="text-blue-600 hover:text-blue-800 text-sm">
              View All
            </Link>
          </div>
          {metrics.recentInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No invoices yet</p>
              <Link 
                to="/new-invoice" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Your First Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.recentInvoices.map((invoice) => {
                    const customerName = invoice.customer?.name || invoice.clientName || "N/A";
                    const invoiceDate = invoice.issuedDate || invoice.date || "N/A";
                    const total = invoice.grandTotal || invoice.total || 0;
                    
                    return (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.id}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {customerName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {invoiceDate !== "N/A" ? new Date(invoiceDate).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          Ksh {total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                            <FaEye />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;