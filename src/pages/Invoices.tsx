// src/pages/Invoices.tsx
// Polished Invoices Page for KONSUT Ltd

import React, { useEffect, useState, useCallback } from "react";
import { FaFilePdf, FaTrash, FaSearch, FaEdit, FaCheck, FaClock } from "react-icons/fa";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import logo from "../assets/logo.jpg"; // Import the logo directly

// Define constants directly in this file to avoid import issues
const INVOICES_KEY = "invoices";
const COMPANY = {
  name: "KONSUT Ltd",
  logoPath: "/src/assets/logo.jpg",
  address1: "P.O BOX 21162-00100",
  address2: "G.P.O NAIROBI",
  phone: "+254 700 420 897",
  email: "info@konsutltd.co.ke",
  pin: "P052435869T",
};

// Define a more flexible interface to handle different data structures
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
  // Support both old and new data structures
  clientName?: string;
  phone?: string;
  email?: string;
  items?: InvoiceLine[];
  subtotal?: number;
  productFreightTotal?: number;
  grandTotal?: number;
  total?: number; // For backward compatibility
  freightRate?: number;
  currencyRate?: number;
  status: "Paid" | "Pending" | "Overdue";
}

// Utility function to convert image to data URL
const getImageDataUrl = (img: HTMLImageElement): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx?.drawImage(img, 0, 0);
    resolve(canvas.toDataURL("image/jpeg"));
  });
};

// Simple PDF generation function with logo
const generatePDF = async (invoice: InvoiceData) => {
  try {
    console.log("Generating PDF for invoice:", invoice.id);
    
    // Use the imported jsPDF directly
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Load and add logo
    const logoImg = new Image();
    logoImg.src = logo;
    
    // Wait for logo to load
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });

    const logoDataUrl = await getImageDataUrl(logoImg);
    
    // Add logo to the top right
    const logoWidth = 40; // Width in mm
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth; // Maintain aspect ratio
    doc.addImage(logoDataUrl, "JPEG", pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);

    // Header (company info on the left)
    let y = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(COMPANY.name, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y += 7;
    doc.text(COMPANY.address1, margin, y);
    y += 5;
    doc.text(COMPANY.address2, margin, y);
    y += 5;
    doc.text(`Phone: ${COMPANY.phone}`, margin, y);
    y += 5;
    doc.text(`Email: ${COMPANY.email}`, margin, y);
    y += 5;
    doc.text(`PIN: ${COMPANY.pin}`, margin, y);

    // Title centered
    y = Math.max(y, margin + logoHeight + 10); // Ensure we're below the logo
    doc.setFontSize(20);
    doc.setTextColor(0, 127, 255);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", pageWidth / 2, y + 10, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Customer & meta area
    const cursorY = y + 22;
    const leftX = margin;
    const rightX = pageWidth / 2 + 8;

    // Handle different data structures with safe access
    const customerName = invoice?.customer?.name || invoice?.clientName || "N/A";
    const customerId = invoice?.customer?.id || "N/A";
    const customerPhone = invoice?.customer?.phone || invoice?.phone || "N/A";
    const customerEmail = invoice?.customer?.email || invoice?.email || "N/A";
    const customerAddress = invoice?.customer?.address || "N/A";
    const issuedDate = invoice?.issuedDate || invoice?.date || "N/A";
    const dueDate = invoice?.dueDate || "N/A";
    const total = invoice?.grandTotal || invoice?.total || 0;

    // Draw a line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY - 5, pageWidth - margin, cursorY - 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Bill To:", leftX, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Customer ID: ${customerId}`, leftX, cursorY + 7);
    doc.text(`Name: ${customerName}`, leftX, cursorY + 14);
    doc.text(`Phone: ${customerPhone}`, leftX, cursorY + 21);
    doc.text(`Email: ${customerEmail}`, leftX, cursorY + 28);
    doc.text(`Address: ${customerAddress}`, leftX, cursorY + 35);

    // Meta: invoice no, issued date, delivery
    doc.setFont("helvetica", "bold");
    doc.text("Invoice No:", rightX, cursorY);
    doc.setFont("helvetica", "normal");
    doc.text(invoice?.id || "N/A", rightX + 30, cursorY);
    doc.setFont("helvetica", "bold");
    doc.text("Issued on:", rightX, cursorY + 7);
    doc.setFont("helvetica", "normal");
    doc.text(issuedDate, rightX + 30, cursorY + 7);
    doc.setFont("helvetica", "bold");
    doc.text("Deadline Date:", rightX, cursorY + 14);
    doc.setFont("helvetica", "normal");
    doc.text(dueDate, rightX + 30, cursorY + 14);
    doc.setFont("helvetica", "bold");
    doc.text("Status:", rightX, cursorY + 21);
    doc.setFont("helvetica", "normal");
    
    // Add status with color
    if (invoice?.status === "Paid") {
      doc.setTextColor(0, 128, 0);
    } else if (invoice?.status === "Overdue") {
      doc.setTextColor(255, 0, 0);
    } else {
      doc.setTextColor(255, 165, 0);
    }
    doc.text(invoice?.status || "N/A", rightX + 30, cursorY + 21);
    doc.setTextColor(0, 0, 0);

    // Build table data
    const items = invoice?.items || [];
    if (items.length === 0) {
      // Add a simple text line if no items
      doc.setFont("helvetica", "italic");
      doc.text("No items found in this invoice", margin, cursorY + 55);
    } else {
      // Check if autoTable is available
      if (typeof (doc as any).autoTable !== "function") {
        console.error("autoTable is not available");
        // Fallback to manual table creation
        let tableY = cursorY + 50;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("Item", margin, tableY);
        doc.text("Qty", margin + 60, tableY);
        doc.text("Price", margin + 80, tableY);
        doc.text("Total", margin + 120, tableY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        items.forEach((item, index) => {
          tableY += 8;
          doc.text(item?.name || "N/A", margin, tableY);
          doc.text(String(item?.quantity || 0), margin + 60, tableY);
          doc.text(`Ksh ${item?.unitPrice || 0}`, margin + 80, tableY);
          doc.text(`Ksh ${(item?.unitPrice || 0) * (item?.quantity || 0)}`, margin + 120, tableY);
        });
      } else {
        const includeFreightCol = invoice?.productFreightTotal && invoice.productFreightTotal > 0;

        const head: string[] = [
          "Item",
          "Category",
          "Qty",
          "Unit Price (Ksh)",
          "Total (Ksh)",
          ...(includeFreightCol ? ["Freight (Ksh)"] : []),
        ];

        const body = items.map((l) => [
          l?.name || "N/A",
          l?.category || "N/A",
          String(l?.quantity || 0),
          (l?.unitPrice || 0).toFixed(2),
          ((l?.unitPrice || 0) * (l?.quantity || 0)).toFixed(2),
          ...(includeFreightCol ? [(l?.productFreight || 0).toFixed(2)] : []),
        ]);

        (doc as any).autoTable({
          startY: cursorY + 45,
          head: [head],
          body,
          theme: "grid",
          headStyles: { 
            fillColor: [0, 127, 255],
            textColor: 255,
            fontStyle: "bold"
          },
          styles: { 
            fontSize: 10, 
            cellPadding: 4,
            lineColor: [200, 200, 200]
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          margin: { left: margin, right: margin },
        });
      }
    }

    // Totals after table
    const afterTableY = (doc as any).lastAutoTable?.finalY || cursorY + 120;
    let ty = afterTableY + 15;
    const totalsX = pageWidth - margin - 80;

    // Draw a line before totals
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, ty - 5, pageWidth - margin, ty - 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Subtotal:`, totalsX, ty);
    doc.text(`Ksh ${(invoice?.subtotal || 0).toFixed(2)}`, pageWidth - margin, ty, { align: "right" });
    ty += 8;
    doc.text(`Product Freight:`, totalsX, ty);
    doc.text(`Ksh ${(invoice?.productFreightTotal || 0).toFixed(2)}`, pageWidth - margin, ty, { align: "right" });
    ty += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`Grand Total:`, totalsX, ty);
    doc.text(`Ksh ${total.toFixed(2)}`, pageWidth - margin, ty, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Payment details (left)
    const py = ty + 20;
    const px = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Payment Details", px, py);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    let pyy = py + 8;
    doc.text("Bank: I&M BANK", px, pyy); pyy += 6;
    doc.text("Bank Branch: RUIRU BRANCH", px, pyy); pyy += 6;
    doc.text("Account No.(USD): 05507023231250", px, pyy); pyy += 6;
    doc.text("SWIFT CODE: IMBLKENA", px, pyy); pyy += 6;
    doc.text("BANK CODE: 57", px, pyy); pyy += 6;
    doc.text("BRANCH CODE: 055", px, pyy);

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    const footerLine =
      "If you have any questions about this invoice, please contact: Tel: +254 700 420 897 | Email: info@konsutltd.co.ke | Ruiru, Kenya";
    doc.text(footerLine, margin, footerY, { maxWidth: doc.internal.pageSize.getWidth() - margin * 2, align: "center" });

    // Page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: "right" });
    }

    // Save PDF
    doc.save(`${COMPANY.name}_Invoice_${invoice?.id}_${Date.now()}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF generation failed:", err);
    alert("PDF generation failed. See console for details.");
    return false;
  }
};

// Error boundary component
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
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load invoices from localStorage
  const loadInvoices = useCallback(() => {
    try {
      console.log("Loading invoices from localStorage...");
      setLoading(true);
      setError(null);
      
      const raw = localStorage.getItem(INVOICES_KEY);
      console.log("Raw data from localStorage:", raw);
      
      if (!raw) {
        console.log("No invoices found in localStorage");
        setInvoices([]);
        return;
      }
      
      const parsed = JSON.parse(raw);
      console.log("Parsed invoices:", parsed);
      
      // Ensure we have an array
      if (!Array.isArray(parsed)) {
        console.warn("Invoices data is not an array:", parsed);
        setInvoices([]);
        return;
      }
      
      // Validate and normalize each invoice
      const normalizedInvoices = parsed.map((inv, index) => {
        try {
          // Ensure invoice is an object
          if (!inv || typeof inv !== 'object') {
            console.warn(`Invoice at index ${index} is not an object:`, inv);
            return null;
          }
          
          // Ensure required fields exist
          if (!inv.id) {
            console.warn(`Invoice at index ${index} missing id, generating one`);
            inv.id = `INV-${Date.now()}-${index}`;
          }
          
          // Ensure status is valid
          if (!inv.status || !["Paid", "Pending", "Overdue"].includes(inv.status)) {
            console.warn(`Invoice ${inv.id} has invalid status, setting to Pending`);
            inv.status = "Pending";
          }
          
          // Ensure customer object exists
          if (!inv.customer) {
            inv.customer = {};
          }
          
          // Ensure items array exists
          if (!inv.items || !Array.isArray(inv.items)) {
            inv.items = [];
          }
          
          return inv as InvoiceData;
        } catch (err) {
          console.error(`Error normalizing invoice at index ${index}:`, err);
          return null;
        }
      }).filter(Boolean) as InvoiceData[];
      
      console.log("Normalized invoices:", normalizedInvoices);
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

  // Fixed the filtered array with proper null checking
  const filtered = invoices.filter(
    (inv) => {
      // Ensure inv exists and has the required properties
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
      case "Paid": return "text-green-600 bg-green-100";
      case "Pending": return "text-yellow-600 bg-yellow-100";
      case "Overdue": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  // Check for overdue invoices and update their status
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#007FFF" }}>
            {COMPANY.name} - Invoices
          </h1>

          <div className="bg-white p-4 rounded shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search by client name or invoice ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Due</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total (Ksh)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {inv?.id || "N/A"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">{customerName}</div>
                              <div className="text-gray-500 sm:hidden">{issuedDate}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                            {issuedDate}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            {dueDate}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {total.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {editingStatus === inv?.id ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => updateInvoiceStatus(inv?.id || "", "Paid")}
                                  className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 hover:bg-green-200"
                                >
                                  <FaCheck /> Paid
                                </button>
                                <button
                                  onClick={() => updateInvoiceStatus(inv?.id || "", "Pending")}
                                  className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                >
                                  <FaClock /> Pending
                                </button>
                                <button
                                  onClick={() => setEditingStatus(null)}
                                  className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 hover:bg-gray-200"
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
                            <div className="flex gap-2">
                              <button
                                onClick={() => generatePDF(inv)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Download PDF"
                              >
                                <FaFilePdf />
                              </button>
                              <button
                                onClick={() => setEditingStatus(inv?.id || null)}
                                className="text-green-600 hover:text-green-900"
                                title="Update Status"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteInvoice(inv?.id || "")}
                                className="text-red-600 hover:text-red-900"
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