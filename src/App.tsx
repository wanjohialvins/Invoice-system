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

const App = () => {
  // Initialize theme on app load
  useTheme();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
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
  );
};

export default App;


