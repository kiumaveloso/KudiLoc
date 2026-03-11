import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Clock, MessageSquare, MapPin, Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import moment from "moment";
import StatusBadge from "@/components/atm/StatusBadge";
import ReliabilityRing from "@/components/atm/ReliabilityRing";
import ReportHistory from "@/components/atm/ReportHistory";

export default function ATMDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const atmId = urlParams.get("id");

  const { data: atm, isLoading } = useQuery({
    queryKey: ["atm", atmId],
    queryFn: async () => {
      const list = await base44.entities.ATM.filter({ id: atmId });
      return list[0];
    },
    enabled: !!atmId,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["reports", atmId],
    queryFn: () => base44.entities.Report.filter({ atm_id: atmId }, "-created_date", 20),
    enabled: !!atmId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!atm) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-slate-400">ATM não encontrado</p>
      </div>
    );
  }

  const timeAgo = atm.last_report_time ? moment(atm.last_report_time).fromNow() : "Sem dados";

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-[#10B981] text-white px-5 pt-5 pb-8 rounded-b-[28px]">
        <button
          onClick={() => navigate(createPageUrl("Home"))}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-xl font-bold">{atm.bank_name}</h1>
        <div className="flex items-center gap-1.5 mt-1.5 text-white/60">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-sm">{atm.location_name}</span>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4 pb-8">
        {/* Status card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <StatusBadge status={atm.status} size="lg" />
            </div>
            <ReliabilityRing score={atm.reliability_score || 0} />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
            <Clock className="w-4 h-4 text-slate-400 mb-2" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Último report</p>
            <p className="text-sm font-semibold text-[#0F1B2D] mt-0.5">{timeAgo}</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
            <MessageSquare className="w-4 h-4 text-slate-400 mb-2" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reports 30m</p>
            <p className="text-sm font-semibold text-[#0F1B2D] mt-0.5">{atm.recent_reports_count || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-3.5 border border-slate-100">
            <Navigation className="w-4 h-4 text-slate-400 mb-2" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Navegar</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${atm.latitude},${atm.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-blue-600 mt-0.5 block"
            >
              Abrir
            </a>
          </div>
        </div>

        {/* Report buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(createPageUrl("ReportATM") + `?id=${atm.id}&status=has_money`)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-2xl transition-colors flex flex-col items-center gap-1 active:scale-[0.97]"
          >
            <span className="text-lg">✓</span>
            <span className="text-sm">Tem dinheiro</span>
          </button>
          <button
            onClick={() => navigate(createPageUrl("ReportATM") + `?id=${atm.id}&status=no_money`)}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-2xl transition-colors flex flex-col items-center gap-1 active:scale-[0.97]"
          >
            <span className="text-lg">✕</span>
            <span className="text-sm">Sem dinheiro</span>
          </button>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-bold text-[#0F1B2D] mb-3">Histórico recente</h3>
          <ReportHistory reports={reports} />
        </div>
      </div>
    </div>
  );
}