import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, CheckCircle, Wifi, WifiOff, Wrench, FileText, FileX, Loader2, Banknote, CircleSlash } from "lucide-react";
import { motion } from "framer-motion";

const connectivityOptions = [
  { key: "online", label: "Online", icon: Wifi, color: "border-emerald-500 bg-emerald-500 text-white" },
  { key: "offline", label: "Offline", icon: WifiOff, color: "border-slate-600 bg-slate-600 text-white" },
  { key: "maintenance", label: "Manutenção", icon: Wrench, color: "border-amber-500 bg-amber-500 text-white" },
];

export default function ReportATM() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const atmId = urlParams.get("id");

  const { data: atm } = useQuery({
    queryKey: ["atm", atmId],
    queryFn: async () => {
      const list = await base44.entities.ATM.filter({ id: atmId });
      return list[0];
    },
    enabled: !!atmId,
  });

  const [connectivity, setConnectivity] = useState(null);
  const [hasMoney, setHasMoney] = useState(null);
  const [hasPaper, setHasPaper] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (atm) {
      setConnectivity(atm.is_online || "online");
      setHasPaper(atm.has_paper !== undefined ? atm.has_paper : true);
      setHasMoney(atm.status === "has_money" ? true : atm.status === "no_money" ? false : true);
    }
  }, [atm]);

  const handleConnectivityChange = (key) => {
    setConnectivity(key);
    if (key === "offline" || key === "maintenance") {
      setHasMoney(false);
      setHasPaper(false);
    } else if (key === "online") {
      setHasMoney(true);
      setHasPaper(true);
    }
  };

  const reportMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      const finalStatus = hasMoney ? "has_money" : "no_money";
      await base44.entities.Report.create({
        atm_id: atmId,
        status_reported: finalStatus,
        reporter_reputation: user?.reputation_score || 50,
      });
      await base44.entities.ATM.update(atmId, {
        status: finalStatus,
        is_online: connectivity,
        has_paper: hasPaper,
        last_report_time: new Date().toISOString(),
        recent_reports_count: (atm?.recent_reports_count || 0) + 1,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["atms"] });
      queryClient.invalidateQueries({ queryKey: ["atm", atmId] });
      queryClient.invalidateQueries({ queryKey: ["reports", atmId] });
      setTimeout(() => {
        navigate(createPageUrl("ATMDetail") + `?id=${atmId}`);
      }, 1800);
    },
  });

  const isOffMode = connectivity === "offline" || connectivity === "maintenance";
  const canSubmit = connectivity !== null && hasMoney !== null && hasPaper !== null;

  if (submitted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-[#0F1B2D] mb-2">Report enviado</h2>
          <p className="text-sm text-slate-500">Obrigado por ajudar a comunidade.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFC] overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-xl font-bold text-[#0F1B2D] mt-4">
          {atm ? atm.bank_name : "Atualizar ATM"}
        </h1>
        {atm?.location_name && (
          <p className="text-sm text-slate-500 mt-0.5">{atm.location_name}</p>
        )}
      </div>

      <div className="flex-1 px-5 pb-8 space-y-6 mt-2">
        {/* Connectivity */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Ligação</p>
          <div className="grid grid-cols-3 gap-2">
            {connectivityOptions.map((o) => {
              const Icon = o.icon;
              const selected = connectivity === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => handleConnectivityChange(o.key)}
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

        {/* Money */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Dinheiro</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHasMoney(true)}
              className={`flex items-center gap-2 py-3.5 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                hasMoney === true
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isOffMode
                  ? "border-red-200 bg-red-50 text-red-300"
                  : "border-slate-200 text-slate-500 bg-white"
              }`}
            >
              <Banknote className="w-4 h-4" />
              Tem dinheiro
            </button>
            <button
              onClick={() => setHasMoney(false)}
              className={`flex items-center gap-2 py-3.5 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                hasMoney === false
                  ? "border-red-500 bg-red-500 text-white"
                  : isOffMode
                  ? "border-red-300 bg-red-50 text-red-400"
                  : "border-slate-200 text-slate-500 bg-white"
              }`}
            >
              <CircleSlash className="w-4 h-4" />
              Sem dinheiro
            </button>
          </div>
        </div>

        {/* Paper */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Papel (recibo)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setHasPaper(true)}
              className={`flex items-center gap-2 py-3.5 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                hasPaper === true
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : isOffMode
                  ? "border-red-200 bg-red-50 text-red-300"
                  : "border-slate-200 text-slate-500 bg-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              Com papel
            </button>
            <button
              onClick={() => setHasPaper(false)}
              className={`flex items-center gap-2 py-3.5 px-4 rounded-xl border-2 transition-all font-semibold text-sm ${
                hasPaper === false
                  ? "border-red-500 bg-red-500 text-white"
                  : isOffMode
                  ? "border-red-300 bg-red-50 text-red-400"
                  : "border-slate-200 text-slate-500 bg-white"
              }`}
            >
              <FileX className="w-4 h-4" />
              Sem papel
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={() => reportMutation.mutate()}
          disabled={reportMutation.isPending || !canSubmit}
          className="w-full bg-[#0F1B2D] text-white font-semibold py-4 rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 transition-colors hover:bg-[#1A2D47]"
        >
          {reportMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Enviar report"
          )}
        </button>
      </div>
    </div>
  );
}