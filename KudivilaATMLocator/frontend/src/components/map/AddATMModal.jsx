import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2, ArrowRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

const banks = ["Banco BAI", "Banco BFA", "Banco BIC", "Banco Millennium Atlântico", "Banco SOL", "Banco BPC", "Banco de Fomento Angola", "Outro"];

export default function AddATMModal({ userLocation, onClose }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [bankName, setBankName] = useState("");
  const [customBank, setCustomBank] = useState("");
  const [locationName, setLocationName] = useState("");
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [lat, setLat] = useState(userLocation ? String(userLocation[0]) : "");
  const [lng, setLng] = useState(userLocation ? String(userLocation[1]) : "");

  const mutation = useMutation({
    mutationFn: async () => {
      const created = await base44.entities.ATM.create({
        bank_name: bankName === "Outro" ? customBank : bankName,
        location_name: locationName || "",
        latitude: useMyLocation && userLocation ? userLocation[0] : parseFloat(lat),
        longitude: useMyLocation && userLocation ? userLocation[1] : parseFloat(lng),
        status: "uncertain",
        is_online: "online",
        has_paper: true,
        reliability_score: 0,
        recent_reports_count: 0,
      });
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["atms"] });
      onClose();
      navigate(createPageUrl("ReportATM") + `?id=${created.id}`);
    },
  });

  const canSubmit = (bankName && (bankName !== "Outro" || customBank)) &&
    (useMyLocation ? !!userLocation : lat && lng);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[3000]" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] max-h-[90vh] overflow-y-auto"
        >
          {(
            <div className="p-5">
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-[#0F1B2D]">Adicionar ATM</h2>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Bank */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Banco</label>
                <div className="grid grid-cols-2 gap-2">
                  {banks.map((b) => (
                    <button
                      key={b}
                      onClick={() => setBankName(b)}
                      className={`text-sm py-2.5 px-3 rounded-xl border-2 font-medium transition-all text-left ${
                        bankName === b
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
                {bankName === "Outro" && (
                  <input
                    className="mt-2 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F1B2D] transition-colors"
                    placeholder="Nome do banco"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    className="mt-2 w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#10B981] transition-colors"
                  />
                )}
              </div>

              {/* Location name */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Localização <span className="text-slate-300 font-normal">(opcional)</span></label>
                <input
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#10B981] transition-colors"
                  placeholder="Ex: Talatona Shopping, piso 0"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                />
              </div>

              {/* Coordinates */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Coordenadas</label>
                {userLocation ? (
                  <button
                    onClick={() => setUseMyLocation(!useMyLocation)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all ${
                      useMyLocation ? "border-[#10B981] bg-[#10B981]/5" : "border-slate-200"
                    }`}
                  >
                    <MapPin className={`w-4 h-4 ${useMyLocation ? "text-[#10B981]" : "text-slate-400"}`} />
                     <span className={`text-sm font-medium ${useMyLocation ? "text-[#10B981]" : "text-slate-500"}`}>
                      {useMyLocation ? "Usar a minha localização atual" : "Inserir coordenadas manualmente"}
                    </span>
                  </button>
                ) : null}
                {(!useMyLocation || !userLocation) && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0F1B2D]"
                      placeholder="Latitude"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      type="number"
                      step="any"
                    />
                    <input
                      className="border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#0F1B2D]"
                      placeholder="Longitude"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                      type="number"
                      step="any"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={() => mutation.mutate()}
                disabled={!canSubmit || mutation.isPending}
                className="w-full bg-[#10B981] text-white font-semibold py-4 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2 transition-colors hover:bg-[#059669]"
              >
                {mutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Adicionar e editar estado
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}