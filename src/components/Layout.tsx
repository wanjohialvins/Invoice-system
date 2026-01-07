import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet, useLocation } from "react-router-dom";
import { useIsMobile } from "../hooks/useMediaQuery";
import { AnimatePresence, motion } from "framer-motion";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Melting Transition Variants
  const meltVariants = {
    initial: {
      y: 0,
      scale: 1,
      opacity: 1,
      zIndex: 10, // Ensure entering page is below initially (or managed by order)
      filter: "blur(0px)",
      clipPath: "inset(0 0 0 0)"
    },
    animate: {
      y: 0,
      scale: 1,
      opacity: 1,
      zIndex: 1,
      transition: { duration: 0.8 }
    },
    // The "Melting Away" effect
    exit: {
      y: "100%", // Slide down
      opacity: 0,
      scaleY: 1.2, // Stretch vertically
      filter: "blur(10px)", // Liquid blur
      zIndex: 20, // Keep above the new page
      clipPath: "inset(100% 0 0 0)", // Wipe down
      transition: {
        duration: 1.2,
        ease: [0.43, 0.13, 0.23, 0.96] // Liquid ease
      }
    }
  };

  return (
    <div className="flex bg-softgray dark:bg-midnight-950 min-h-screen transition-colors duration-300 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Backdrop overlay for mobile when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 transition-colors duration-300 relative">
        <Topbar onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden text-slate-900 dark:text-midnight-text-primary relative group">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={location.pathname}
              variants={meltVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full h-full"
            // style={{ position: 'absolute', inset: 0 }} // Optional: absolute positioning for overlap
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
