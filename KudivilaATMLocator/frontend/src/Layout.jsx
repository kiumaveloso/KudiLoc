import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Map, User } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { name: "Mapa", icon: Map, page: "Home" },
  { name: "Perfil", icon: User, page: "Profile" },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const hideNav = currentPageName === "ATMDetail" || currentPageName === "ReportATM";

  // Dark mode listener
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = (e) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    apply(mq);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <style>{`
        :root {
          --kudi-primary: #10B981;
          --kudi-primary-light: #059669;
          --kudi-green: #22C55E;
          --kudi-red: #EF4444;
          --kudi-yellow: #F59E0B;
          --kudi-bg: #F8FAFC;
        }
      `}</style>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="flex-1 flex flex-col h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      {!hideNav && (
        <nav className="bg-white border-t border-slate-200 px-6 py-2 pb-safe sticky bottom-0 z-50">
          <div className="max-w-lg mx-auto flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-[#10B981]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : ""}`} />
                  <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-[#10B981] mt-0.5" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}