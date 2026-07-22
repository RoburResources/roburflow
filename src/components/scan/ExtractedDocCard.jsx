import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Renders one document's extracted/mapped fields as an editable form so the user
// can review and correct before generating the document.
export default function ExtractedDocCard({ label, fields, values, onChange }) {
  const set = (key, val) => onChange({ ...values, [key]: val });

  return (
    <div className="glass-card p-5">
      <h3 className="text-base font-bold text-robur-black mb-4">{label}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => {
          const value = values?.[f.key] ?? (f.type === "checkbox" ? false : "");
          const wide = f.type === "textarea";
          return (
            <div key={f.key} className={wide ? "md:col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{f.label}</label>
              {f.type === "checkbox" ? (
                <div className="flex items-center gap-2 h-9">
                  <Checkbox checked={!!value} onCheckedChange={(v) => set(f.key, !!v)} />
                  <span className="text-sm text-slate-600">Yes</span>
                </div>
              ) : f.type === "textarea" ? (
                <Textarea value={value} onChange={(e) => set(f.key, e.target.value)} rows={2} />
              ) : (
                <Input
                  type={f.type === "date" ? "date" : "text"}
                  value={value}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}