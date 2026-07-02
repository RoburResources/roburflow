import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { FileCheck, ChevronRight, Inbox } from "lucide-react";
import DocTypeChips from "@/components/jobs/DocTypeChips";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/shared/PullToRefreshIndicator";

export default function Review() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    return base44.entities.Job.filter({ status: "submitted" }, "-submitted_at", 100).then((all) => {
      setJobs(all);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);
  const { isRefreshing } = usePullToRefresh(load);

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-robur-black mb-1">Review Queue</h1>
      <p className="text-sm text-slate-500 mb-6">Submitted jobs awaiting your review and sending.</p>

      <PullToRefreshIndicator isRefreshing={isRefreshing} />

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nothing to review right now.</p>
        </div>
      ) : (
        <Stagger className="space-y-3">
          {jobs.map((job) => (
            <StaggerItem key={job.id}>
            <Pressable>
            <Link to={`/review/${job.id}`} className="block bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-robur-goldLight flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5 text-robur-goldDark" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-robur-black truncate">{job.client_name}</div>
                    <div className="text-xs text-slate-400">
                      {job.job_no} · submitted {job.submitted_at ? format(new Date(job.submitted_at), "d MMM, HH:mm") : ""}
                    </div>
                    <div className="mt-1.5"><DocTypeChips types={job.required_documents} /></div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
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