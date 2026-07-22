import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { UploadCloud, FileText, Image as ImageIcon, X, Loader2 } from "lucide-react";

// Multi-file, any-type uploader. Uploads each file to storage and reports back
// the list of { name, url, type } via onChange.
export default function FileDropzone({ files, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (fileList) => {
    const arr = Array.from(fileList || []);
    if (arr.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of arr) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploaded.push({ name: file.name, url: file_url, type: file.type || "" });
      }
      onChange([...files, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx) => onChange(files.filter((_, i) => i !== idx));

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          drag ? "border-robur-gold bg-robur-goldLight" : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin" />
            <span className="text-sm font-medium">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <UploadCloud className="w-8 h-8 text-slate-400" />
            <span className="text-sm font-semibold text-robur-black">Upload files for this job</span>
            <span className="text-xs">Photos, PDFs, screenshots — any file, multiple at once.</span>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, idx) => {
            const isImg = (f.type || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|heic|heif)$/i.test(f.name);
            return (
              <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                {isImg ? <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" /> : <FileText className="w-4 h-4 text-slate-400 shrink-0" />}
                <span className="text-sm text-slate-700 truncate flex-1">{f.name}</span>
                <button onClick={() => removeAt(idx)} className="text-slate-400 hover:text-red-500" aria-label="Remove file">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}