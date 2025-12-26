import { NavLink } from "react-router-dom";
import { FiHome, FiFileText, FiUsers, FiSettings, FiBox, FiBarChart2 } from "react-icons/fi";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-30 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <div className="w-8 h-8 bg-brand-500 rounded flex items-center justify-center mr-3 shadow-lg shadow-brand-500/30">
          <span className="font-bold text-white text-lg">K</span>
        </div>
        <span className="text-xl font-bold tracking-wide">KONSUT</span>
      </div>

      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">Menu</div>
        <nav className="space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiHome className="group-hover:scale-110 transition-transform" /> Dashboard
          </NavLink>
          <NavLink
            to="/new-invoice"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiFileText className="group-hover:scale-110 transition-transform" /> New Invoice
          </NavLink>
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiFileText className="group-hover:scale-110 transition-transform" /> All Invoices
          </NavLink>
          <NavLink
            to="/clients"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiUsers className="group-hover:scale-110 transition-transform" /> Clients
          </NavLink>
          <NavLink
            to="/stock"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiBox className="group-hover:scale-110 transition-transform" /> Stock
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiBarChart2 className="group-hover:scale-110 transition-transform" /> Analytics
          </NavLink>
        </nav>

        <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">System</div>
        <nav className="space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiSettings className="group-hover:rotate-90 transition-transform duration-500" /> Settings
          </NavLink>
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-brand-600"></div>
          <div>
            <div className="text-sm font-medium text-white">Eragon Devs</div>
            <div className="text-xs text-slate-500">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
