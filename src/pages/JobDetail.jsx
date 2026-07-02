import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Trash2, FileText, Download, MapPin, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/jobs/StatusBadge";
import DocTypeChips from "@/components/jobs/DocTypeChips";
import { DOC_TYPE_LABELS } from "@/lib/documentSchemas";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const j = await base44.entities.Job.get(id);
    setJob(j);
    const d = await base44.entities.JobDocument.filter({ job_id: id });
    setDocs(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const remove = async () => {
    if (!confirm("Delete this job and all its documents?")) return;
    for (const d of docs) await base44.entities.JobDocument.delete(d.id);
    await base44.entities.Job.delete(id);
    navigate("/jobs");
  };

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading…</div>;
  if (!job) return <div className="p-8 text-slate-500">Job not found.</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-500 mb-4 text-sm"><ArrowLeft className="w-4 h-4" /> Back to jobs</Link>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-robur-black">{job.client_name}</h1>
              <span className="text-xs text-slate-400">{job.job_no}</span>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="flex gap-2">
            <Link to={`/jobs/${id}/edit`}><Button variant="outline" size="icon" className="h-9 w-9"><Pencil className="w-4 h-4" /></Button></Link>
            <Button variant="outline" size="icon" onClick={remove} className="h-9 w-9 text-red-600"><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> {job.job_date ? format(new Date(job.job_date), "EEEE, d MMMM yyyy") : "—"}</div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {job.site_address || "No site address"}</div>
          <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-slate-400" /> {job.assigned_driver_name || "Unassigned"}</div>
        </div>
        <div className="mt-4"><DocTypeChips types={job.required_documents} /></div>
        {job.notes && <p className="mt-4 text-sm text-slate-500 bg-slate-50 rounded-xl p-3">{job.notes}</p>}
      </div>

      <h2 className="text-lg font-bold text-robur-black mb-3">Documents</h2>
      {docs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm">
          No documents submitted yet. The driver will complete these on-site.
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-robur-goldLight flex items-center justify-center">
                  <FileText className="w-5 h-5 text-robur-goldDark" />
                </div>
                <div>
                  <div className="font-semibold text-robur-black">{DOC_TYPE_LABELS[d.doc_type]}</div>
                  <div className="text-xs text-slate-400">{d.doc_no}</div>
                </div>
              </div>
              {d.pdf_url && (
                <a href={d.pdf_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" /> PDF</Button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {job.status === "submitted" && (
        <Link to={`/review/${id}`}>
          <Button className="w-full h-12 mt-5 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
            Review & Send to Client
          </Button>
        </Link>
      )}
    </div>
  );
}