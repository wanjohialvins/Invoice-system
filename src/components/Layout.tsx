import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "../hooks/useMediaQuery";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex bg-softgray min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Backdrop overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col">
        <Topbar onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
