import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, DollarSign } from "lucide-react";

// Edits a client's per-material rate card. Value is an array of { material, rate }.
export default function RateCardEditor({ value = [], onChange }) {
  const rows = value || [];
  const update = (i, k, v) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([...rows, { material: "", rate: "" }]);
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-robur-goldDark" /> Rate Card (AUD / tonne)</Label>
        <button type="button" onClick={add} className="text-sm text-robur-goldDark font-semibold inline-flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-400">No materials priced yet. Add a material and its rate to auto-calculate settlements.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Input value={r.material} onChange={(e) => update(i, "material", e.target.value)} placeholder="Material" className="h-10 text-sm flex-1" />
              <Input type="number" value={r.rate} onChange={(e) => update(i, "rate", e.target.value)} placeholder="Rate" className="h-10 text-sm w-24" />
              <button type="button" onClick={() => remove(i)} className="text-red-500 border border-slate-200 rounded-md w-10 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}