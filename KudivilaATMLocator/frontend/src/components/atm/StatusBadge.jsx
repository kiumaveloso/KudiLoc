import React from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const config = {
  has_money: {
    label: "Com dinheiro",
    icon: CheckCircle,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  no_money: {
    label: "Sem dinheiro",
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  uncertain: {
    label: "Incerto",
    icon: AlertTriangle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
};

export default function StatusBadge({ status, size = "sm" }) {
  const c = config[status] || config.uncertain;
  const Icon = c.icon;

  if (size === "lg") {
    return (
      <div className={`${c.bg} ${c.border} border rounded-2xl p-5 flex items-center gap-4`}>
        <div className={`w-14 h-14 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${c.text}`} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</p>
          <p className={`text-xl font-bold ${c.text} mt-0.5`}>{c.label}</p>
        </div>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}