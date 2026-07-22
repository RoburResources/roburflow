import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ScanLine, Sparkles, Loader2 } from "lucide-react";
import { PageTransition } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import FileDropzone from "@/components/scan/FileDropzone";
import ExtractedDocCard from "@/components/scan/ExtractedDocCard";
import { SERVICE_DOCKET_FIELDS, DMT_FIELDS, MGT_FIELDS, DOC_TYPE_LABELS } from "@/lib/documentSchemas";
import { useToast } from "@/components/ui/use-toast";

// The three documents produced per job, in order.
const DOCS = [
  { docType: "service_docket", label: DOC_TYPE_LABELS.service_docket, fields: SERVICE_DOCKET_FIELDS },
  { docType: "dmt", label: DOC_TYPE_LABELS.dmt, fields: DMT_FIELDS },
  { docType: "mgt", label: DOC_TYPE_LABELS.mgt, fields: MGT_FIELDS },
];

export default function ScanDocuments() {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState(null); // { [docType]: {key:value} }

  const runExtraction = async () => {
    if (files.length === 0) {
      toast({ title: "Add at least one file first", variant: "destructive" });
      return;
    }
    setScanning(true);
    try {
      const res = await base44.functions.invoke("extractDocketData", {
        fileUrls: files.map((f) => f.url),
        docs: DOCS.map((d) => ({ docType: d.docType, label: d.label, fields: d.fields.map((f) => ({ key: f.key, label: f.label, type: f.type })) })),
      });
      const data = res?.data?.data || {};
      // Ensure every doc has an object even if the model omitted one.
      const filled = {};
      for (const d of DOCS) filled[d.docType] = data[d.docType] || {};
      setExtracted(filled);
      toast({ title: "Data extracted", description: "Review and correct the fields below." });
    } catch (err) {
      toast({ title: "Extraction failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const updateDoc = (docType, values) => setExtracted((prev) => ({ ...prev, [docType]: values }));

  return (
    <PageTransition className="p-4 md:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Scan & Extract"
        subtitle="Upload any files for one job — we OCR them and map the data into all three documents."
        icon={ScanLine}
      />

      <div className="glass-card p-5 mb-6">
        <FileDropzone files={files} onChange={setFiles} />
        <button
          onClick={runExtraction}
          disabled={scanning || files.length === 0}
          className="cta-aurora mt-4 w-full inline-flex items-center justify-center gap-2 text-robur-black font-bold px-4 py-3 rounded-xl disabled:opacity-50 transition-opacity"
        >
          {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {scanning ? "Reading files…" : "Extract data"}
        </button>
      </div>

      {extracted && (
        <div className="space-y-5">
          {DOCS.map((d) => (
            <ExtractedDocCard
              key={d.docType}
              label={d.label}
              fields={d.fields}
              values={extracted[d.docType]}
              onChange={(vals) => updateDoc(d.docType, vals)}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}