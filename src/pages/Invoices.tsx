// src/pages/Invoices.tsx
/**
 * Invoices List Page - Three Category System
 * 
 * Displays invoices organized into three categories:
 * - Quotations: Price quotes for potential clients
 * - Proforma Invoices: Preliminary invoices before final
 * - Invoices: Final invoices for payment
 * 
 * Features:
 * - Tab-based navigation between categories
 * - Edit functionality for all document types
 * - Convert workflow (Quotation → Proforma → Invoice)
 * - Status management (internal use only, not shown in PDF)
 * - Search and filter capabilities
 */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { FaFilePdf, FaTrash, FaSearch, FaEdit, FaCheck, FaClock, FaExchangeAlt, FaCopy, FaShareAlt, FaFilter, FaSortAmountDown, FaSortAmountUp, FaFileInvoice } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import type { Invoice as InvoiceData, InvoiceType as DocumentType } from "../types/types";
import { useToast } from "../contexts/ToastContext";
import { useDebounce, useKeyboardShortcut } from "../hooks/useUtils";
import { EmptyState, LoadingSpinner } from "../components/shared/UIComponents";

// --- Constants ---
const INVOICES_KEY = "invoices";

const Invoices: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- State ---
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentType>('quotation');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounced search for better performance
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Keyboard shortcut: Ctrl+N to create new invoice
  useKeyboardShortcut('n', () => navigate('/new-invoice'), true);

  // --- Data Loading ---
  const loadInvoices = useCallback(() => {
    try {
      setLoading(true);
      const raw = localStorage.getItem(INVOICES_KEY);

      if (!raw) {
        setInvoices([]);
        return;
      }

      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        setInvoices([]);
        return;
      }

      // Normalize invoices - add type field if missing (backward compatibility)
      const normalizedInvoices = parsed.map((inv: any, index: number) => {
        if (!inv || typeof inv !== 'object') return null;
        const transformed = { ...inv };

        if (!transformed.id) transformed.id = `INV-${Date.now()}-${index}`;
        if (!transformed.type) transformed.type = 'invoice';

        // Migrate clientName to customer.name
        if (!transformed.customer) transformed.customer = {};
        if (transformed.clientName && !transformed.customer.name) {
          transformed.customer.name = transformed.clientName;
        }

        // Migrate total to grandTotal
        if (transformed.total !== undefined && transformed.grandTotal === undefined) {
          transformed.grandTotal = transformed.total;
        }

        // Update old status values
        if (transformed.status === "Pending") transformed.status = "sent";
        if (transformed.status === "Overdue") transformed.status = "sent";
        if (!transformed.status || !["draft", "sent", "paid", "cancelled"].includes(transformed.status)) {
          transformed.status = "draft";
        }

        if (!transformed.items || !Array.isArray(transformed.items)) transformed.items = [];

        return transformed as InvoiceData;
      }).filter(Boolean) as InvoiceData[];

      setInvoices(normalizedInvoices);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // --- Actions ---
  const deleteInvoice = useCallback((id: string) => {
    if (!confirm("Delete this document? This action cannot be undone.")) return;
    try {
      const updated = invoices.filter((inv) => inv.id !== id);
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      showToast('error', 'Failed to delete document');
    }
  }, [invoices]);

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${selectedIds.size} selected documents? This action cannot be undone.`)) return;
    try {
      const updated = invoices.filter((inv) => !selectedIds.has(inv.id));
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (filteredItems: InvoiceData[]) => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleShare = async (invoice: InvoiceData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${getTypeLabel(invoice.type)} ${invoice.id}`,
          text: `${getTypeLabel(invoice.type)} ${invoice.id} for ${invoice.customer?.name || "Client"}\nTotal: ${invoice.grandTotal?.toLocaleString() || 0} Ksh\nDate: ${invoice.issuedDate}`,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      showToast('info', 'Sharing is not supported on this device/browser');
    }
  };

  const updateInvoiceStatus = useCallback((id: string, newStatus: InvoiceData["status"]) => {
    try {
      const updated = invoices.map((inv) =>
        inv.id === id ? { ...inv, status: newStatus } : inv
      );
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
      setEditingStatus(null);
    } catch (error) {
      console.error("Failed to update status:", error);
      showToast('error', 'Failed to update status');
    }
  }, [invoices]);

  const convertDocument = useCallback((invoice: InvoiceData, toType: DocumentType) => {
    if (!confirm(`Convert this ${invoice.type} to ${toType}?`)) return;

    try {
      const newId = toType === 'proforma'
        ? `PRO-${Date.now()}`
        : toType === 'invoice'
          ? `INV-${Date.now()}`
          : `QUO-${Date.now()}`;

      const newDocument: InvoiceData = {
        ...invoice,
        id: newId,
        type: toType,
        status: 'draft',
        convertedFrom: invoice.id,
        issuedDate: new Date().toISOString().split('T')[0],
      };

      const updated = [...invoices, newDocument];
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));

      showToast('success', `Converted to ${toType}! New ID: ${newId}`);
      setActiveTab(toType);
    } catch (error) {
      console.error("Failed to convert document:", error);
      showToast('error', 'Failed to convert document');
    }
  }, [invoices]);

  const duplicateDocument = useCallback((invoice: InvoiceData) => {
    try {
      const newId = invoice.type === 'quotation'
        ? `QUO-${Date.now()}`
        : invoice.type === 'proforma'
          ? `PRO-${Date.now()}`
          : `INV-${Date.now()}`;

      const duplicate: InvoiceData = {
        ...invoice,
        id: newId,
        status: 'draft',
        issuedDate: new Date().toISOString().split('T')[0],
      };

      const updated = [...invoices, duplicate];
      setInvoices(updated);
      localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));

      showToast('success', `Document duplicated! New ID: ${newId}`);
    } catch (error) {
      console.error("Failed to duplicate document:", error);
      showToast('error', 'Failed to duplicate document');
    }
  }, [invoices]);

  const editDocument = useCallback((invoice: InvoiceData) => {
    localStorage.setItem('editing_invoice', JSON.stringify(invoice));
    navigate('/new-invoice');
  }, [navigate]);

  // --- Filtering & Sorting ---
  const filteredByType = invoices.filter(inv => inv.type === activeTab);

  const filteredAndSorted = filteredByType.filter((inv) => {
    if (!inv) return false;

    // Status Filter
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;

    // Search
    const customerName = inv?.customer?.name || "";
    const invoiceId = inv?.id || "";
    return (
      (customerName && customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (invoiceId && invoiceId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }).sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;

    if (sortConfig.key === 'date') {
      return (new Date(a.issuedDate || '').getTime() - new Date(b.issuedDate || '').getTime()) * direction;
    }
    if (sortConfig.key === 'amount') {
      return ((a.grandTotal || 0) - (b.grandTotal || 0)) * direction;
    }
    if (sortConfig.key === 'name') {
      return (a.customer?.name || '').localeCompare(b.customer?.name || '') * direction;
    }
    return 0;
  });

  // --- Helper Functions ---
  const getStatusColor = (status: InvoiceData["status"]) => {
    switch (status) {
      case "paid": return "text-green-600 bg-green-100 ring-1 ring-green-200";
      case "sent": return "text-blue-600 bg-blue-100 ring-1 ring-blue-200";
      case "draft": return "text-gray-600 bg-gray-100 ring-1 ring-gray-200";
      case "cancelled": return "text-red-600 bg-red-100 ring-1 ring-red-200";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'quotation': return 'Quotation';
      case 'proforma': return 'Proforma Invoice';
      case 'invoice': return 'Invoice';
    }
  };

  const getTypeCounts = () => {
    return {
      quotation: invoices.filter(inv => inv.type === 'quotation').length,
      proforma: invoices.filter(inv => inv.type === 'proforma').length,
      invoice: invoices.filter(inv => inv.type === 'invoice').length,
    };
  };

  const counts = getTypeCounts();

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up delay-100">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Orders</h1>
          <p className="text-gray-500 mt-1">Manage quotations, proforma orders, and tax invoices</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6 border border-gray-100 overflow-hidden animate-slide-up delay-200">
          <div className="flex border-b border-gray-200">
            {['quotation', 'proforma', 'invoice'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveTab(type as DocumentType)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-all relative ${activeTab === type
                  ? 'text-brand-600 bg-brand-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="capitalize text-base">{type === 'proforma' ? 'Proforma Orders' : type === 'invoice' ? 'Orders' : 'Quotations'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === type ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30' : 'bg-gray-200 text-gray-600'
                    }`}>
                    {counts[type as DocumentType]}
                  </span>
                </div>
                {activeTab === type && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 animate-fade-in"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: Search, Filter, Sort */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              placeholder={`Search ${getTypeLabel(activeTab).toLowerCase()}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortConfig.key}
                onChange={(e) => setSortConfig({ ...sortConfig, key: e.target.value })}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="name">Client Name</option>
              </select>
              <FaSortAmountDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <button
              onClick={() => setSortConfig(c => ({ ...c, direction: c.direction === 'asc' ? 'desc' : 'asc' }))}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              {sortConfig.direction === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
            </button>
          </div>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                      onChange={() => handleSelectAll(filteredAndSorted)}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4 hidden sm:table-cell">Date</th>
                  <th className="px-6 py-4 hidden md:table-cell">
                    {activeTab === 'quotation' ? 'Valid Until' : 'Due Date'}
                  </th>
                  <th className="px-6 py-4">Total (Ksh)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No {getTypeLabel(activeTab).toLowerCase()}s found
                    </td>
                  </tr>
                ) : (
                  filteredAndSorted.map((inv) => {
                    const customerName = inv?.customer?.name || "N/A";
                    const issuedDate = inv?.issuedDate || inv?.date || "N/A";
                    const dueDate = inv?.dueDate || inv?.quotationValidUntil || "N/A";
                    const total = inv?.grandTotal || 0;
                    const isSelected = selectedIds.has(inv.id);

                    return (
                      <tr key={inv?.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(inv.id)}
                            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv?.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="font-semibold text-gray-900">{customerName}</div>
                          <div className="text-xs text-gray-400 mt-0.5 sm:hidden">{issuedDate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{issuedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{dueDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900">{total.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingStatus === inv?.id ? (
                            <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-gray-100 flex-wrap z-10 relative">
                              <button
                                onClick={() => updateInvoiceStatus(inv?.id, "draft")}
                                className="px-2 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                              >
                                Draft
                              </button>
                              <button
                                onClick={() => updateInvoiceStatus(inv?.id, "sent")}
                                className="px-2 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                              >
                                Sent
                              </button>
                              <button
                                onClick={() => updateInvoiceStatus(inv?.id, "paid")}
                                className="px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                              >
                                Paid
                              </button>
                              <button
                                onClick={() => setEditingStatus(null)}
                                className="px-2 py-1 text-xs font-medium rounded bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(inv?.status || "draft")}`}>
                              {inv?.status || "draft"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-1 justify-center flex-wrap">
                            <button
                              onClick={() => handleShare(inv)}
                              className="text-gray-400 hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50 md:hidden"
                              title="Share"
                            >
                              <FaShareAlt size={16} />
                            </button>
                            <button
                              onClick={() => generateInvoicePDF(inv as any)}
                              className="text-gray-400 hover:text-brand-600 transition-colors p-2 rounded-full hover:bg-brand-50"
                              title="Download PDF"
                            >
                              <FaFilePdf size={16} />
                            </button>
                            <button
                              onClick={() => navigate(`/new-invoice?id=${inv.id}&type=${inv.type.toLowerCase()}`)}
                              className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-blue-50"
                              title="Edit Document"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              onClick={() => setEditingStatus(inv?.id || null)}
                              className="text-gray-400 hover:text-green-600 transition-colors p-2 rounded-full hover:bg-green-50"
                              title="Update Status"
                            >
                              <FaCheck size={16} />
                            </button>
                            <button
                              onClick={() => duplicateDocument(inv)}
                              className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-full hover:bg-purple-50"
                              title="Duplicate"
                            >
                              <FaCopy size={16} />
                            </button>
                            {activeTab === 'quotation' && (
                              <button
                                onClick={() => convertDocument(inv, 'proforma')}
                                className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                                title="Convert to Proforma"
                              >
                                <FaExchangeAlt size={16} />
                              </button>
                            )}
                            {activeTab === 'proforma' && (
                              <button
                                onClick={() => convertDocument(inv, 'invoice')}
                                className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-indigo-50"
                                title="Convert to Invoice"
                              >
                                <FaExchangeAlt size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteInvoice(inv?.id || "")}
                              className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                              title="Delete"
                            >
                              <FaTrash size={16} />
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

        {/* Bulk Actions Floating Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50 animate-slide-up">
            <span className="font-medium text-sm">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-slate-700"></div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
            >
              <FaTrash size={14} /> Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
