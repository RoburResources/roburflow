import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { MapPin, ChevronRight, CheckCircle2, Clock, ClipboardList, ShieldCheck, Wallet, BookOpen, ShieldAlert } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import DocTypeChips from "@/components/jobs/DocTypeChips";
import { PageTransition, Stagger, StaggerItem, motion } from "@/components/motion/Motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/shared/PullToRefreshIndicator";

export default function DriverJobs() {
  const { user } = useCurrentUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), "yyyy-MM-dd");

  const load = useCallback(async () => {
    if (!user) return;
    // Match jobs assigned to this driver by their email (linked in Driver records)
    const drivers = await base44.entities.Driver.filter({ email: user.email });
    const driverIds = drivers.map((d) => d.id);
    const all = await base44.entities.Job.list("-job_date", 200);
    const mine = all.filter((j) =>
      driverIds.includes(j.assigned_driver_id) ||
      (j.assigned_driver_name && user.full_name && j.assigned_driver_name === user.full_name)
    );
    setJobs(mine);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  const { isRefreshing } = usePullToRefresh(load);

  const todays = jobs.filter((j) => j.job_date === today && j.status !== "sent");
  const done = jobs.filter((j) => j.status === "submitted" || j.status === "sent");

  return (
    <PageTransition className="p-4 max-w-lg mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-robur-black">Today's Jobs</h1>
        <p className="text-sm text-slate-500">{format(new Date(), "EEEE, d MMMM")}</p>
      </div>

      <PullToRefreshIndicator isRefreshing={isRefreshing} />

      <div className="grid grid-cols-4 gap-2 mb-6">
        {[
          { to: "/safety-briefings", label: "Briefings", icon: ShieldCheck },
          { to: "/expense-tracker", label: "Expenses", icon: Wallet },
          { to: "/quick-references", label: "Guides", icon: BookOpen },
          { to: "/incident-reporting", label: "Report", icon: ShieldAlert },
        ].map((q) => (
          <Link key={q.to} to={q.to} className="flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-slate-100 shadow-sm py-3">
            <q.icon className="w-5 h-5 text-robur-goldDark" />
            <span className="text-[11px] font-semibold text-robur-black">{q.label}</span>
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : todays.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No jobs assigned for today.</p>
        </div>
      ) : (
        <Stagger className="space-y-3">
          {todays.map((job) => (
            <StaggerItem key={job.id}>
              <motion.div whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                <Link to={`/job/${job.id}`} className="block bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {job.status === "in_progress" ? <Clock className="w-4 h-4 text-blue-500" /> : <span className="w-2 h-2 rounded-full bg-robur-gold" />}
                        <span className="font-bold text-robur-black truncate">{job.client_name}</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {job.site_address || "No address"}
                      </p>
                      <div className="mt-2"><DocTypeChips types={job.required_documents} /></div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                  </div>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {done.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Completed</h2>
          <Stagger className="space-y-2">
            {done.map((job) => (
              <StaggerItem key={job.id}>
                <div className="bg-white/70 rounded-xl p-3 border border-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-slate-600 truncate flex-1">{job.client_name}</span>
                  <span className="text-xs text-slate-400">{job.job_date ? format(new Date(job.job_date), "d MMM") : ""}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </PageTransition>
  );
}