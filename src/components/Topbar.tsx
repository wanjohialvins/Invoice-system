import { FiBell, FiMenu, FiLogOut } from "react-icons/fi";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useAuth } from "../contexts/AuthContext";
import { getCompanySettings } from "../utils/config";

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar = ({ onMenuClick }: TopbarProps) => {
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const avatarUrl = new URL('../assets/avatar_new.jpg', import.meta.url).href;

  return (
    <header className="bg-white/80 dark:bg-midnight-900/80 backdrop-blur-md border-b border-gray-100 dark:border-midnight-700 sticky top-0 z-20 px-4 md:px-8 py-4 flex justify-between items-center transition-all duration-300">
      {/* Left Section: Menu & Logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger Menu for Mobile */}
        {isMobile && (
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <FiMenu size={24} className="text-gray-700 dark:text-midnight-text-primary icon-hover-scale" />
          </button>
        )}

        {/* Title */}
        <div className="flex items-center gap-3">
          <img src={getCompanySettings().logoPath || new URL('../assets/logo.jpg', import.meta.url).href} alt="Logo" className="h-8 w-8 rounded-full object-contain bg-white shadow-sm" />
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-midnight-text-primary">KONSUT</h1>
          <span className="hidden md:inline-block px-3 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-semibold rounded-full">
            Enterprise Plan
          </span>
        </div>
      </div>

      {/* Right Section: Notifications & Profile */}
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors relative">
          <FiBell size={20} className="text-gray-600 dark:text-midnight-text-secondary icon-hover-shake icon-pulse-continuous" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-midnight-700">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name || "Guest User"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.displayRole || user?.role || "Viewer"}</p>
          </div>
          <img
            src={user?.avatar || avatarUrl}
            alt="User"
            className="h-9 w-9 rounded-full border border-gray-200 dark:border-midnight-700 object-contain bg-white"
          />
          <button
            onClick={logout}
            title="Log Out"
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-midnight-800 rounded-lg transition-colors"
          >
            <FiLogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
