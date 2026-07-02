import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ScrollText, LogIn, FileCheck, Send, Settings2 } from "lucide-react";
import { PageTransition, Stagger, StaggerItem } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const CATS = ["all", "auth", "job", "document", "system"];
const ICONS = { auth: LogIn, job: FileCheck, document: Send, system: Settings2 };
const CAT_STYLE = {
  auth: "bg-blue-50 text-blue-600",
  job: "bg-robur-goldLight text-robur-goldDark",
  document: "bg-emerald-50 text-emerald-600",
  system: "bg-slate-100 text-slate-500",
};

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("all");

  useEffect(() => {
    base44.entities.ActivityLog.list("-created_date", 300).then((l) => {
      setLogs(l);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => (cat === "all" ? logs : logs.filter((l) => l.category === cat)), [logs, cat]);

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="Team Activity Logs" subtitle="Driver submissions, logins and system actions." icon={ScrollText} />

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${cat === c ? "bg-robur-black text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={ScrollText} text="No activity recorded yet." />
      ) : (
        <Stagger className="space-y-2">
          {filtered.map((l) => {
            const Icon = ICONS[l.category] || Settings2;
            return (
              <StaggerItem key={l.id}>
                <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${CAT_STYLE[l.category] || CAT_STYLE.system}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-robur-black">{l.message || l.action}</div>
                    <div className="text-xs text-slate-400">
                      {l.actor_name || l.actor_email || "System"} · {format(new Date(l.created_date), "d MMM yyyy, HH:mm")}
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </PageTransition>
  );
}