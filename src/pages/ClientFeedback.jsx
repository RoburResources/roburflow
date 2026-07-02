import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= n ? "fill-robur-gold text-robur-gold" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

export default function ClientFeedback() {
  const [feedback, setFeedback] = useState([]);

  const load = () => base44.entities.ClientFeedback.list("-created_date").then(setFeedback);
  useEffect(() => { load(); }, []);

  const markReviewed = async (id) => {
    await base44.entities.ClientFeedback.update(id, { reviewed: true });
    load();
  };

  const avg = feedback.length ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / feedback.length).toFixed(1) : "—";

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="Client Feedback" subtitle="Ratings and comments submitted by clients." icon={MessageSquare} />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground font-medium">Average rating</div>
          <div className="flex items-center gap-2 mt-1"><span className="text-2xl font-semibold text-foreground tabular-mono">{avg}</span><Star className="w-5 h-5 fill-robur-gold text-robur-gold" /></div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground font-medium">Total reviews</div>
          <div className="text-2xl font-semibold text-foreground mt-1 tabular-mono">{feedback.length}</div>
        </div>
      </div>

      {feedback.length === 0 ? (
        <EmptyState icon={MessageSquare} text="No client feedback yet." />
      ) : (
        <Stagger className="space-y-3">
          {feedback.map((f) => (
            <StaggerItem key={f.id}>
              <Pressable className={`glass-card glass-lift p-4 ${f.reviewed ? "" : "ring-1 ring-robur-gold/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{f.client_name}</h3>
                      {f.job_no && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-muted-foreground tabular-mono">{f.job_no}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(f.created_date), "d MMM yyyy")}</div>
                  </div>
                  <Stars n={f.rating} />
                </div>
                {f.comment && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{f.comment}</p>}
                {!f.reviewed && (
                  <Button onClick={() => markReviewed(f.id)} variant="outline" className="mt-3 h-8 text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark reviewed
                  </Button>
                )}
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageTransition>
  );
}