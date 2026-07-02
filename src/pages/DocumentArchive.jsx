import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Archive, Search, FileText, FileDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const DOC_LABELS = { service_docket: "Service Docket", dmt: "DMT", mgt: "MGT", settlement_summary: "Settlement" };
const TYPES = ["all", "service_docket", "dmt", "mgt", "settlement_summary"];

export default function DocumentArchive() {
  const [docs, setDocs] = useState([]);
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    Promise.all([
      base44.entities.JobDocument.filter({ completed: true }, "-created_date", 500),
      base44.entities.Job.list("-created_date", 500),
    ]).then(([d, j]) => {
      setDocs(d);
      setJobs(Object.fromEntries(j.map((x) => [x.id, x])));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (type !== "all" && d.doc_type !== type) return false;
      if (!q) return true;
      const job = jobs[d.job_id];
      const hay = `${d.doc_no || ""} ${job?.client_name || ""} ${job?.job_no || ""}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [docs, jobs, q, type]);

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader title="Document Archive" subtitle="Every finalized document and report, searchable." icon={Archive} />

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by doc number, client or job…" className="pl-9 h-11" />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${type === t ? "bg-robur-black text-white" : "bg-white text-slate-500 border border-slate-200"}`}>
            {t === "all" ? "All" : DOC_LABELS[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Archive} text="No documents match your search." />
      ) : (
        <Stagger className="space-y-3">
          {filtered.map((d) => {
            const job = jobs[d.job_id];
            return (
              <StaggerItem key={d.id}>
                <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-robur-goldLight flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-robur-goldDark" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-robur-black truncate">{d.doc_no || DOC_LABELS[d.doc_type]}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {DOC_LABELS[d.doc_type]} · {job?.client_name || "—"} · {format(new Date(d.created_date), "d MMM yyyy")}
                      </div>
                    </div>
                  </div>
                  {d.pdf_url && (
                    <a href={d.pdf_url} target="_blank" rel="noreferrer" className="shrink-0 text-robur-goldDark hover:text-robur-black">
                      <FileDown className="w-5 h-5" />
                    </a>
                  )}
                </Pressable>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </PageTransition>
  );
}