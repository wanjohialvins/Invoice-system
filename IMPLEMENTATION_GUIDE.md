/**
 * Example: Invoices Page with All Improvements Applied
 * 
 * This file demonstrates how to integrate all the new improvements:
 * - Mobile card layouts
 * - Empty states
 * - Toast notifications
 * - Debounced search
 * - Loading states
 * - Keyboard shortcuts
 * 
 * Apply these same patterns to other pages (Clients, Stock, etc.)
 */

// Add these imports to Invoices.tsx
import { useToast } from '../contexts/ToastContext';
import { useDebounce, useKeyboardShortcut } from '../hooks/useUtils';
import { EmptyState, LoadingSpinner, Card } from '../components/shared/UIComponents';
import { FaFileInvoice } from 'react-icons/fa';

// In the component, add these hooks:
const { showToast } = useToast();
const debouncedSearch = useDebounce(searchTerm, 300);

// Add keyboard shortcut for new invoice
useKeyboardShortcut('n', () => navigate('/new-invoice'), true);

// Replace the delete function to use toast:
const handleDelete = async (id: string) => {
  if (!window.confirm('Are you sure you want to delete this invoice?')) return;
  
  try {
    const updated = invoices.filter(inv => inv.id !== id);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(updated));
    setInvoices(updated);
    showToast('success', 'Invoice deleted successfully');
  } catch (error) {
    showToast('error', 'Failed to delete invoice');
  }
};

// Replace the PDF generation to use toast:
const handleGeneratePDF = async (invoice: InvoiceData) => {
  try {
    await generateInvoicePDF(invoice, invoice.type);
    showToast('success', 'PDF generated successfully');
  } catch (error) {
    showToast('error', 'Failed to generate PDF');
  }
};

// Add mobile card layout in the render (around line 400+):
{/* Mobile Card Layout */}
<div className="lg:hidden space-y-4">
  {filteredInvoices.map(invoice => (
    <Card key={invoice.id}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{invoice.customer?.name || 'N/A'}</h3>
          <p className="text-sm text-gray-500">{invoice.id}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(invoice.issuedDate || '').toLocaleDateString()}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
          invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
          invoice.status === 'cancelled' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {invoice.status}
        </span>
      </div>
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <span className="text-lg font-bold text-brand-600">
          Ksh {invoice.grandTotal?.toLocaleString() || 0}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handleGeneratePDF(invoice)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Generate PDF"
          >
            <FaFilePdf />
          </button>
          <button
            onClick={() => handleEdit(invoice)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => handleDelete(invoice.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <FaTrash />
          </button>
        </div>
      </div>
    </Card>
  ))}
</div>

{/* Desktop Table Layout - Keep existing table but add hidden lg:block */}
<div className="hidden lg:block overflow-x-auto">
  {/* Existing table code */}
</div>

// Add empty state check before rendering the list:
{loading ? (
  <div className="flex justify-center py-12">
    <LoadingSpinner size="lg" />
  </div>
) : filteredInvoices.length === 0 ? (
  <EmptyState
    icon={FaFileInvoice}
    title={searchTerm ? "No invoices found" : "No invoices yet"}
    description={searchTerm ? 
      "Try adjusting your search or filters" : 
      "Create your first invoice to get started"
    }
    action={!searchTerm ? {
      label: "Create Invoice",
      onClick: () => navigate('/new-invoice')
    } : undefined}
  />
) : (
  <>
    {/* Mobile and Desktop layouts */}
  </>
)}

// Use debounced search for filtering:
const filteredInvoices = useMemo(() => {
  return invoices
    .filter(inv => inv.type === activeTab)
    .filter(inv => {
      if (!debouncedSearch) return true; // Use debouncedSearch instead of searchTerm
      const searchLower = debouncedSearch.toLowerCase();
      return (
        inv.id.toLowerCase().includes(searchLower) ||
        inv.customer?.name?.toLowerCase().includes(searchLower) ||
        inv.customer?.email?.toLowerCase().includes(searchLower)
      );
    })
    .filter(inv => {
      if (statusFilter === 'all') return true;
      return inv.status === statusFilter;
    })
    .sort((a, b) => {
      // Existing sort logic
    });
}, [invoices, activeTab, debouncedSearch, statusFilter, sortConfig]);
