import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ChevronRight, Check, ScanLine, Camera, PenLine, Send } from "lucide-react";
import StepHeader from "@/components/capture/StepHeader";
import PhotoCapture from "@/components/capture/PhotoCapture";
import DynamicFields from "@/components/capture/DynamicFields";
import SignaturePad from "@/components/shared/SignaturePad";
import { getDocFields, DOC_TYPE_LABELS, DOC_TYPE_SHORT } from "@/lib/documentSchemas";
import { nextNumber } from "@/lib/counters";
import { generateDocumentPdf } from "@/lib/pdfGenerator";
import { dataUrlToFile } from "@/lib/imageUtils";

export default function DriverCapture() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [step, setStep] = useState(0); // 0=intro, then one per doc, then evidence, signature, submitting
  const [docStates, setDocStates] = useState({}); // { docType: { data, sourcePhotos, extractedKeys, extracting } }
  const [evidence, setEvidence] = useState([]);
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [ackName, setAckName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const docTypes = job?.required_documents || [];
  // Step map: 0 intro | 1..N docs | N+1 evidence | N+2 signature
  const evidenceStep = 1 + docTypes.length;
  const signatureStep = evidenceStep + 1;

  useEffect(() => {
    (async () => {
      const j = await base44.entities.Job.get(id);
      setJob(j);
      // Seed each doc's data with known job values
      const init = {};
      (j.required_documents || []).forEach((dt) => {
        init[dt] = {
          data: prefillFromJob(dt, j),
          sourcePhotos: [],
          extractedKeys: [],
          extracting: false,
        };
      });
      setDocStates(init);
      if (j.status === "assigned") {
        await base44.entities.Job.update(id, { status: "in_progress" });
      }
    })();
  }, [id]);

  const prefillFromJob = (docType, j) => {
    if (docType === "service_docket") return { client_name: j.client_name, site_address: j.site_address, service_date: j.job_date, job_no: j.job_no, service_type: j.service_type, notes: j.notes };
    if (docType === "mgt") return { date: j.job_date, customer_site: j.client_name, address_site: j.site_address, driver_name: j.assigned_driver_name };
    if (docType === "dmt") return { driver: j.assigned_driver_name, from_location: "", reference: j.job_no };
    return {};
  };

  const updateDoc = (docType, patch) => setDocStates((s) => ({ ...s, [docType]: { ...s[docType], ...patch } }));

  const runExtraction = async (docType) => {
    const st = docStates[docType];
    if (!st.sourcePhotos.length) return;
    updateDoc(docType, { extracting: true });
    try {
      const fields = getDocFields(docType);
      const res = await base44.functions.invoke("extractDocketData", {
        fileUrls: st.sourcePhotos,
        docType: DOC_TYPE_LABELS[docType],
        fields: fields.map((f) => ({ key: f.key, label: f.label, type: f.type })),
      });
      const extracted = res.data?.data || {};
      const filledKeys = Object.keys(extracted).filter((k) => extracted[k] !== "" && extracted[k] != null && extracted[k] !== false);
      updateDoc(docType, {
        data: { ...st.data, ...Object.fromEntries(Object.entries(extracted).filter(([, v]) => v !== "" && v != null && v !== false)) },
        extractedKeys: filledKeys,
        extracting: false,
      });
    } catch {
      updateDoc(docType, { extracting: false });
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      // Upload signature
      let sigUrl = null;
      if (signatureUrl) {
        const file = dataUrlToFile(signatureUrl, "signature.png");
        const up = await base44.integrations.Core.UploadFile({ file });
        sigUrl = up.file_url;
      }
      // Generate a document per required type
      for (const docType of docTypes) {
        const st = docStates[docType];
        const prefix = docType === "dmt" ? "dmt" : docType === "mgt" ? "mgt" : "service_docket";
        const num = await nextNumber(prefix);
        const docNo = docType === "service_docket" ? `SD ${num}` : `${DOC_TYPE_SHORT[docType]} ${num}`;
        const pdfUrl = await generateDocumentPdf(docType, st.data, num, evidence, sigUrl, ackName);
        await base44.entities.JobDocument.create({
          job_id: id,
          doc_type: docType,
          doc_no: docNo,
          data: st.data,
          evidence_photos: evidence,
          source_photos: st.sourcePhotos,
          client_signature_url: sigUrl,
          client_ack_name: ackName,
          pdf_url: pdfUrl,
          completed: true,
        });
      }
      await base44.entities.Job.update(id, { status: "submitted", submitted_at: new Date().toISOString() });
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#F5A800", "#1A1A1A"] });
      setStep(-1); // success
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return <div className="p-8 text-slate-400 text-sm text-center">Loading job…</div>;

  // Success screen
  if (step === -1) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-robur-black mb-2">Job Submitted</h1>
        <p className="text-slate-500 mb-8">The documents have been generated and sent to the office for review.</p>
        <Button onClick={() => navigate("/")} className="w-full h-12 bg-robur-black hover:bg-black text-white font-bold">Back to Jobs</Button>
      </div>
    );
  }

  const totalSteps = signatureStep + 1;

  // ---- Intro ----
  if (step === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <StepHeader title={job.client_name} subtitle={job.site_address} stepIndex={0} totalSteps={totalSteps} onBack={() => navigate("/")} />
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
          <p className="text-sm text-slate-500 mb-3">You'll complete the following for this job:</p>
          <div className="space-y-2">
            {docTypes.map((dt) => (
              <div key={dt} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-robur-black flex items-center justify-center text-white text-xs font-bold">{DOC_TYPE_SHORT[dt].slice(0, 3)}</div>
                <span className="font-medium text-sm">{DOC_TYPE_LABELS[dt]}</span>
              </div>
            ))}
          </div>
          {job.notes && <p className="mt-4 text-sm text-slate-600 bg-robur-goldLight/40 rounded-xl p-3">📋 {job.notes}</p>}
        </div>
        <Button onClick={() => setStep(1)} className="w-full h-13 py-6 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold text-base">
          Start Capture <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    );
  }

  // ---- Document steps ----
  if (step >= 1 && step <= docTypes.length) {
    const docType = docTypes[step - 1];
    const st = docStates[docType];
    const fields = getDocFields(docType);
    return (
      <div className="p-4 max-w-lg mx-auto pb-28">
        <StepHeader
          title={DOC_TYPE_LABELS[docType]}
          subtitle={`Step ${step} of ${docTypes.length} documents`}
          stepIndex={step}
          totalSteps={totalSteps}
          onBack={() => setStep(step - 1)}
        />

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ScanLine className="w-4 h-4 text-robur-goldDark" />
            <h3 className="font-bold text-sm">Photograph the ticket</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">Take a clear photo of the physical docket. The system will read it and fill the fields below.</p>
          <PhotoCapture photos={st.sourcePhotos} onChange={(photos) => updateDoc(docType, { sourcePhotos: photos })} />
          {st.sourcePhotos.length > 0 && (
            <Button
              onClick={() => runExtraction(docType)}
              disabled={st.extracting}
              className="w-full mt-3 h-11 bg-robur-black hover:bg-black text-white font-semibold"
            >
              {st.extracting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading ticket…</> : <><Sparkles className="w-4 h-4 mr-2" /> Auto-Fill from Photo</>}
            </Button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
          <h3 className="font-bold text-sm mb-3">Review & correct fields</h3>
          <DynamicFields fields={fields} data={st.data} onChange={(data) => updateDoc(docType, { data })} highlightKeys={st.extractedKeys} />
        </div>

        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 max-w-lg mx-auto">
          <Button onClick={() => setStep(step + 1)} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
            {step < docTypes.length ? "Next Document" : "Continue"} <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ---- Evidence step ----
  if (step === evidenceStep) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-28">
        <StepHeader title="Service Evidence" subtitle="Photos proving the service" stepIndex={step} totalSteps={totalSteps} onBack={() => setStep(step - 1)} />
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-robur-goldDark" />
            <h3 className="font-bold text-sm">Capture evidence photos</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">Take clear photos showing the full material or completed service.</p>
          <PhotoCapture photos={evidence} onChange={setEvidence} />
        </div>
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 max-w-lg mx-auto">
          <Button onClick={() => setStep(step + 1)} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
            Continue to Signature <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ---- Signature step ----
  if (step === signatureStep) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-28">
        <StepHeader title="Client Signature" subtitle="Hand the phone to the client" stepIndex={step} totalSteps={totalSteps} onBack={() => setStep(step - 1)} />
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="w-4 h-4 text-robur-goldDark" />
            <h3 className="font-bold text-sm">Client acknowledgement</h3>
          </div>
          <div className="mb-4">
            <Label>Client Name</Label>
            <Input value={ackName} onChange={(e) => setAckName(e.target.value)} placeholder="Name of person signing" className="mt-1 h-11" />
          </div>
          <Label className="mb-2 block">Signature</Label>
          <SignaturePad onSave={setSignatureUrl} />
          {signatureUrl && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 font-medium">
              <Check className="w-4 h-4" /> Signature captured
            </div>
          )}
        </div>
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 max-w-lg mx-auto">
          <Button
            onClick={submit}
            disabled={submitting || !signatureUrl}
            className="w-full h-12 bg-robur-black hover:bg-black text-white font-bold"
          >
            {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating documents…</> : <><Send className="w-5 h-5 mr-2" /> Submit Job</>}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}