import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, FileText, ExternalLink, Send, Loader2, CheckCircle2, Mail, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOC_TYPE_LABELS } from "@/lib/documentSchemas";

export default function ReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Please find your completed documents for the recent job attached.");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const j = await base44.entities.Job.get(id);
    setJob(j);
    setEmail(j.client_email || "");
    setSent(j.status === "sent");
    const d = await base44.entities.JobDocument.filter({ job_id: id });
    setDocs(d);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const send = async () => {
    setError("");
    if (!email) { setError("Add a client email address first."); return; }
    setSending(true);
    try {
      if (email !== job.client_email) await base44.entities.Job.update(id, { client_email: email });
      const res = await base44.functions.invoke("sendToClient", { jobId: id, message });
      if (res.data?.error) { setError(res.data.error); setSending(false); return; }
      setSent(true);
    } catch (err) {
      setError(err?.message || "Could not send.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-400 text-sm">Loading…</div>;
  if (!job) return <div className="p-8 text-slate-500">Job not found.</div>;

  const allEvidence = [...new Set(docs.flatMap((d) => d.evidence_photos || []))];

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <Link to="/review" className="inline-flex items-center gap-2 text-slate-500 mb-4 text-sm"><ArrowLeft className="w-4 h-4" /> Back to review queue</Link>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-robur-black">{job.client_name}</h1>
          <p className="text-sm text-slate-400">{job.job_no} · {job.job_date ? format(new Date(job.job_date), "d MMM yyyy") : ""}</p>
        </div>
        {sent && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Sent
          </span>
        )}
      </div>

      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Generated Documents</h2>
      <div className="space-y-3 mb-6">
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
                <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" /> Open PDF</Button>
              </a>
            )}
          </div>
        ))}
      </div>

      {allEvidence.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Evidence Photos</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {allEvidence.map((p) => (
              <a key={p} href={p} target="_blank" rel="noreferrer" className="aspect-square rounded-xl overflow-hidden border border-slate-200">
                <img src={p} alt="evidence" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="font-bold text-robur-black mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-robur-goldDark" /> Send to Client</h2>
        <div className="space-y-4">
          <div>
            <Label>Client Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-11" placeholder="client@example.com" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {sent ? (
            <Button onClick={() => navigate("/review")} className="w-full h-12 bg-slate-100 text-slate-600 font-bold hover:bg-slate-200">
              Documents Sent — Back to Queue
            </Button>
          ) : (
            <Button onClick={send} disabled={sending} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              {sending ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending…</> : <><Send className="w-5 h-5 mr-2" /> Send Documents</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}