import React from "react";
import { ArrowLeft } from "lucide-react";

export default function StepHeader({ title, subtitle, stepIndex, totalSteps, onBack }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? "bg-robur-gold" : "bg-slate-200"}`} />
            ))}
          </div>
        </div>
      </div>
      <h1 className="text-xl font-extrabold text-robur-black">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}