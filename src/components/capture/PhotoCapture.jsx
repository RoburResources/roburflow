import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Loader2 } from "lucide-react";

// Captures/uploads one or more photos (or files) and returns their URLs.
export default function PhotoCapture({ photos = [], onChange, label = "Add Photo", accept = "image/*", allowCamera = true }) {
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls = [];
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      } catch { /* skip failed upload */ }
    }
    onChange([...photos, ...urls]);
    setUploading(false);
  };

  const remove = (url) => onChange(photos.filter((p) => p !== url));

  return (
    <div>
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {photos.map((p) => (
            <div key={p} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
              <img src={p} alt="capture" className="w-full h-full object-cover" />
              <button onClick={() => remove(p)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {allowCamera && (
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-robur-gold/50 bg-robur-goldLight/40 active:scale-[0.98] transition-transform"
          >
            {uploading ? <Loader2 className="w-6 h-6 text-robur-goldDark animate-spin" /> : <Camera className="w-6 h-6 text-robur-goldDark" />}
            <span className="text-xs font-semibold text-robur-goldDark">Camera</span>
          </button>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className={`flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 active:scale-[0.98] transition-transform ${!allowCamera ? "col-span-2" : ""}`}
        >
          <Upload className="w-6 h-6 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500">Upload</span>
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(Array.from(e.target.files))} />
      <input ref={fileRef} type="file" accept={accept} multiple className="hidden" onChange={(e) => handleFiles(Array.from(e.target.files))} />
    </div>
  );
}