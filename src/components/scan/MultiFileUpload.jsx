import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";

// Drop / pick any number of files of any type for one job. Each file is uploaded
// immediately and its URL kept in `files`. Parent receives the full list.
export default function MultiFileUpload({ files, onChange, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(0);

  const handleFiles = async (fileList) => {
    const picked = Array.from(fileList || []);
    if (picked.length === 0) return;
    setUploading((n) => n + picked.length);
    for (const file of picked) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onChange((prev) => [...prev, { name: file.name, type: file.type, url: file_url }]);
      } finally {
        setUploading((n) => Math.max(0, n - 1));
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx) => onChange((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-robur-gold transition-colors p-8 flex flex-col items-center justify-center gap-2 text-center disabled:opacity-50"
      >
        <div className="w-12 h-12 rounded-2xl bg-robur-goldLight flex items-center justify-center">
          <UploadCloud className="w-6 h-6 text-robur-goldDark" />
        </div>
        <p className="font-semibold text-robur-black">Upload files for this job</p>
        <p className="text-sm text-slate-500">Photos, scans or PDFs — add as many as you like</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {(files.length > 0 || uploading > 0) && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
              <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-robur-black truncate flex-1">{f.name}</span>
              <button type="button" onClick={() => removeAt(i)} className="text-slate-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li key={`u-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span className="text-sm">Uploading…</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}