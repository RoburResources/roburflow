import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Renders a form for a list of field definitions bound to a data object.
export default function DynamicFields({ fields, data, onChange, highlightKeys = [] }) {
  const set = (key, value) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const filled = highlightKeys.includes(f.key);
        if (f.type === "checkbox") {
          return (
            <label key={f.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer">
              <Checkbox checked={!!data[f.key]} onCheckedChange={(v) => set(f.key, v)} />
              <span className="text-sm font-medium">{f.label}</span>
            </label>
          );
        }
        return (
          <div key={f.key}>
            <Label className="flex items-center gap-2">
              {f.label}
              {filled && <span className="text-[10px] bg-robur-goldLight text-robur-goldDark px-1.5 py-0.5 rounded-full font-semibold">AI</span>}
            </Label>
            {f.type === "textarea" ? (
              <Textarea value={data[f.key] || ""} onChange={(e) => set(f.key, e.target.value)} rows={2} className={`mt-1 ${filled ? "border-robur-gold/60 bg-robur-goldLight/20" : ""}`} />
            ) : (
              <Input
                type={f.type === "date" ? "date" : "text"}
                value={data[f.key] || ""}
                onChange={(e) => set(f.key, e.target.value)}
                className={`mt-1 h-11 ${filled ? "border-robur-gold/60 bg-robur-goldLight/20" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}