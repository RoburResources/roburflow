import React from "react";
import { DOC_TYPE_SHORT } from "@/lib/documentSchemas";

export default function DocTypeChips({ types = [] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((t) => (
        <span key={t} className="px-2 py-0.5 rounded-md bg-robur-black text-white text-[10px] font-bold tracking-wide">
          {DOC_TYPE_SHORT[t] || t}
        </span>
      ))}
    </div>
  );
}