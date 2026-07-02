import React from "react";

const MAP = {
  assigned: { label: "Assigned", cls: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", cls: "bg-blue-100 text-blue-700" },
  submitted: { label: "Submitted", cls: "bg-robur-goldLight text-robur-goldDark" },
  sent: { label: "Sent", cls: "bg-green-100 text-green-700" },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || MAP.assigned;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}