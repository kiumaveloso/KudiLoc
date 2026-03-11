import React from "react";
import moment from "moment";
import { CheckCircle, XCircle } from "lucide-react";

export default function ReportHistory({ reports }) {
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-400">
        Sem reports recentes
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reports.slice(0, 8).map((report, i) => {
        const isPositive = report.status_reported === "has_money";
        return (
          <div key={report.id || i} className="flex items-center gap-3 py-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPositive ? "bg-emerald-50" : "bg-red-50"
            }`}>
              {isPositive ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#0F1B2D]">
                {isPositive ? "Com dinheiro" : "Sem dinheiro"}
              </p>
              <p className="text-[10px] text-slate-400">
                {moment(report.created_date).fromNow()}
              </p>
            </div>
            {report.reporter_reputation && (
              <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                Rep: {report.reporter_reputation}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}