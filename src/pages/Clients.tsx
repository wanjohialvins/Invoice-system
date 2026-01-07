// src/pages/Clients.tsx
/**
 * Client Management System
 * 
 * Manages the database of clients, including their contact details and transaction history.
 * 
 * Key Features:
 * - Client Database: CRUD operations for manual clients.
 * - Invoice Sync: Automatically extracts client profiles from existing invoices.
 * - Analytics: Calculates total revenue, invoice count, and standing (overdue/pending) per client.
 * - Search & Filter: Real-time search by name, email, company, or phone.
 * - Export: CSV export of client data including financial stats.
 * - Import/Seeding: Capability to seed sample data for testing.
 * 
 * Data Structure:
 * - Clients are stored in 'konsut_clients'.
 * - 'manual' clients can be edited/deleted directly.
 * - 'invoice' clients are derived from invoice history and are read-only to preserve integrity.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFileInvoice,
  FaEye,
  FaSave,
  FaTimes,
  FaUser,
  FaBuilding,
  FaSync,
  FaDownload,
  FaSeedling,
  FaEraser,
  FaExclamationTriangle
} from "react-icons/fa";
import logo from "../assets/logo.jpg";
import { useToast } from "../contexts/ToastContext";
import { useDebounce, useKeyboardShortcut } from "../hooks/useUtils";
import { EmptyState, LoadingSpinner } from "../components/shared/UIComponents";

/* -------------------------------------------------------------------------- */
/*                                Types                                       */
/* -------------------------------------------------------------------------- */

// Defines the structure of a Client.
// 'source' determines if the client was manually added or auto-generated from an invoice.
interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  company?: string;
  kraPin?: string;
  createdAt: string;
  updatedAt: string;
  source: 'invoice' | 'draft' | 'manual';
}

// Partial Invoice structure needed for calculating client stats.
interface InvoiceData {
  id: string;
  date?: string;
  issuedDate?: string;
  grandTotal?: number;
  total?: number;
  status: "Paid" | "Pending" | "Overdue";
  // Support for variant data structures (customer object vs flat fields)
  customer?: { id?: string; name?: string; phone?: string; email?: string; address?: string };
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

const CLIENTS_KEY = "konsut_clients";
const INVOICES_KEY = "invoices";
const DRAFT_KEY = "konsut_newinvoice_draft_vFinal";

/* -------------------------------------------------------------------------- */
/*                                Helpers                                     */
/* -------------------------------------------------------------------------- */

// Generate 2-letter initials (e.g., "John Doe" -> "JD")
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

// Generate a deterministic color from a string (for avatars)
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

// Export Client Data to CSV
const downloadCSV = (clients: Client[], statsMap: Record<string, any>) => {
  const headers = ["ID", "Name", "Company", "Phone", "Email", "Address", "Source", "Total Revenue", "Total Invoices"];
  const rows = clients.map(c => {
    const stats = statsMap[c.id] || { totalRevenue: 0, totalInvoices: 0 };
    return [
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.company || ""}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${c.address}"`,
      `"${c.source}"`,
      stats.totalRevenue,
      stats.totalInvoices
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `konsut_clients_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

const Clients: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    kraPin: ""
  });

  /* -------------------------------------------------------------------------- */
  /*                                Data Loading                                */
  /* -------------------------------------------------------------------------- */

  // Load clients and invoices on mount
  useEffect(() => {
    try {
      const storedClients = localStorage.getItem(CLIENTS_KEY);
      if (storedClients) setClients(JSON.parse(storedClients));

      const storedInvoices = localStorage.getItem(INVOICES_KEY);
      if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                Logic                                       */
  /* -------------------------------------------------------------------------- */

  // Compute aggregated stats for each client (Total Revenue, Invoice Count, etc.)
  const clientStats = useMemo(() => {
    const stats: Record<string, { totalRevenue: number; totalInvoices: number; lastActive: string | null; pending: number; overdue: number }> = {};

    clients.forEach(c => {
      // Find invoices belonging to this client (matching by name/phone/email)
      const cInvoices = invoices.filter(inv => {
        const iName = inv.customer?.name || inv.customerName;
        const iPhone = inv.customer?.phone || inv.customerPhone;
        const iEmail = inv.customer?.email || inv.customerEmail;
        return iName === c.name || iPhone === c.phone || iEmail === c.email;
      });

      const totalRevenue = cInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
      const dates = cInvoices
        .map(inv => inv.issuedDate || inv.date)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());

      stats[c.id] = {
        totalRevenue,
        totalInvoices: cInvoices.length,
        lastActive: dates.length > 0 ? dates[0]! : null,
        pending: cInvoices.filter(i => i.status === "Pending").length,
        overdue: cInvoices.filter(i => i.status === "Overdue").length
      };
    });
    return stats;
  }, [clients, invoices]);

  // Sync Logic: Scans all invoices and creates Client profiles for anyone not already in the DB.
  // Useful for migrating legacy data or if clients were added directly on the Invoice Form.
  const syncClientsFromInvoices = useCallback(() => {
    setSyncing(true);
    setTimeout(() => {
      try {
        const storedInvoices = localStorage.getItem(INVOICES_KEY);
        const invData: InvoiceData[] = storedInvoices ? JSON.parse(storedInvoices) : [];

        const manualClients = clients.filter(c => c.source === 'manual');
        const extracted = new Map<string, Client>();

        invData.forEach(inv => {
          const name = inv.customer?.name || inv.customerName;
          const phone = inv.customer?.phone || inv.customerPhone;
          const email = inv.customer?.email || inv.customerEmail;
          if (name && phone) {
            const key = `${name}-${phone}`;
            if (!extracted.has(key)) {
              extracted.set(key, {
                id: inv.customer?.id || inv.customerId || `INV-${Date.now()}-${name.substring(0, 3)}`,
                name,
                phone,
                email: email || "",
                address: inv.customer?.address || inv.customerAddress || "",
                createdAt: inv.issuedDate || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                source: 'invoice' // Marked as auto-generated
              });
            }
          }
        });

        // Merge manual clients with extracted ones (prefer manual if dupe exists? here we just append unique)
        const newClients = [...manualClients, ...Array.from(extracted.values())];
        const unique = newClients.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.phone === v.phone)) === i);

        setClients(unique);
        setInvoices(invData);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(unique));
        showToast('success', 'Sync complete: Clients updated from invoices');
      } catch (e) {
        console.error(e);
      } finally {
        setSyncing(false);
      }
    }, 800);
  }, [clients]);

  // Seed Clients: Populate with dummy data for testing
  const seedClients = () => {
    if (!confirm("Add sample clients to your database?")) return;

    const dummyClients: Client[] = [
      { id: "SEED-1", name: "Safaricom PLC", company: "Safaricom", phone: "+254 722 000 000", email: "procurement@safaricom.co.ke", address: "Safaricom House, Waiyaki Way, Nairobi", kraPin: "P051234567A", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-2", name: "KCB Group", company: "KCB Bank", phone: "+254 711 000 000", email: "info@kcbgroup.com", address: "Kencom House, Nairobi CBD", kraPin: "P051234568B", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-3", name: "Davis & Shirtliff", company: "D&S", phone: "+254 722 123 456", email: "sales@dayliff.com", address: "Industrial Area, Nairobi", kraPin: "P051234569C", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-4", name: "John Kamau", company: "Private", phone: "+254 700 111 222", email: "jkamau@gmail.com", address: "Runda Estate, House 45", kraPin: "A001234567D", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' },
      { id: "SEED-5", name: "Tech Solutions Ltd", company: "Tech Solutions", phone: "+254 733 444 555", email: "admin@techsolutions.co.ke", address: "Westlands, The Mirage", kraPin: "P051234570E", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), source: 'manual' }
    ];

    const updated = [...clients, ...dummyClients];
    // dedupe based on name/phone
    const unique = updated.filter((v, i, a) => a.findIndex(t => (t.name === v.name && t.phone === v.phone)) === i);

    setClients(unique);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(unique));
  };

  // Delete All Clients: Hard reset
  const deleteAllClients = () => {
    if (confirm("WARNING: This will delete ALL client data. This cannot be undone. Are you sure?")) {
      if (confirm("Double check: Are you absolutely sure you want to wipe the client database?")) {
        setClients([]);
        localStorage.removeItem(CLIENTS_KEY);
      }
    }
  };

  // CRUD Actions: Create/Update
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast('warning', 'Name and Phone are required');
      return;
    }

    const newClient: Client = {
      id: editingClient ? editingClient.id : `MANUAL-${Date.now()}`,
      ...formData,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'manual'
    };

    let updated;
    if (editingClient) {
      updated = clients.map(c => c.id === editingClient.id ? newClient : c);
    } else {
      updated = [...clients, newClient];
    }

    setClients(updated);
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
    setShowForm(false);
    setEditingClient(null);
    setFormData({ name: "", phone: "", email: "", address: "", company: "", kraPin: "" });
  };

  // CRUD Actions: Delete single client
  const handleDelete = (id: string) => {
    if (confirm("Delete this client? This process cannot be undone.")) {
      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
      setSelectedClient(null);
    }
  };

  // Helper: Pre-fill form for editing
  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      company: client.company || "",
      kraPin: client.kraPin || ""
    });
    setShowForm(true);
  };

  // Filter clients for display
  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.phone.includes(term)
    );
  }, [clients, searchTerm]);

  /* -------------------------------------------------------------------------- */
  /*                                Render                                      */
  /* -------------------------------------------------------------------------- */

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-500 mt-1">Manage relationships and view history</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {/* Data Tools */}
            <div className="flex gap-2 mr-2 border-r pr-2 border-gray-300">
              <button onClick={deleteAllClients} title="Delete All Clients" className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition">
                <FaEraser /> <span className="hidden md:inline">Clear</span>
              </button>
              <button onClick={seedClients} title="Seed Sample Clients" className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition">
                <FaSeedling /> <span className="hidden md:inline">Seed</span>
              </button>
            </div>

            <button onClick={() => downloadCSV(clients, clientStats)} title="Export Clients to CSV" className="flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              <FaDownload /> <span className="hidden md:inline">Export</span>
            </button>
            <button onClick={syncClientsFromInvoices} disabled={syncing} title="Sync Clients from Invoices" className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm">
              <FaSync className={syncing ? "animate-spin" : ""} /> Sync
            </button>
            <button onClick={() => { setEditingClient(null); setFormData({ name: "", phone: "", email: "", address: "", company: "", kraPin: "" }); setShowForm(true); }} title="Add New Client" className="flex items-center gap-2 px-4 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 font-medium">
              <FaPlus /> <span className="hidden md:inline">Add Client</span><span className="md:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm">Total Clients</div>
            <div className="text-2xl font-bold text-gray-800">{clients.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm">Total Revenue</div>
            <div className="text-2xl font-bold text-green-600">
              Ksh {Object.values(clientStats).reduce((a, b) => a + b.totalRevenue, 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm">Active Invoices</div>
            <div className="text-2xl font-bold text-yellow-600">
              {invoices.filter(i => i.status === "Pending").length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="text-gray-500 text-sm">Overdue Clients</div>
            <div className="text-2xl font-bold text-red-600">
              {Object.values(clientStats).filter(s => s.overdue > 0).length}
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center border border-gray-200">
          <FaSearch className="text-gray-400 mr-3" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, company, email..."
            className="flex-1 outline-none text-gray-700"
          />
        </div>

        {/* Client Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="p-4">Client</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Revenue</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-500">No clients found. Click "Seed" to add samples.</td></tr>
                ) : (
                  filteredClients.map(client => {
                    const stats = clientStats[client.id] || { totalRevenue: 0, totalInvoices: 0, pending: 0, overdue: 0, lastActive: null };
                    const initials = getInitials(client.name);
                    const avatarColor = stringToColor(client.name);

                    return (
                      <tr key={client.id} className="hover:bg-gray-50 transition group cursor-pointer" onClick={() => setSelectedClient(client)}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: avatarColor }}>
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{client.name}</div>
                              {client.company && <div className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-0.5">{client.company}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2 mb-1"><FaEnvelope className="text-gray-300" /> {client.email}</div>
                          <div className="flex items-center gap-2"><FaPhone className="text-gray-300" /> {client.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-gray-800">Ksh {stats.totalRevenue.toLocaleString()}</div>
                          <div className="text-xs text-gray-500">{stats.totalInvoices} Invoices</div>
                        </td>
                        <td className="p-4">
                          {stats.overdue > 0 ? (
                            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">Overdue</span>
                          ) : stats.pending > 0 ? (
                            <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">Pending</span>
                          ) : (
                            <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Good Standing</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : "Never"}
                        </td>
                        <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                          <button onClick={e => { e.stopPropagation(); setSelectedClient(client); }} className="p-2 text-gray-400 hover:text-brand-500 transition" title="View Details">
                            <FaEye />
                          </button>
                          <button onClick={e => { e.stopPropagation(); navigate(`/new-invoice?clientId=${client.id}`); }} className="p-2 text-blue-500 hover:text-blue-700 transition" title="Create Invoice">
                            <FaFileInvoice />
                          </button>
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

      {/* Edit/Add Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-800">{editingClient ? "Edit Client" : "Add New Client"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Name</label>
                  <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Phone</label>
                  <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500" placeholder="+254..." />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500" placeholder="email@example.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Company</label>
                <input value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500" placeholder="Company Ltd" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500" rows={2} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">KRA PIN</label>
                <input value={formData.kraPin} onChange={e => setFormData({ ...formData, kraPin: e.target.value })} className="w-full border p-2 rounded mt-1 outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-500" placeholder="P051234567A" />
              </div>
              <button type="submit" className="w-full bg-[#0099ff] text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                {editingClient ? "Update Client" : "Save Client"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 relative">
              <button onClick={() => setSelectedClient(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: stringToColor(selectedClient.name) }}>
                  {getInitials(selectedClient.name)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedClient.name}</h2>
                  <div className="text-gray-500 flex items-center gap-2">
                    <FaEnvelope size={12} /> {selectedClient.email} &bull; <FaPhone size={12} /> {selectedClient.phone}
                  </div>
                  {selectedClient.company && <div className="text-brand-600 font-medium text-sm mt-1">{selectedClient.company}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Lifetime Value</div>
                  <div className="text-xl font-bold text-green-600">
                    Ksh {clientStats[selectedClient.id]?.totalRevenue.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Total Invoices</div>
                  <div className="text-xl font-bold text-gray-800">
                    {clientStats[selectedClient.id]?.totalInvoices || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xs text-gray-500 uppercase font-semibold">Status</div>
                  <div className="text-xl font-bold text-gray-800">
                    {clientStats[selectedClient.id]?.overdue > 0 ? "Overdue" : "Good"}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-800 mb-2">Address & KRA PIN</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                  <p className="mb-2"><strong className="text-gray-900">Address:</strong> {selectedClient.address || "N/A"}</p>
                  <p><strong className="text-gray-900">KRA PIN:</strong> {selectedClient.kraPin || "Not provided"}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setShowForm(true); setEditingClient(selectedClient); setSelectedClient(null); }} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200">
                  Edit Details
                </button>
                <button onClick={() => handleDelete(selectedClient.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg font-semibold hover:bg-red-100">
                  Delete Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;