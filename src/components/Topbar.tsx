import { FiBell, FiUser } from "react-icons/fi";

const Topbar = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 px-8 py-4 flex justify-between items-center transition-all duration-300">
      {/* Search / Context */}
      <div className="flex-1 max-w-lg">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
          <span className="text-brand-500">Business</span> Manager
        </h2>
      </div>

      {/* Right side: Notifications */}
      <div className="flex items-center gap-4">
        <div className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full border border-brand-100">
          Enterprise Plan
        </div>
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-brand-50 hover:text-brand-600 transition-colors duration-200 relative"
          title="Notifications"
        >
          <FiBell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
