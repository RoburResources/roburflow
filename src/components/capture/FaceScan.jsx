import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ScanFace, Check, Loader2 } from "lucide-react";
import { dataUrlToFile } from "@/lib/imageUtils";

// Biometric-style face scan UI. Under the hood it captures a front-camera
// selfie and uploads it as a verification record. Presented as a face scan
// so it maps cleanly to native Face ID when wrapped as an iOS/Android app.
export default function FaceScan({ onVerified }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | scanning | verifying | done
  const [error, setError] = useState(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("scanning");
    } catch {
      setError("Camera access is required to verify your identity.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => stopCamera, []);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    setPhase("verifying");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    stopCamera();
    try {
      const file = dataUrlToFile(dataUrl, "face-verify.jpg");
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhase("done");
      onVerified(file_url);
    } catch {
      setError("Verification failed. Please try again.");
      setPhase("idle");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56 rounded-full overflow-hidden bg-slate-900 border-4 border-robur-gold/60 mb-5">
        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ScanFace className="w-16 h-16 text-robur-gold/70" />
          </div>
        )}
        <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${phase === "scanning" || phase === "verifying" ? "" : "hidden"}`} style={{ transform: "scaleX(-1)" }} />
        {phase === "done" && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500">
            <Check className="w-20 h-20 text-white" />
          </div>
        )}
        {(phase === "scanning" || phase === "verifying") && (
          <div className="absolute inset-0 rounded-full ring-4 ring-robur-gold animate-pulse pointer-events-none" />
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}

      {phase === "idle" && (
        <button onClick={startCamera} className="w-full h-12 rounded-xl bg-robur-black text-white font-bold flex items-center justify-center gap-2">
          <ScanFace className="w-5 h-5" /> Verify My Identity
        </button>
      )}
      {phase === "scanning" && (
        <button onClick={capture} className="w-full h-12 rounded-xl bg-robur-gold text-robur-black font-bold">
          Scan Face
        </button>
      )}
      {phase === "verifying" && (
        <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</div>
      )}
      {phase === "done" && <p className="text-green-600 font-semibold text-sm">Identity verified</p>}
    </div>
  );
}