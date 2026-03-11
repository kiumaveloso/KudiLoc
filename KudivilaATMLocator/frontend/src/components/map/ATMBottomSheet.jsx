import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, XCircle, Wifi, WifiOff, Wrench, FileText, FileX, Loader2, ChevronRight, Navigation, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";

const moneyOptions = [
  { key: "has_money", label: "Tem dinheiro", icon: CheckCircle, color: "bg-emerald-500 text-white border-emerald-500" },
  { key: "no_money", label: "Sem dinheiro", icon: XCircle, color: "bg-red-500 text-white border-red-500" },
];

const connectivityOptions = [
  { key: "online", label: "Online", icon: Wifi, color: "bg-emerald-500 text-white border-emerald-500" },
  { key: "offline", label: "Offline", icon: WifiOff, color: "bg-slate-500 text-white border-slate-500" },
  { key: "maintenance", label: "Manutenção", icon: Wrench, color: "bg-amber-500 text-white border-amber-500" },
];

const paperOptions = [
  { key: true, label: "Com papel", icon: FileText, color: "bg-emerald-500 text-white border-emerald-500" },
  { key: false, label: "Sem papel", icon: FileX, color: "bg-red-500 text-white border-red-500" },
];

export default function ATMBottomSheet({ atm, onClose }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [moneyStatus, setMoneyStatus] = useState(atm.status === "uncertain" ? null : atm.status);
  const [connectivity, setConnectivity] = useState(atm.is_online || "online");
  const [hasPaper, setHasPaper] = useState(atm.has_paper !== undefined ? atm.has_paper : true);
  const [submitted, setSubmitted] = useState(false);

  // Favorites stored in localStorage
  const favKey = "kudi_favorites";
  const getFavs = () => { try { return JSON.parse(localStorage.getItem(favKey) || "[]"); } catch { return []; } };
  const [isFav, setIsFav] = useState(() => getFavs().includes(atm.id));
  const toggleFav = () => {
    const favs = getFavs();
    const updated = isFav ? favs.filter((id) => id !== atm.id) : [...favs, atm.id];
    localStorage.setItem(favKey, JSON.stringify(updated));
    setIsFav(!isFav);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const finalStatus = moneyStatus || "uncertain";
      await base44.entities.Report.create({
        atm_id: atm.id,
        status_reported: finalStatus === "uncertain" ? "has_money" : finalStatus,
        reporter_reputation: user?.reputation_score || 50,
      });
      await base44.entities.ATM.update(atm.id, {
        status: finalStatus,
        is_online: connectivity,
        has_paper: hasPaper,
        last_report_time: new Date().toISOString(),
        recent_reports_count: (atm.recent_reports_count || 0) + 1,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["atms"] });
      setTimeout(onClose, 1500);
    },
  });

  const statusColors = { has_money: "text-emerald-600", no_money: "text-red-500", uncertain: "text-amber-500" };
  const statusLabels = { has_money: "Com dinheiro", no_money: "Sem dinheiro", uncertain: "Incerto" };
  const connectDot = { online: "bg-emerald-500", offline: "bg-red-500", maintenance: "bg-amber-400" };
  const connectText = { online: "online", offline: "offline", maintenance: "manutenção" };
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${atm.latitude},${atm.longitude}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-2xl max-h-[88vh] overflow-y-auto"
        >
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-base font-bold text-[#0F1B2D]">Report enviado!</p>
              <p className="text-sm text-slate-400 mt-1">Obrigado pela contribuição.</p>
            </div>
          ) : (
            <div className="p-5">
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

              {/* ATM header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-[#0F1B2D]">{atm.bank_name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{atm.location_name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs font-medium ${statusColors[atm.status]}`}>
                      {statusLabels[atm.status]}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <span className={`w-2 h-2 rounded-full ${connectDot[atm.is_online || "online"]}`} />
                      {connectText[atm.is_online || "online"]}
                    </span>
                    {atm.last_report_time && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{moment(atm.last_report_time).fromNow()}</span>
                      </>
                    )}
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-700 transition-colors ml-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Navigation className="w-3 h-3" />
                      Navegar
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={toggleFav} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <Star className={`w-4 h-4 transition-colors ${isFav ? "fill-yellow-400 text-yellow-400" : "text-slate-400"}`} />
                  </button>
                  <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 mb-5" />

              {/* Money status */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Dinheiro</p>
                <div className="grid grid-cols-2 gap-2">
                  {moneyOptions.map((o) => {
                    const Icon = o.icon;
                    const selected = moneyStatus === o.key;
                    return (
                      <button
                        key={o.key}
                        onClick={() => setMoneyStatus(o.key)}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                          selected ? o.color : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Connectivity */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Ligação</p>
                <div className="grid grid-cols-3 gap-2">
                  {connectivityOptions.map((o) => {
                    const Icon = o.icon;
                    const selected = connectivity === o.key;
                    return (
                      <button
                        key={o.key}
                        onClick={() => {
                          setConnectivity(o.key);
                          if (o.key === "offline" || o.key === "maintenance") {
                            setMoneyStatus("no_money");
                            setHasPaper(false);
                          } else if (o.key === "online") {
                            setMoneyStatus("has_money");
                            setHasPaper(true);
                          }
                        }}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all font-medium text-xs ${
                          selected ? o.color : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paper */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Papel (recibo)</p>
                <div className="grid grid-cols-2 gap-2">
                  {paperOptions.map((o) => {
                    const Icon = o.icon;
                    const selected = hasPaper === o.key;
                    return (
                      <button
                        key={String(o.key)}
                        onClick={() => setHasPaper(o.key)}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                          selected ? o.color : "border-slate-200 text-slate-500 bg-white"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(createPageUrl("ATMDetail") + `?id=${atm.id}`)}
                  className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-sm font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Ver detalhes
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending || !moneyStatus}
                  className="flex items-center justify-center gap-1.5 bg-[#0F1B2D] text-white text-sm font-semibold py-3.5 rounded-xl hover:bg-[#1A2D47] disabled:opacity-50 transition-colors"
                >
                  {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar report"}
                </button>
              </div>
              {!moneyStatus && (
                <p className="text-center text-xs text-slate-400 mt-2">Seleciona o estado do dinheiro para enviar</p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}