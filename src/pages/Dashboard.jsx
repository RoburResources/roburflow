import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Plus, ListChecks, Clock, FileCheck, Send } from "lucide-react";
import StatusBadge from "@/components/jobs/StatusBadge";
import DocTypeChips from "@/components/jobs/DocTypeChips";
import { PageTransition, Stagger, StaggerItem, Pressable, Pop, motion } from "@/components/motion/Motion";
import DispatchBoard from "@/components/dispatch/DispatchBoard";

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <Pop className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-extrabold text-robur-black">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </Pop>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.Job.list("-created_date", 100);
    setJobs(all);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const todaysJobs = jobs.filter((j) => j.job_date === today);
  const counts = {
    assigned: jobs.filter((j) => j.status === "assigned").length,
    in_progress: jobs.filter((j) => j.status === "in_progress").length,
    submitted: jobs.filter((j) => j.status === "submitted").length,
    sent: jobs.filter((j) => j.status === "sent").length,
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-robur-black">Dashboard</h1>
          <p className="text-sm text-slate-500">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Link to="/jobs/new" className="inline-flex items-center gap-2 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold px-4 py-2.5 rounded-xl transition-colors">
            <Plus className="w-5 h-5" /> New Job
          </Link>
        </motion.div>
      </div>

      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StaggerItem><Stat icon={ListChecks} label="Assigned" value={counts.assigned} accent="bg-slate-100 text-slate-600" /></StaggerItem>
        <StaggerItem><Stat icon={Clock} label="In Progress" value={counts.in_progress} accent="bg-blue-100 text-blue-600" /></StaggerItem>
        <StaggerItem><Stat icon={FileCheck} label="Awaiting Review" value={counts.submitted} accent="bg-robur-goldLight text-robur-goldDark" /></StaggerItem>
        <StaggerItem><Stat icon={Send} label="Sent to Client" value={counts.sent} accent="bg-green-100 text-green-600" /></StaggerItem>
      </Stagger>

      <DispatchBoard />

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-robur-black">Today's Jobs</h2>
        <Link to="/jobs" className="text-sm text-robur-goldDark font-semibold">View all</Link>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : todaysJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <ListChecks className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No jobs scheduled for today.</p>
          <Link to="/jobs/new" className="inline-flex items-center gap-2 text-robur-goldDark font-semibold">
            <Plus className="w-4 h-4" /> Create the first job
          </Link>
        </div>
      ) : (
        <Stagger className="space-y-3">
          {todaysJobs.map((job) => (
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
                      <p className="text-xs text-slate-400 mt-1">Driver: {job.assigned_driver_name || "Unassigned"}</p>
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