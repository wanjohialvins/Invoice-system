import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewInvoice from "./pages/NewInvoice";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import Stock from "./pages/Stock";
import Analytics from "./pages/Analytics";
import { useTheme } from "./hooks/useTheme";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";

import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Main App Component
 * Initializes theme, provides global context (Toast, Error, Auth)
 * and sets up routing for all pages
 */
const App = () => {
  // Initialize theme on app load (reads from localStorage)
  useTheme();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="new-invoice" element={<NewInvoice />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="clients" element={<Clients />} />
                <Route path="stock" element={<Stock />} />
                <Route path="settings" element={<Settings />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;


