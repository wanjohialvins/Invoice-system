// src/pages/Invoices.tsx
/**
 * Invoices List Page
 * 
 * Displays a historical record of all created invoices and quotations.
 * 
 * Functions:
 * - List view: Tabular display of invoices with sorting/filtering (search).
 * - Status Management: Quick toggle to mark invoices as Paid/Pending/Overdue.
 * - Actions: 
 *   - Generate PDF (regenerates document on demand).
 *   - Delete Invoice (removes from localStorage).
 *   - Edit Status (inline editing).
 * 
 * Implementation Details:
 * - Data Source: `localStorage` key 'invoices'.
 * - Rendering: Mapped list with 'filtered' results based on search term.
 */
import React, { useEffect, useState, useCallback } from "react";
import { FaFilePdf, FaTrash, FaSearch, FaEdit, FaCheck, FaClock } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

import { generateInvoicePDF } from "../utils/pdfGenerator";

// --- Constants ---
const INVOICES_KEY = "invoices";

// --- Interfaces ---
// Flexible definition to accomodate potential schema evolution.
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
  clientName?: string; // Backward compatibility
  phone?: string;
  email?: string;
  items?: InvoiceLine[];
  subtotal?: number;
  productFreightTotal?: number;
  grandTotal?: number;
  total?: number; // Backward compatibility
  freightRate?: number;
  currencyRate?: number;
  status: "Paid" | "Pending" | "Overdue";
}

// --- Error Boundary ---
// Catches rendering errors in the list to prevent full app crash.
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600 mt-2">
            {this.state.error?.message || "An unknown error occurred"}
          </p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Invoices: React.FC = () => {
  // --- State ---
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Data Loading ---
  const loadInvoices = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const raw = localStorage.getItem(INVOICES_KEY);

      if (!raw) {
        setInvoices([]);
        return;
      }

      const parsed = JSON.parse(raw);

      // Validation: Ensure we have an array
      if (!Array.isArray(parsed)) {
        setInvoices([]);
        return;
      }

      // Normalization: Ensure each invoice meets the schema
      const normalizedInvoices = parsed.map((inv, index) => {
        try {
          if (!inv || typeof inv !== 'object') return null;

          if (!inv.id) inv.id = `INV-${Date.now()}-${index}`;

          if (!inv.status || !["Paid", "Pending", "Overdue"].includes(inv.status)) {
            inv.status = "Pending";
          }

          if (!inv.customer) inv.customer = {};
          if (!inv.items || !Array.isArray(inv.items)) inv.items = [];

          return inv as InvoiceData;
        } catch (err) {
          return null;
        }
      }).filter(Boolean) as InvoiceData[];

      setInvoices(normalizedInvoices);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      setError(`Failed to load invoices: ${error instanceof Error ? error.message : String(error)}`);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // --- Actions (Delete, Update) ---
  const deleteInvoice = useCallback((id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      const updated = invoices.filter((inv) => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      alert("Failed to delete invoice");
    }
  }, [invoices]);

  const updateInvoiceStatus = useCallback((id: string, newStatus: InvoiceData["status"]) => {
    try {
      const updated = invoices.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus } : inv
      );
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      setEditingStatus(null);
    } catch (error) {
      console.error("Failed to update invoice status:", error);
      alert("Failed to update invoice status");
    }
  }, [invoices]);

  // --- Filtering ---
  const filtered = invoices.filter(
    (inv) => {
      if (!inv) return false;

      const customerName = inv?.customer?.name || inv?.clientName || "";
      const invoiceId = inv?.id || "";

      return (
        (customerName && customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (invoiceId && invoiceId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  );

  const getStatusColor = (status: InvoiceData["status"]) => {
    switch (status) {
      case "Paid": return "text-green-600 bg-green-100 ring-1 ring-green-200";
      case "Pending": return "text-yellow-600 bg-yellow-100 ring-1 ring-yellow-200";
      case "Overdue": return "text-red-600 bg-red-100 ring-1 ring-red-200";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Auto-Update Status: Check for overdue invoices on load
  useEffect(() => {
    if (invoices.length === 0) return;

    let hasChanges = false;
    const updated = invoices.map(inv => {
      const dueDate = inv?.dueDate;
      if (inv?.status === "Pending" && isOverdue(dueDate)) {
        hasChanges = true;
        return { ...inv, status: "Overdue" as const };
      }
      return inv;
    });

    if (hasChanges) {
      try {
        setInvoices(updated);
        localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error("Failed to update overdue invoices:", error);
      }
    }
  }, [invoices]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-2 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Invoices</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadInvoices}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 mt-1">Manage and track your invoices</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search by client name or invoice ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Table List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4 hidden sm:table-cell">Date</th>
                    <th className="px-6 py-4 hidden md:table-cell">Due</th>
                    <th className="px-6 py-4">Total (Ksh)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((inv) => {
                      // Handle different data structures with safe access
                      const customerName = inv?.customer?.name || inv?.clientName || "N/A";
                      const issuedDate = inv?.issuedDate || inv?.date || "N/A";
                      const dueDate = inv?.dueDate || "N/A";
                      const total = inv?.grandTotal || inv?.total || 0;

                      return (
                        <tr key={inv?.id || Math.random().toString()} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv?.id || "N/A"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="font-semibold text-gray-900">{customerName}</div>
                            <div className="text-xs text-gray-400 mt-0.5 sm:hidden">{issuedDate}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{issuedDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{dueDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{total.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingStatus === inv?.id ? (
                              <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                                <button
                                  onClick={() => updateInvoiceStatus(inv?.id || "", "Paid")}
                                  className="px-3 py-1 text-xs font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                                >
                                  <FaCheck /> Paid
                                </button>
                                <button
                                  onClick={() => updateInvoiceStatus(inv?.id || "", "Pending")}
                                  className="px-3 py-1 text-xs font-medium rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition-colors"
                                >
                                  <FaClock /> Pending
                                </button>
                                <button
                                  onClick={() => setEditingStatus(null)}
                                  className="px-3 py-1 text-xs font-medium rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(inv?.status || "Pending")}`}>
                                {inv?.status || "Pending"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => generateInvoicePDF(inv as any)}
                                className="text-gray-400 hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50"
                                title="Download PDF"
                              >
                                <FaFilePdf size={18} />
                              </button>
                              <button
                                onClick={() => setEditingStatus(inv?.id || null)}
                                className="text-gray-400 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-green-50"
                                title="Update Status"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteInvoice(inv?.id || "")}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                title="Delete Invoice"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Invoices;
