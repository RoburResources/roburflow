import React, { useState } from "react";
import { RotateCcw, Smartphone } from "lucide-react";
import SignaturePad from "@/components/shared/SignaturePad";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Full-screen landscape signature capture. Prompts the client to rotate the
// device, then presents a wide signing surface.
export default function LandscapeSignature({ ackName, onAckNameChange, onSave, saved }) {
  const [ready, setReady] = useState(false);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 bg-robur-black flex flex-col items-center justify-center p-8 text-center">
        <Smartphone className="w-16 h-16 text-robur-gold mb-5 rotate-90" />
        <h2 className="text-white text-xl font-extrabold mb-2">Rotate to landscape</h2>
        <p className="text-white/60 text-sm mb-8 max-w-xs">Please turn the device sideways and hand it to the client to sign.</p>
        <button onClick={() => setReady(true)} className="h-12 px-8 rounded-xl bg-robur-gold text-robur-black font-bold">
          I'm ready to sign
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold text-robur-black">Client Signature</h2>
        <button onClick={() => setReady(false)} className="text-slate-400 flex items-center gap-1 text-sm">
          <RotateCcw className="w-4 h-4" /> Restart
        </button>
      </div>
      <div className="mb-3 max-w-sm">
        <Label>Client Name</Label>
        <Input value={ackName} onChange={(e) => onAckNameChange(e.target.value)} placeholder="Name of person signing" className="mt-1 h-11" />
      </div>
      <div className="flex-1">
        <SignaturePad onSave={onSave} height={window.innerHeight - 260} />
      </div>
      {saved && <p className="text-green-600 font-semibold text-sm mt-2">Signature captured</p>}
    </div>
  );
}