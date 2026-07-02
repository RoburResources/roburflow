import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { FolderOpen, FileText, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { DOC_TYPE_LABELS } from "@/lib/documentSchemas";

// Client-facing view: an authorized client sees their own completed jobs & documents.
export default function ClientPortal() {
  const { user, loading } = useCurrentUser();
  const [client, setClient] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [docsByJob, setDocsByJob] = useState({});
  const [ready, setReady] = useState(false);
  const [rateJob, setRateJob] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (loading) return;
    (async () => {
      const email = user?.email;
      const matches = email ? await base44.entities.Client.filter({ email }) : [];
      const c = matches.find((m) => m.portal_access) || null;
      setClient(c);
      if (c) {
        const js = await base44.entities.Job.filter({ client_id: c.id }, "-job_date");
        const sent = js.filter((j) => j.status === "sent" || j.status === "submitted");
        setJobs(sent);
        const map = {};
        for (const j of sent) {
          map[j.id] = await base44.entities.JobDocument.filter({ job_id: j.id });
        }
        setDocsByJob(map);
      }
      setReady(true);
    })();
  }, [user, loading]);

  const submitFeedback = async () => {
    await base44.entities.ClientFeedback.create({
      client_id: client.id,
      client_name: client.name,
      job_id: rateJob.id,
      job_no: rateJob.job_no,
      rating,
      comment,
    });
    setRateJob(null);
    setComment("");
    setRating(5);
  };

  if (!ready) return <div className="p-8 text-slate-400 text-sm">Loading…</div>;

  if (!client) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto">
        <PageHeader title="Client Portal" subtitle="Your job history and documents." icon={FolderOpen} />
        <EmptyState icon={FolderOpen} text="Portal access isn't enabled for your account yet. Please contact Robur Resources." />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title={`Welcome, ${client.name}`} subtitle="Your completed jobs and documents." icon={FolderOpen} />

      {jobs.length === 0 ? (
        <EmptyState icon={FileText} text="No documents available yet." />
      ) : (
        <Stagger className="space-y-4">
          {jobs.map((j) => {
            const docs = docsByJob[j.id] || [];
            return (
              <StaggerItem key={j.id}>
                <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-robur-black">{j.job_no || "Job"}</h3>
                      <div className="text-xs text-slate-400">
                        {j.site_name ? `${j.site_name} · ` : ""}{j.job_date ? format(new Date(j.job_date), "d MMM yyyy") : ""}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setRateJob(j)}>
                      <Star className="w-3.5 h-3.5 mr-1" /> Rate
                    </Button>
                  </div>
                  {docs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {docs.map((d) => (
                        <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="w-4 h-4 text-robur-goldDark" />
                            <span className="font-medium text-robur-black">{DOC_TYPE_LABELS[d.doc_type]}</span>
                            <span className="text-slate-400">{d.doc_no}</span>
                          </div>
                          {d.pdf_url && (
                            <a href={d.pdf_url} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" className="h-7"><ExternalLink className="w-4 h-4" /></Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Pressable>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Dialog open={!!rateJob} onOpenChange={(o) => !o && setRateJob(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rate {rateJob?.job_no}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)}>
                  <Star className={`w-8 h-8 ${i <= rating ? "fill-robur-gold text-robur-gold" : "text-slate-200"}`} />
                </button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Optional comment…" />
            <Button onClick={submitFeedback} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Submit Feedback</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}