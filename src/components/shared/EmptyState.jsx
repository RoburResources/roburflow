import React from "react";

export default function EmptyState({ icon: Icon, text }) {
  return (
    <div className="glass-card border-dashed p-10 text-center">
      {Icon && <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />}
      <p className="text-slate-500">{text}</p>
    </div>
  );
}