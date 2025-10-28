import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import NewInvoice from "./pages/NewInvoice";
import Invoices from "./pages/Invoices";
import Clients from "./pages/Clients";
import Settings from "./pages/Settings";
import Stock from "./pages/Stock";
import Analytics from "./pages/Analytics"; // ✅ Make sure this file exists

const App = () => {
  return (
    <Router>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <Topbar />

          {/* Page Content */}
          <div className="flex-1 overflow-auto bg-softgray p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new-invoice" element={<NewInvoice />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
};

export default App;
