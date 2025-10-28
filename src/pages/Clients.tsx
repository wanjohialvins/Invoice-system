// src/pages/Clients.tsx
// Client Management System for KONSUT Ltd - Integrated with Invoice Data

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  FaSync
} from "react-icons/fa";

// Define interfaces matching the invoice data structure
interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  source: 'invoice' | 'draft' | 'manual'; // Track where the client came from
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
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  grandTotal?: number;
  total?: number;
  status: "Paid" | "Pending" | "Overdue";
}

interface DraftData {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  // ... other draft fields
}

const CLIENTS_KEY = "konsut_clients";
const INVOICES_KEY = "invoices";
const DRAFT_KEY = "konsut_newinvoice_draft_vFinal";

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    company: "",
    notes: ""
  });

  // Extract clients from invoice data
  const extractClientsFromInvoices = useCallback((invoices: InvoiceData[]): Client[] => {
    const clientMap = new Map<string, Client>();

    invoices.forEach(invoice => {
      // Try to get customer data from the customer object
      const customerId = invoice.customer?.id || invoice.customerId;
      const customerName = invoice.customer?.name || invoice.customerName;
      const customerPhone = invoice.customer?.phone || invoice.customerPhone;
      const customerEmail = invoice.customer?.email || invoice.customerEmail;
      const customerAddress = invoice.customer?.address || invoice.customerAddress;

      if (customerName && customerPhone && customerEmail) {
        const clientId = customerId || `INV-${customerName.replace(/\s+/g, '-').toLowerCase()}-${customerPhone.replace(/\D/g, '')}`;
        
        if (!clientMap.has(clientId)) {
          clientMap.set(clientId, {
            id: clientId,
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            address: customerAddress || "",
            createdAt: invoice.date || invoice.issuedDate || new Date().toISOString(),
            updatedAt: invoice.date || invoice.issuedDate || new Date().toISOString(),
            source: 'invoice'
          });
        }
      }
    });

    return Array.from(clientMap.values());
  }, []);

  // Extract clients from draft data
  const extractClientsFromDraft = useCallback((draft: DraftData): Client | null => {
    if (!draft.customerName || !draft.customerPhone || !draft.customerEmail) {
      return null;
    }

    const clientId = draft.customerId || `DRAFT-${draft.customerName.replace(/\s+/g, '-').toLowerCase()}-${draft.customerPhone.replace(/\D/g, '')}`;
    
    return {
      id: clientId,
      name: draft.customerName,
      phone: draft.customerPhone,
      email: draft.customerEmail,
      address: draft.customerAddress || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'draft'
    };
  }, []);

  // Sync clients from invoice and draft data
  const syncClientsFromInvoices = useCallback(async () => {
    setSyncing(true);
    try {
      // Load invoices
      const storedInvoices = localStorage.getItem(INVOICES_KEY);
      const invoicesData: InvoiceData[] = storedInvoices ? JSON.parse(storedInvoices) : [];
      
      // Load draft
      const storedDraft = localStorage.getItem(DRAFT_KEY);
      const draftData: DraftData = storedDraft ? JSON.parse(storedDraft) : {};
      
      // Extract clients from invoices
      const invoiceClients = extractClientsFromInvoices(invoicesData);
      
      // Extract client from draft
      const draftClient = extractClientsFromDraft(draftData);
      
      // Get existing manually added clients
      const existingClients = clients.filter(c => c.source === 'manual');
      
      // Combine all clients
      let allClients = [...existingClients, ...invoiceClients];
      
      // Add draft client if not already present
      if (draftClient) {
        const exists = allClients.some(c => 
          c.email === draftClient.email || 
          (c.name === draftClient.name && c.phone === draftClient.phone)
        );
        if (!exists) {
          allClients.push(draftClient);
        }
      }
      
      // Remove duplicates (keep the most recent)
      const uniqueClients = allClients.reduce((acc: Client[], client) => {
        const existingIndex = acc.findIndex(c => 
          c.email === client.email || 
          (c.name === client.name && c.phone === client.phone)
        );
        
        if (existingIndex === -1) {
          acc.push(client);
        } else {
          // Update if this version is more recent
          if (new Date(client.updatedAt) > new Date(acc[existingIndex].updatedAt)) {
            acc[existingIndex] = { ...acc[existingIndex], ...client };
          }
        }
        return acc;
      }, []);
      
      setClients(uniqueClients);
      setInvoices(invoicesData);
      
      // Save to localStorage
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(uniqueClients));
    } catch (err) {
      console.error("Failed to sync clients from invoices", err);
    } finally {
      setSyncing(false);
    }
  }, [clients, extractClientsFromInvoices, extractClientsFromDraft]);

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load clients
      const storedClients = localStorage.getItem(CLIENTS_KEY);
      if (storedClients) {
        const parsedClients: Client[] = JSON.parse(storedClients);
        setClients(parsedClients);
      }

      // Load invoices
      const storedInvoices = localStorage.getItem(INVOICES_KEY);
      if (storedInvoices) {
        const parsedInvoices: InvoiceData[] = JSON.parse(storedInvoices);
        setInvoices(parsedInvoices);
      }
    } catch (err) {
      console.error("Failed to load data from localStorage", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm) ||
      (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [clients, searchTerm]);

  // Get client statistics
  const getClientStats = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return { totalInvoices: 0, totalRevenue: 0, paidInvoices: 0, pendingInvoices: 0, overdueInvoices: 0 };

    const clientInvoices = invoices.filter(inv => {
      const invCustomerName = inv.customer?.name || inv.customerName;
      const invCustomerEmail = inv.customer?.email || inv.customerEmail;
      const invCustomerPhone = inv.customer?.phone || inv.customerPhone;
      
      return invCustomerName === client.name || 
             invCustomerEmail === client.email || 
             invCustomerPhone === client.phone;
    });

    const totalInvoices = clientInvoices.length;
    const totalRevenue = clientInvoices.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
    const paidInvoices = clientInvoices.filter(inv => inv.status === "Paid").length;
    const pendingInvoices = clientInvoices.filter(inv => inv.status === "Pending").length;
    const overdueInvoices = clientInvoices.filter(inv => inv.status === "Overdue").length;

    return {
      totalInvoices,
      totalRevenue,
      paidInvoices,
      pendingInvoices,
      overdueInvoices
    };
  }, [invoices, clients]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Validate phone (basic validation)
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      alert("Please enter a valid phone number");
      return;
    }

    try {
      if (editingClient) {
        // Update existing client
        const updatedClients = clients.map(client =>
          client.id === editingClient.id
            ? {
                ...client,
                ...formData,
                updatedAt: new Date().toISOString()
              }
            : client
        );
        setClients(updatedClients);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
      } else {
        // Add new client
        const newClient: Client = {
          id: `MANUAL-${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'manual'
        };
        const updatedClients = [...clients, newClient];
        setClients(updatedClients);
        localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
      }

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        company: "",
        notes: ""
      });
      setEditingClient(null);
      setShowForm(false);
    } catch (err) {
      console.error("Failed to save client", err);
      alert("Failed to save client. Please try again.");
    }
  }, [formData, editingClient, clients]);

  // Handle edit
  const handleEdit = useCallback((client: Client) => {
    // Only allow editing of manually added clients
    if (client.source !== 'manual') {
      alert("This client was imported from invoice data and cannot be edited here. Please update the information in the invoice.");
      return;
    }
    
    setEditingClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
      company: client.company || "",
      notes: client.notes || ""
    });
    setShowForm(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Only allow deletion of manually added clients
    if (client.source !== 'manual') {
      alert("This client was imported from invoice data and cannot be deleted here.");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    try {
      const updatedClients = clients.filter(c => c.id !== clientId);
      setClients(updatedClients);
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
      
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
    } catch (err) {
      console.error("Failed to delete client", err);
      alert("Failed to delete client. Please try again.");
    }
  }, [clients, selectedClient]);

  // Handle view client details
  const handleViewClient = useCallback((client: Client) => {
    setSelectedClient(client);
  }, []);

  // Get client invoices
  const getClientInvoices = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return [];
    
    return invoices.filter(inv => {
      const invCustomerName = inv.customer?.name || inv.customerName;
      const invCustomerEmail = inv.customer?.email || inv.customerEmail;
      const invCustomerPhone = inv.customer?.phone || inv.customerPhone;
      
      return invCustomerName === client.name || 
             invCustomerEmail === client.email || 
             invCustomerPhone === client.phone;
    });
  }, [invoices, clients]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading clients...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600">Manage your customers - automatically synced from invoices</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <button
              onClick={syncClientsFromInvoices}
              disabled={syncing}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={syncing ? "animate-spin" : ""} /> 
              {syncing ? "Syncing..." : "Sync from Invoices"}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FaPlus /> Add New Client
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Info:</strong> Clients are automatically imported from your invoices and drafts. 
            Manually added clients can be edited or deleted. Invoice-derived clients are read-only.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name, email, phone, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Client Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingClient ? "Edit Client" : "Add New Client"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingClient(null);
                    setFormData({
                      name: "",
                      phone: "",
                      email: "",
                      address: "",
                      company: "",
                      notes: ""
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FaSave /> {editingClient ? "Update" : "Save"} Client
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClient(null);
                      setFormData({
                        name: "",
                        phone: "",
                        email: "",
                        address: "",
                        company: "",
                        notes: ""
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Client Details Modal */}
        {selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Client Details</h2>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Information */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FaUser /> Contact Information
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedClient.source === 'manual' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedClient.source === 'manual' ? 'Manual' : 'From Invoice'}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium">{selectedClient.name}</p>
                      </div>
                      {selectedClient.company && (
                        <div>
                          <p className="text-sm text-gray-600">Company</p>
                          <p className="font-medium flex items-center gap-2">
                            <FaBuilding className="text-gray-400" />
                            {selectedClient.company}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium flex items-center gap-2">
                          <FaPhone className="text-gray-400" />
                          {selectedClient.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium flex items-center gap-2">
                          <FaEnvelope className="text-gray-400" />
                          {selectedClient.email}
                        </p>
                      </div>
                      {selectedClient.address && (
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium flex items-start gap-2">
                            <FaMapMarkerAlt className="text-gray-400 mt-1" />
                            {selectedClient.address}
                          </p>
                        </div>
                      )}
                      {selectedClient.notes && (
                        <div>
                          <p className="text-sm text-gray-600">Notes</p>
                          <p className="font-medium">{selectedClient.notes}</p>
                        </div>
                      )}
                    </div>

                    {selectedClient.source === 'manual' && (
                      <div className="mt-6 flex gap-2">
                        <button
                          onClick={() => handleEdit(selectedClient)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(selectedClient.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Statistics and Invoices */}
                <div className="lg:col-span-2">
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FaFileInvoice /> Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-600">Total Invoices</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {getClientStats(selectedClient.id).totalInvoices}
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-600">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-900">
                          Ksh {getClientStats(selectedClient.id).totalRevenue.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-sm text-yellow-600">Pending</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {getClientStats(selectedClient.id).pendingInvoices}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-600">Overdue</p>
                        <p className="text-2xl font-bold text-red-900">
                          {getClientStats(selectedClient.id).overdueInvoices}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-4">Recent Invoices</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Invoice ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Total
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getClientInvoices(selectedClient.id).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                No invoices found for this client
                              </td>
                            </tr>
                          ) : (
                            getClientInvoices(selectedClient.id).map((invoice) => (
                              <tr key={invoice.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {invoice.id}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {invoice.issuedDate || invoice.date 
                                    ? new Date(invoice.issuedDate || invoice.date!).toLocaleDateString()
                                    : "N/A"
                                  }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  Ksh {(invoice.grandTotal || invoice.total || 0).toLocaleString()}
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
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clients List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Clients ({filteredClients.length})</h2>
          </div>
          
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <FaUser className="mx-auto text-4xl text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm ? "No clients found matching your search" : "No clients yet. Create some invoices or add clients manually."}
              </p>
              {!searchTerm && (
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={syncClientsFromInvoices}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Sync from Invoices
                  </button>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Client Manually
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Invoices
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => {
                    const stats = getClientStats(client.id);
                    return (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            {client.company && (
                              <p className="text-sm text-gray-500">{client.company}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="flex items-center gap-2 text-gray-900">
                              <FaPhone className="text-gray-400" />
                              {client.phone}
                            </p>
                            <p className="flex items-center gap-2 text-gray-900">
                              <FaEnvelope className="text-gray-400" />
                              {client.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            client.source === 'manual' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {client.source === 'manual' ? 'Manual' : 'Invoice'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <p className="font-medium">{stats.totalInvoices}</p>
                            <p className="text-gray-500">
                              {stats.paidInvoices} paid, {stats.pendingInvoices} pending
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium">Ksh {stats.totalRevenue.toLocaleString()}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewClient(client)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                            {client.source === 'manual' && (
                              <>
                                <button
                                  onClick={() => handleEdit(client)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Edit Client"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDelete(client.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Client"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </div>
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

export default Clients;