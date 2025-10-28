import { NavLink } from "react-router-dom";
import { FiHome, FiFileText, FiUsers, FiSettings, FiBox, FiBarChart2 } from "react-icons/fi";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 text-2xl font-bold border-b">KONSUT</div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiHome /> Dashboard
        </NavLink>
        <NavLink
          to="/new-invoice"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiFileText /> New Invoice
        </NavLink>
        <NavLink
          to="/invoices"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiFileText /> Invoices
        </NavLink>
        <NavLink
          to="/clients"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiUsers /> Clients
        </NavLink>
        <NavLink
          to="/stock"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiBox /> Stock
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiBarChart2 /> Analytics
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-100 ${
              isActive ? "bg-gray-200 font-semibold" : ""
            }`
          }
        >
          <FiSettings /> Settings
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
