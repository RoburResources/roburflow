import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ChevronRight, Check, ScanLine, Camera, Send, Lock } from "lucide-react";
import StepHeader from "@/components/capture/StepHeader";
import PhotoCapture from "@/components/capture/PhotoCapture";
import DynamicFields from "@/components/capture/DynamicFields";
import JobOverviewCard from "@/components/capture/JobOverviewCard";
import NavigateCard from "@/components/capture/NavigateCard";
import FaceScan from "@/components/capture/FaceScan";
import DocketPreview from "@/components/capture/DocketPreview";
import LandscapeSignature from "@/components/capture/LandscapeSignature";
import { getDocFields, DOC_TYPE_LABELS, DOC_TYPE_SHORT } from "@/lib/documentSchemas";
import { nextNumber } from "@/lib/counters";
import { generateDocumentPdf } from "@/lib/pdfGenerator";
import { dataUrlToFile } from "@/lib/imageUtils";
import { getCaptureMeta } from "@/lib/captureMeta";

// Journey steps (single continuous flow across two locations)
const STEPS = {
  OVERVIEW: "overview",
  NAV_SITE: "nav_site",
  MATERIAL: "material",
  PREVIEW: "preview",
  SIGNATURE: "signature",
  RESUME: "resume",
  NAV_BRIDGE: "nav_bridge",
  FLOOR: "floor",
  WEIGHBRIDGE: "weighbridge",
  SUBMITTING: "submitting",
  DONE: "done",
};

export default function DriverCapture() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [step, setStep] = useState(STEPS.OVERVIEW);

  // Captured artifacts
  const [materialPhotos, setMaterialPhotos] = useState([]); // pickup site material (client evidence)
  const [floorPhotos, setFloorPhotos] = useState([]);       // delivery floor (internal only)
  const [bridgePhotos, setBridgePhotos] = useState([]);     // weighbridge docket source photos
  const [signatureUrl, setSignatureUrl] = useState(null);
  const [ackName, setAckName] = useState("");
  const [meta, setMeta] = useState({});                      // { material, floor } capture metadata
  const [docStates, setDocStates] = useState({});           // per doc-type field data
  const [extracting, setExtracting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const docTypes = job?.required_documents || [];

  useEffect(() => {
    (async () => {
      const j = await base44.entities.Job.get(id);
      setJob(j);
      const init = {};
      (j.required_documents || []).forEach((dt) => { init[dt] = { data: prefillFromJob(dt, j) }; });
      setDocStates(init);
      if (j.status === "assigned") await base44.entities.Job.update(id, { status: "in_progress" });
    })();
  }, [id]);

  const prefillFromJob = (docType, j) => {
    if (docType === "service_docket") return { client_name: j.client_name, site_address: j.site_address, service_date: j.job_date, job_no: j.job_no, service_type: j.service_type, notes: j.notes };
    if (docType === "mgt") return { date: j.job_date, customer_site: j.client_name, address_site: j.site_address, driver_name: j.assigned_driver_name };
    if (docType === "dmt") return { driver: j.assigned_driver_name, reference: j.job_no };
    return {};
  };

  const updateDoc = (docType, data) => setDocStates((s) => ({ ...s, [docType]: { ...s[docType], data } }));

  // Capture material photo + metadata (GPS + time)
  const onMaterialChange = async (photos) => {
    setMaterialPhotos(photos);
    if (photos.length && !meta.material) {
      const captured = await getCaptureMeta();
      setMeta((m) => ({ ...m, material: captured }));
    }
  };
  const onFloorChange = async (photos) => {
    setFloorPhotos(photos);
    if (photos.length && !meta.floor) {
      const captured = await getCaptureMeta();
      setMeta((m) => ({ ...m, floor: captured }));
    }
  };

  // Scan weighbridge docket and distribute extracted data into all required docs
  const runBridgeExtraction = async () => {
    if (!bridgePhotos.length) return;
    setExtracting(true);
    try {
      const next = { ...docStates };
      for (const docType of docTypes) {
        const fields = getDocFields(docType);
        const res = await base44.functions.invoke("extractDocketData", {
          fileUrls: bridgePhotos,
          docType: DOC_TYPE_LABELS[docType],
          fields: fields.map((f) => ({ key: f.key, label: f.label, type: f.type })),
        });
        const extracted = res.data?.data || {};
        const clean = Object.fromEntries(Object.entries(extracted).filter(([, v]) => v !== "" && v != null && v !== false));
        next[docType] = { data: { ...next[docType].data, ...clean } };
      }
      setDocStates(next);
    } finally {
      setExtracting(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setStep(STEPS.SUBMITTING);
    try {
      let sigUrl = null;
      if (signatureUrl) {
        const up = await base44.integrations.Core.UploadFile({ file: dataUrlToFile(signatureUrl, "signature.png") });
        sigUrl = up.file_url;
      }
      // Service docket — client-facing, uses material photo as evidence
      if (docTypes.includes("service_docket")) {
        const num = await nextNumber("service_docket");
        const pdfUrl = await generateDocumentPdf("service_docket", docStates.service_docket.data, num, materialPhotos, sigUrl, ackName);
        await base44.entities.JobDocument.create({
          job_id: id, doc_type: "service_docket", doc_no: `SD ${num}`,
          data: docStates.service_docket.data, evidence_photos: materialPhotos,
          source_photos: [], client_signature_url: sigUrl, client_ack_name: ackName,
          pdf_url: pdfUrl, completed: true,
        });
      }

      // DMT + MGT — a single combined ticket. Bill To = Robur, Supplier = client.
      if (docTypes.includes("dmt") || docTypes.includes("mgt")) {
        const merged = { ...(docStates.dmt?.data || {}), ...(docStates.mgt?.data || {}) };
        let dmtNo = null, mgtNo = null;
        if (docTypes.includes("dmt")) dmtNo = String(await nextNumber("dmt")).padStart(4, "0");
        if (docTypes.includes("mgt")) mgtNo = String(await nextNumber("mgt")).padStart(4, "0");
        const client = { client_name: job.client_name, site_address: job.site_address, contact_name: job.contact_name, contact_phone: job.contact_phone };
        const pdfUrl = await generateDocumentPdf("dmt", merged, dmtNo || mgtNo, [], sigUrl, ackName, { dmtNo, mgtNo, client });
        // Record each requested type, both pointing at the one combined PDF
        for (const dt of ["dmt", "mgt"].filter((t) => docTypes.includes(t))) {
          const no = dt === "dmt" ? dmtNo : mgtNo;
          await base44.entities.JobDocument.create({
            job_id: id, doc_type: dt, doc_no: `${DOC_TYPE_SHORT[dt]} ${no}`,
            data: merged, evidence_photos: [], source_photos: [...bridgePhotos, ...floorPhotos],
            client_signature_url: sigUrl, client_ack_name: ackName, pdf_url: pdfUrl, completed: true,
          });
        }
      }
      await base44.entities.Job.update(id, { status: "submitted", submitted_at: new Date().toISOString() });
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ["#F5A800", "#1A1A1A"] });
      setStep(STEPS.DONE);
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return <div className="p-8 text-slate-400 text-sm text-center">Loading job…</div>;

  const wrap = (children) => <div className="p-4 max-w-lg mx-auto pb-28">{children}</div>;
  const bottomBar = (label, onClick, disabled) => (
    <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border p-3 max-w-lg mx-auto" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
      <Button onClick={onClick} disabled={disabled} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
        {label} <ChevronRight className="w-5 h-5 ml-1" />
      </Button>
    </div>
  );

  // ---- Success ----
  if (step === STEPS.DONE) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5"><Check className="w-10 h-10 text-green-600" /></div>
        <h1 className="text-2xl font-extrabold text-robur-black mb-2">Job Submitted</h1>
        <p className="text-slate-500 mb-8">The documents have been generated and sent to the office for review.</p>
        <Button onClick={() => navigate("/")} className="w-full h-12 bg-robur-black hover:bg-black text-white font-bold">Back to Jobs</Button>
      </div>
    );
  }

  if (step === STEPS.SUBMITTING) {
    return (
      <div className="p-6 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center">
        <Loader2 className="w-10 h-10 text-robur-goldDark animate-spin mb-4" />
        <p className="text-slate-500">Generating documents…</p>
      </div>
    );
  }

  // ---- 1. Overview ----
  if (step === STEPS.OVERVIEW) {
    return wrap(<>
      <StepHeader title={job.client_name} subtitle="Job overview" stepIndex={0} totalSteps={9} onBack={() => navigate("/")} />
      <JobOverviewCard job={job} />
      {job.notes && <p className="mt-4 text-sm text-slate-600 bg-robur-goldLight/40 rounded-xl p-3">📋 {job.notes}</p>}
      {bottomBar("Go — Navigate to Site", () => setStep(STEPS.NAV_SITE))}
    </>);
  }

  // ---- 2. Navigate to site ----
  if (step === STEPS.NAV_SITE) {
    return wrap(<>
      <StepHeader title="Navigate to Site" subtitle={job.site_name || job.site_address} stepIndex={1} totalSteps={9} onBack={() => setStep(STEPS.OVERVIEW)} />
      <NavigateCard address={job.site_address} siteName={job.site_name} />
      {bottomBar("I've Arrived", () => setStep(STEPS.MATERIAL))}
    </>);
  }

  // ---- 3. Photograph material ----
  if (step === STEPS.MATERIAL) {
    return wrap(<>
      <StepHeader title="Photograph the Material" subtitle="Captures location & time" stepIndex={2} totalSteps={9} onBack={() => setStep(STEPS.NAV_SITE)} />
      <div className="bg-background rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Camera className="w-4 h-4 text-robur-goldDark" /><h3 className="font-bold text-sm">Material photo</h3></div>
        <p className="text-xs text-muted-foreground mb-3">Take a clear photo of the material at the site.</p>
        <PhotoCapture photos={materialPhotos} onChange={onMaterialChange} />
        {meta.material?.latitude && <p className="text-[11px] text-slate-400 mt-2">📍 Location & time captured</p>}
      </div>
      {bottomBar("Preview Service Docket", () => setStep(STEPS.PREVIEW), materialPhotos.length === 0)}
    </>);
  }

  // ---- 4. Client docket preview ----
  if (step === STEPS.PREVIEW) {
    return wrap(<>
      <StepHeader title="Service Docket" subtitle="Show this to the client" stepIndex={3} totalSteps={9} onBack={() => setStep(STEPS.MATERIAL)} />
      <DocketPreview job={job} evidencePhoto={materialPhotos[0]} />
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border p-3 max-w-lg mx-auto" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <Button onClick={() => setStep(STEPS.SIGNATURE)} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
          Client Accepts — Sign <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </>);
  }

  // ---- 5. Landscape signature (full-screen overlay) ----
  if (step === STEPS.SIGNATURE) {
    return (
      <>
        <LandscapeSignature ackName={ackName} onAckNameChange={setAckName} onSave={setSignatureUrl} saved={!!signatureUrl} />
        {signatureUrl && (
          <div className="fixed inset-x-4 z-[60] max-w-lg mx-auto" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
            <Button onClick={() => setStep(STEPS.RESUME)} className="w-full h-12 bg-robur-black hover:bg-black text-white font-bold">
              Done — Return Phone to Driver
            </Button>
          </div>
        )}
      </>
    );
  }

  // ---- 6. Face-scan resume ----
  if (step === STEPS.RESUME) {
    return wrap(<>
      <StepHeader title="Verify It's You" subtitle="Confirm the driver has the device" stepIndex={5} totalSteps={9} onBack={() => setStep(STEPS.PREVIEW)} />
      <div className="bg-background rounded-2xl p-6 border border-border shadow-sm">
        <FaceScan onVerified={() => setStep(STEPS.NAV_BRIDGE)} />
      </div>
    </>);
  }

  // ---- 7. Navigate to weighbridge / delivery ----
  if (step === STEPS.NAV_BRIDGE) {
    return wrap(<>
      <StepHeader title="Proceed to Delivery" subtitle="Weighbridge location" stepIndex={6} totalSteps={9} onBack={() => setStep(STEPS.RESUME)} />
      <NavigateCard address={job.site_address} siteName="Delivery / Weighbridge" />
      {bottomBar("I've Arrived", () => setStep(STEPS.FLOOR))}
    </>);
  }

  // ---- 8. Floor photo (internal) ----
  if (step === STEPS.FLOOR) {
    return wrap(<>
      <StepHeader title="Material on Floor" subtitle="Internal use only" stepIndex={7} totalSteps={9} onBack={() => setStep(STEPS.NAV_BRIDGE)} />
      <div className="bg-background rounded-2xl p-4 border border-border shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Lock className="w-4 h-4 text-muted-foreground" /><h3 className="font-bold text-sm">Delivery photo</h3></div>
        <p className="text-xs text-muted-foreground mb-3">Photograph the material on the floor. This is kept internal and never shown to the client.</p>
        <PhotoCapture photos={floorPhotos} onChange={onFloorChange} />
      </div>
      {bottomBar("Scan Weighbridge Docket", () => setStep(STEPS.WEIGHBRIDGE), floorPhotos.length === 0)}
    </>);
  }

  // ---- 9. Weighbridge docket scan + extract ----
  if (step === STEPS.WEIGHBRIDGE) {
    return wrap(<>
      <StepHeader title="Weighbridge Docket" subtitle="Scan to auto-fill documents" stepIndex={8} totalSteps={9} onBack={() => setStep(STEPS.FLOOR)} />
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3"><ScanLine className="w-4 h-4 text-robur-goldDark" /><h3 className="font-bold text-sm">Photograph the ticket</h3></div>
        <p className="text-xs text-slate-500 mb-3">Take a clear photo of the weighbridge docket. The system will read it and fill your documents.</p>
        <PhotoCapture photos={bridgePhotos} onChange={setBridgePhotos} />
        {bridgePhotos.length > 0 && (
          <Button onClick={runBridgeExtraction} disabled={extracting} className="w-full mt-3 h-11 bg-robur-black hover:bg-black text-white font-semibold">
            {extracting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reading ticket…</> : <><Sparkles className="w-4 h-4 mr-2" /> Auto-Fill from Photo</>}
          </Button>
        )}
      </div>

      {docTypes.map((dt) => (
        <div key={dt} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mb-4">
          <h3 className="font-bold text-sm mb-3">{DOC_TYPE_LABELS[dt]}</h3>
          <DynamicFields fields={getDocFields(dt)} data={docStates[dt]?.data || {}} onChange={(data) => updateDoc(dt, data)} />
        </div>
      ))}

      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border p-3 max-w-lg mx-auto" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        <Button onClick={submit} disabled={submitting} className="w-full h-12 bg-robur-black hover:bg-black text-white font-bold">
          {submitting ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting…</> : <><Send className="w-5 h-5 mr-2" /> Submit Job</>}
        </Button>
      </div>
    </>);
  }

  return null;
}