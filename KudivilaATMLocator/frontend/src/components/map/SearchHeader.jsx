import React, { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X, Star, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const filters = [
  { key: "all", label: "Todos os ATMs", icon: null },
  { key: "has_money", label: "Com dinheiro", icon: CheckCircle, color: "text-emerald-500" },
  { key: "no_money", label: "Sem dinheiro", icon: XCircle, color: "text-red-500" },
  { key: "uncertain", label: "Incerto", icon: HelpCircle, color: "text-amber-500" },
  { key: "favorites", label: "Favoritos", icon: Star, color: "text-yellow-500" },
];

export default function SearchHeader({ searchQuery, setSearchQuery, activeFilter, setActiveFilter }) {
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFilters(false);
      }
    };
    if (showFilters) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  const activeFilterObj = filters.find((f) => f.key === activeFilter) || filters[0];

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto" ref={dropdownRef}>
        {/* Search bar */}
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-2 px-4 py-3">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Procurar ATM, banco ou localização"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-[#0F1B2D] placeholder:text-slate-400 outline-none bg-transparent"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery("")} className="p-0.5">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          ) : null}
          <div className="w-px h-5 bg-slate-200" />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors text-xs font-medium ${
              activeFilter !== "all" ? "bg-[#10B981] text-white" : showFilters ? "bg-slate-100 text-slate-700" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilter !== "all" && <span>{activeFilterObj.label}</span>}
          </button>
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              className="mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
            >
              {filters.map((f, i) => {
                const Icon = f.icon;
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => { setActiveFilter(f.key); setShowFilters(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${
                      isActive ? "bg-[#10B981]/10 text-[#10B981]" : "text-slate-700 hover:bg-slate-50"
                    } ${i !== 0 ? "border-t border-slate-50" : ""}`}
                  >
                    {Icon ? (
                      <Icon className={`w-4 h-4 ${isActive ? "text-[#10B981]" : f.color}`} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                    )}
                    {f.label}
                    {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-[#10B981]" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}