import { NavLink } from "react-router-dom";
import { FiHome, FiFileText, FiUsers, FiSettings, FiPackage, FiBarChart2, FiX, FiLogOut } from "react-icons/fi";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  // Import images to ensure they work in production/build
  const logoUrl = new URL('../assets/logo.jpg', import.meta.url).href;
  const avatarUrl = new URL('../assets/avatar_new.jpg', import.meta.url).href;

  // Permissions Helper
  const isAllowed = (path: string) => {
    // If no permissions defined, allow all (Admin/CEO)
    if (!user?.permissions) return true;
    return user.permissions.includes(path);
  };

  const getLinkClasses = (path: string, isActive: boolean) => {
    const allowed = isAllowed(path);
    const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden";

    if (!allowed) {
      return `${baseClasses} opacity-30 cursor-not-allowed grayscale pointer-events-none`;
    }

    if (isActive) {
      return `${baseClasses} bg-brand-600 dark:bg-midnight-accent text-white shadow-lg shadow-brand-900/20 dark:shadow-red-900/20 translate-x-1`;
    }

    return `${baseClasses} text-slate-400 dark:text-midnight-text-secondary hover:bg-slate-800 dark:hover:bg-midnight-800 hover:text-white`;
  };

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
            src={logoUrl}
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
            title="Go to Dashboard"
            className={({ isActive }) => getLinkClasses('/', isActive)}
          >
            <FiHome className="group-hover:scale-110 transition-transform" /> Dashboard
          </NavLink>

          <NavLink
            to="/new-invoice"
            onClick={isMobile ? onClose : undefined}
            title="Create a new Order or Invoice"
            className={({ isActive }) => getLinkClasses('/new-invoice', isActive)}
          >
            <FiFileText className="group-hover:scale-110 transition-transform" /> New Order
          </NavLink>

          <NavLink
            to="/invoices"
            onClick={isMobile ? onClose : undefined}
            title="View all Orders and Invoices"
            className={({ isActive }) => getLinkClasses('/invoices', isActive)}
          >
            <FiBarChart2 className="group-hover:scale-110 transition-transform" /> All Orders
          </NavLink>

          <NavLink
            to="/clients"
            onClick={isMobile ? onClose : undefined}
            title="Manage Clients database"
            className={({ isActive }) => getLinkClasses('/clients', isActive)}
          >
            <FiUsers className="group-hover:scale-110 transition-transform" /> Clients
          </NavLink>

          <NavLink
            to="/stock"
            onClick={isMobile ? onClose : undefined}
            title="Manage Inventory and Services"
            className={({ isActive }) => getLinkClasses('/stock', isActive)}
          >
            <FiPackage className="group-hover:scale-110 transition-transform" /> Stock
          </NavLink>

          <NavLink
            to="/analytics"
            onClick={isMobile ? onClose : undefined}
            title="View Business Analytics"
            className={({ isActive }) => getLinkClasses('/analytics', isActive)}
          >
            <FiBarChart2 className="group-hover:scale-110 transition-transform" /> Analytics
          </NavLink>

          <NavLink
            to="/settings"
            onClick={isMobile ? onClose : undefined}
            title="Configure System Settings"
            className={({ isActive }) => getLinkClasses('/settings', isActive)}
          >
            <FiSettings className="group-hover:rotate-90 transition-transform duration-500" /> Settings
          </NavLink>
        </nav>
      </div>


    </aside>
  );
};

export default Sidebar;
