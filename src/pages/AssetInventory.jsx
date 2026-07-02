import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Boxes, Wrench, History, ChevronDown } from "lucide-react";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

const STATUS_STYLE = {
  available: "bg-emerald-50 text-emerald-600",
  assigned: "bg-blue-50 text-blue-600",
  maintenance: "bg-amber-50 text-amber-600",
  retired: "bg-slate-100 text-slate-500",
};

export default function AssetInventory() {
  const [assets, setAssets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    base44.entities.Asset.list("-created_date").then(setAssets);
    base44.entities.Job.list("-job_date", 1000).then(setJobs);
  }, []);

  const historyFor = (a) =>
    jobs.filter(
      (j) =>
        (a.assigned_job_no && j.job_no === a.assigned_job_no) ||
        (a.assigned_driver_name && j.assigned_driver_name === a.assigned_driver_name)
    );

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Asset Inventory"
        subtitle="All company assets with current status, assigned driver, and job history."
        icon={Boxes}
      />

      {assets.length === 0 ? (
        <EmptyState icon={Boxes} text="No assets tracked yet." />
      ) : (
        <Stagger className="space-y-3">
          {assets.map((a) => {
            const history = historyFor(a);
            const isOpen = expanded === a.id;
            return (
              <StaggerItem key={a.id}>
                <Pressable className="glass-card glass-lift overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : a.id)}
                    className="w-full text-left p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{a.name}</h3>
                      <div className="text-xs text-muted-foreground">{a.asset_tag || a.category}</div>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                        <span className="text-[10px] bg-black/5 text-muted-foreground px-2 py-0.5 rounded-full capitalize">{a.category}</span>
                        {a.assigned_driver_name && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> {a.assigned_driver_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <History className="w-4 h-4" />
                      <span className="text-xs font-semibold tabular-mono">{history.length}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-black/5 pt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Job History</div>
                      {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No linked jobs yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {history.map((j) => (
                            <div key={j.id} className="flex items-center justify-between text-xs bg-black/5 rounded-lg px-3 py-2">
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground tabular-mono">{j.job_no}</span>
                                <span className="text-muted-foreground"> · {j.client_name}</span>
                              </div>
                              <span className="text-muted-foreground shrink-0">{j.job_date ? format(new Date(j.job_date), "d MMM yyyy") : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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