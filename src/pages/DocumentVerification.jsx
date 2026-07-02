import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { ShieldCheck, FileText, CheckCircle2, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { DOC_TYPE_LABELS, getDocFields } from "@/lib/documentSchemas";

// Admin side-by-side verification: extracted ticket data vs the source docket image.
export default function DocumentVerification() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);

  useEffect(() => {
    base44.entities.Job.filter({ status: "submitted" }, "-submitted_at").then(setJobs);
  }, []);

  const openJob = async (job) => {
    setSelectedJob(job);
    const d = await base44.entities.JobDocument.filter({ job_id: job.id });
    setDocs(d);
    setActiveDoc(d[0] || null);
  };

  const approve = async () => {
    await base44.entities.Job.update(selectedJob.id, { status: "sent" });
    setJobs((list) => list.filter((j) => j.id !== selectedJob.id));
    setSelectedJob(null);
    setDocs([]);
    setActiveDoc(null);
  };

  if (!selectedJob) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
        <PageHeader title="Document Verification" subtitle="Check extracted data against source images before approval." icon={ShieldCheck} />
        {jobs.length === 0 ? (
          <EmptyState icon={ShieldCheck} text="No submitted jobs awaiting verification." />
        ) : (
          <Stagger className="space-y-2">
            {jobs.map((j) => (
              <StaggerItem key={j.id}>
                <Pressable onClick={() => openJob(j)} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3 cursor-pointer">
                  <div className="min-w-0">
                    <h3 className="font-bold text-robur-black">{j.client_name}</h3>
                    <div className="text-xs text-slate-400">{j.job_no} · {j.submitted_at ? format(new Date(j.submitted_at), "d MMM yyyy, HH:mm") : ""}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                </Pressable>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </PageTransition>
    );
  }

  const fields = activeDoc ? getDocFields(activeDoc.doc_type) : [];
  const sources = activeDoc?.source_photos || [];

  return (
    <PageTransition className="p-4 md:p-8 max-w-5xl mx-auto">
      <button onClick={() => setSelectedJob(null)} className="text-sm text-slate-500 mb-4">← Back to queue</button>
      <PageHeader
        title={selectedJob.client_name}
        subtitle={`${selectedJob.job_no} · verify then approve`}
        icon={ShieldCheck}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/review/${selectedJob.id}`}><Button variant="outline">Full review</Button></Link>
            <Button onClick={approve} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
            </Button>
          </div>
        }
      />

      {docs.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDoc(d)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium ${activeDoc?.id === d.id ? "bg-robur-black text-white" : "bg-white border border-slate-200 text-slate-500"}`}
            >
              {DOC_TYPE_LABELS[d.doc_type]}
            </button>
          ))}
        </div>
      )}

      {!activeDoc ? (
        <EmptyState icon={FileText} text="No documents on this job." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Source image */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1"><ImageIcon className="w-4 h-4" /> Source Docket</div>
            {sources.length === 0 ? (
              <p className="text-sm text-slate-400">No source image captured.</p>
            ) : (
              <div className="space-y-3">
                {sources.map((s) => (
                  <a key={s} href={s} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-slate-200">
                    <img src={s} alt="source docket" className="w-full object-contain" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Extracted data */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1"><FileText className="w-4 h-4" /> Extracted Data</div>
            <div className="divide-y divide-slate-100">
              {fields.map((f) => (
                <div key={f.key} className="py-2 flex items-start justify-between gap-3">
                  <span className="text-xs text-slate-400">{f.label}</span>
                  <span className="text-sm font-medium text-robur-black text-right">{activeDoc.data?.[f.key] || "—"}</span>
                </div>
              ))}
            </div>
            {activeDoc.pdf_url && (
              <a href={activeDoc.pdf_url} target="_blank" rel="noreferrer" className="mt-3 inline-block">
                <Button variant="outline" size="sm"><FileText className="w-4 h-4 mr-1" /> Open generated document</Button>
              </a>
            )}
          </div>
        </div>
      )}
    </PageTransition>
  );
}