import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import StatusBadge from "@/components/jobs/StatusBadge";
import DocTypeChips from "@/components/jobs/DocTypeChips";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";

const FILTERS = ["all", "assigned", "in_progress", "submitted", "sent"];
const FILTER_LABELS = { all: "All", assigned: "Assigned", in_progress: "In Progress", submitted: "Submitted", sent: "Sent" };

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    base44.entities.Job.list("-job_date", 200).then((all) => { setJobs(all); setLoading(false); });
  }, []);

  const filtered = jobs.filter((j) => {
    if (filter !== "all" && j.status !== filter) return false;
    if (q) {
      const s = q.toLowerCase();
      return (j.client_name || "").toLowerCase().includes(s) ||
        (j.assigned_driver_name || "").toLowerCase().includes(s) ||
        (j.job_no || "").toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-robur-black">Jobs</h1>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Link to="/jobs/new" className="inline-flex items-center gap-2 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold px-4 py-2.5 rounded-xl">
            <Plus className="w-5 h-5" /> New Job
          </Link>
        </motion.div>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, driver or job no…" className="pl-9 h-11" />
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === f ? "bg-robur-black text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
          No jobs found.
        </div>
      ) : (
        <Stagger className="space-y-3">
          {filtered.map((job) => (
            <StaggerItem key={job.id}>
            <Pressable>
            <Link to={`/jobs/${job.id}`} className="block bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-robur-black truncate">{job.client_name}</span>
                    <span className="text-xs text-slate-400">{job.job_no}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{job.site_address || "No site address"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {job.job_date ? format(new Date(job.job_date), "d MMM yyyy") : ""} · {job.assigned_driver_name || "Unassigned"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={job.status} />
                  <DocTypeChips types={job.required_documents} />
                </div>
              </div>
            </Link>
            </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageTransition>
  );
}