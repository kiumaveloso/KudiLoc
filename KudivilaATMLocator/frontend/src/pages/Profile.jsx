import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, CheckCircle, MessageSquare, TrendingUp, LogOut, Trash2 } from "lucide-react";
import ReliabilityRing from "@/components/atm/ReliabilityRing";

export default function Profile() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["my-reports"],
    queryFn: async () => {
      const u = await base44.auth.me();
      return base44.entities.Report.filter({ created_by: u.email }, "-created_date", 100);
    },
  });

  const isLoading = userLoading || reportsLoading;

  const totalReports = reports.length;
  const positiveReports = reports.filter((r) => r.status_reported === "has_money").length;
  const reputationScore = user?.reputation_score || 50;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      {/* Header */}
      <div className="relative bg-[#10B981] text-white px-5 pt-8 pb-12 rounded-b-[28px] overflow-hidden">
        {/* Big K watermark */}
        <div className="absolute -right-4 -top-4 text-[180px] font-black leading-none select-none pointer-events-none" style={{ color: "rgba(6,182,212,0.18)" }}>
          K
        </div>
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h1 className="text-lg font-bold">Meu Perfil</h1>
          <button
            onClick={() => base44.auth.logout()}
            className="text-white/60 hover:text-white transition-colors p-2"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold border border-white/20">
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.full_name || "Utilizador"}</h2>
            <p className="text-sm text-white/70">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-5 space-y-4 pb-8">
        {/* Reputation card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-5">
          <ReliabilityRing score={reputationScore} size={90} />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#0F1B2D]">Reputação</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Quanto mais reports corretos fizer, maior será o peso das suas contribuições.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 border border-slate-100 text-center">
            <MessageSquare className="w-5 h-5 text-[#0F1B2D] mx-auto mb-2" />
            <p className="text-xl font-bold text-[#0F1B2D]">{totalReports}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Reports</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-[#0F1B2D]">{positiveReports}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Corretos</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 text-center">
            <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-[#0F1B2D]">
              {totalReports > 0 ? Math.round((positiveReports / totalReports) * 100) : 0}%
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Precisão</p>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100">
          <h3 className="text-sm font-bold text-[#0F1B2D] mb-4">Contribuições recentes</h3>
          {reports.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400">Ainda sem contribuições</p>
              <p className="text-xs text-slate-400 mt-1">Comece a reportar ATMs!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 5).map((report) => {
                const isPositive = report.status_reported === "has_money";
                return (
                  <div key={report.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isPositive ? "bg-emerald-50" : "bg-red-50"
                    }`}>
                      {isPositive ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Shield className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-[#0F1B2D]">
                        {isPositive ? "Com dinheiro" : "Sem dinheiro"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(report.created_date).toLocaleDateString("pt-PT", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Account Deletion */}
        <div className="bg-white rounded-2xl p-5 border border-red-100">
          <h3 className="text-sm font-bold text-red-600 mb-1">Zona de Perigo</h3>
          <p className="text-xs text-slate-500 mb-4">Ações irreversíveis relacionadas com a sua conta.</p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Conta
          </button>
        </div>
      </div>

      {/* Delete Account Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-base font-bold text-[#0F1B2D] mb-2">Eliminar Conta</h2>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">
              Esta ação é irreversível. Todos os seus dados serão permanentemente eliminados.
              Escreva <strong className="text-[#0F1B2D]">ELIMINAR</strong> para confirmar.
            </p>
            <input
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 transition-colors mb-4"
              placeholder="Escreva ELIMINAR"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(""); }}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                disabled={deleteConfirmText !== "ELIMINAR"}
                onClick={() => { /* Account deletion logic here */ }}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm disabled:opacity-40 hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}