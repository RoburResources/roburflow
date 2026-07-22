import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ScanLine, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { PageTransition } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import MultiFileUpload from "@/components/scan/MultiFileUpload";
import ExtractedDocCard from "@/components/scan/ExtractedDocCard";
import { SERVICE_DOCKET_FIELDS, DMT_FIELDS, MGT_FIELDS } from "@/lib/documentSchemas";

// The three documents produced per job, with their field sets.
const DOCS = [
  { docType: "service_docket", fields: SERVICE_DOCKET_FIELDS },
  { docType: "dmt", fields: DMT_FIELDS },
  { docType: "mgt", fields: MGT_FIELDS },
];

export default function ScanJob() {
  const { toast } = useToast();
  const [files, setFiles] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [results, setResults] = useState(null); // { [docType]: { key: value } }

  const runExtraction = async () => {
    if (files.length === 0) return;
    setExtracting(true);
    try {
      const { data, error } = await base44.functions.extractDocketData({
        fileUrls: files.map((f) => f.url),
        docs: DOCS.map((d) => ({ docType: d.docType, fields: d.fields })),
      });
      if (error) throw new Error(error.error || "Extraction failed");
      setResults(data.results);
      toast({ title: "Documents extracted", description: "Review the mapped fields below, then save." });
    } catch (e) {
      toast({ title: "Extraction failed", description: e.message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <PageTransition className="max-w-3xl mx-auto px-4 py-6">
      <PageHeader
        title="Scan a Job"
        subtitle="Upload the paperwork for one job — it reads every file and fills your three documents."
        icon={ScanLine}
      />

      <div className="glass-card p-5 mb-5">
        <MultiFileUpload files={files} onChange={setFiles} disabled={extracting} />
        <Button
          onClick={runExtraction}
          disabled={files.length === 0 || extracting}
          className="w-full mt-4"
        >
          {extracting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Reading {files.length} file{files.length !== 1 ? "s" : ""}…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Extract & map fields</>
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-5">
          {DOCS.map((d) => (
            <ExtractedDocCard
              key={d.docType}
              docType={d.docType}
              fields={d.fields}
              values={results[d.docType]}
              onChange={setResults}
            />
          ))}
        </div>
      )}
    </PageTransition>
  );
}