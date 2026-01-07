import { NavLink } from "react-router-dom";
import { FiHome, FiFileText, FiUsers, FiSettings, FiPackage, FiBarChart2, FiX } from "react-icons/fi";
import { useIsMobile } from "../hooks/useMediaQuery";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isMobile = useIsMobile();

  return (
    <aside
      className={`
        w-64 bg-slate-900 dark:bg-midnight-900 text-white flex flex-col shadow-xl z-30 transition-all duration-300 border-r border-slate-800 dark:border-midnight-700
        ${isMobile
          ? `fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
          : 'relative'
        }
      `}
    >
      <div className="h-28 flex items-center justify-center px-4 border-b border-slate-800 dark:border-midnight-700 bg-slate-950 dark:bg-midnight-950">
        <div className="flex items-center group cursor-pointer hover:scale-105 transition-transform duration-200">
          <img
            src="/src/assets/logo.jpg"
            alt="Konsut Logo"
            className="h-20 w-auto object-contain rounded-md shadow-lg shadow-black/20"
          />
        </div>

        {/* Close button - only visible on mobile */}
        {isMobile && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <FiX size={24} />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">Menu</div>
        <nav className="space-y-1">
          <NavLink
            to="/"
            end
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                ? "bg-brand-600 dark:bg-midnight-accent text-white shadow-lg shadow-brand-900/20 dark:shadow-red-900/20 translate-x-1"
                : "text-slate-400 dark:text-midnight-text-secondary hover:bg-slate-800 dark:hover:bg-midnight-800 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute inset-0 bg-brand-500 dark:bg-midnight-accent opacity-20 animate-pulse"></div>}
                <FiHome className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10">Dashboard</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/new-invoice"
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 dark:bg-midnight-accent text-white shadow-lg shadow-brand-900/20 dark:shadow-red-900/20 translate-x-1"
                : "text-slate-400 dark:text-midnight-text-secondary hover:bg-slate-800 dark:hover:bg-midnight-800 hover:text-white"
              }`
            }
          >
            <FiFileText className="group-hover:rotate-12 transition-transform duration-300" /> New Order
          </NavLink>
          <NavLink
            to="/invoices"
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 dark:bg-midnight-accent text-white shadow-lg shadow-brand-900/20 dark:shadow-red-900/20 translate-x-1"
                : "text-slate-400 dark:text-midnight-text-secondary hover:bg-slate-800 dark:hover:bg-midnight-800 hover:text-white"
              }`
            }
          >
            <FiFileText className="group-hover:translate-x-1 transition-transform duration-300" /> All Orders
          </NavLink>
          <NavLink
            to="/clients"
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 dark:bg-midnight-accent text-white shadow-lg shadow-brand-900/20 dark:shadow-red-900/20 translate-x-1"
                : "text-slate-400 dark:text-midnight-text-secondary hover:bg-slate-800 dark:hover:bg-midnight-800 hover:text-white"
              }`
            }
          >
            <FiUsers className="group-hover:scale-110 transition-transform duration-300" /> Clients
          </NavLink>
          <NavLink
            to="/stock"
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiPackage className="group-hover:rotate-12 transition-transform duration-300" /> Stock
          </NavLink>
          <NavLink
            to="/analytics"
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? "bg-brand-600 text-white shadow-lg shadow-brand-900/20 translate-x-1"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <FiBarChart2 className="group-hover:scale-110 transition-transform duration-300" /> Analytics
          </NavLink>
        </nav>

        <div className="mt-6 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">System</div>
        <nav className="space-y-1">
          <NavLink
            to="/settings"
            onClick={isMobile ? onClose : undefined}
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

      <div className="mt-auto p-4 border-t border-slate-800 dark:border-midnight-700 bg-slate-950/50 dark:bg-midnight-900/50">
        <NavLink
          to="/settings"
          onClick={isMobile ? onClose : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full ${isActive
              ? "bg-slate-800 dark:bg-midnight-800 text-white"
              : "text-slate-400 dark:text-midnight-text-secondary hover:bg-slate-800 dark:hover:bg-midnight-800 hover:text-white"
            }`
          }
        >
          <FiSettings className="group-hover:rotate-90 transition-transform duration-500" />
          <span>Data & Settings</span>
        </NavLink>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-800 dark:border-midnight-700">
          <img
            src="/src/assets/avatar_new.jpg"
            alt="User Avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-brand-500"
          />
          <div>
            <div className="text-sm font-medium text-white dark:text-midnight-text-primary">Eragon Devs</div>
            <div className="text-xs text-slate-500 dark:text-midnight-text-secondary">Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
