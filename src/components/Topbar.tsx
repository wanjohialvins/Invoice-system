import { FiBell, FiUser } from "react-icons/fi";

const Topbar = () => {
  return (
    <header className="bg-white border-b shadow-sm px-6 py-3 flex justify-between items-center z-20">
      {/* App Title */}
      <div className="text-lg font-bold text-gray-800">
        KONSUT Invoice Sys
      </div>

      {/* Right side: Notifications & User */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button
          className="text-gray-600 hover:text-gray-800 transition-colors duration-150"
          title="Notifications"
        >
          <FiBell size={22} />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <FiUser size={20} />
          <span>Eragon Devs</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
