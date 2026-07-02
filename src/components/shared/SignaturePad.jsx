import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

// Canvas-based signature pad. Calls onSave with a PNG data URL.
export default function SignaturePad({ onSave, height = 180 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1A1A1A";
  }, [height]);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const end = () => { drawing.current = false; };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    if (!hasSignature) return;
    onSave(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div>
      <div className="rounded-xl border-2 border-dashed border-robur-gold/50 bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{ height, width: "100%", touchAction: "none" }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" onClick={clear} className="flex-1 h-11">
          <Eraser className="w-4 h-4 mr-2" /> Clear
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={!hasSignature}
          className="flex-1 h-11 bg-robur-black hover:bg-black text-white"
        >
          <Check className="w-4 h-4 mr-2" /> Confirm Signature
        </Button>
      </div>
    </div>
  );
}