import React from "react";

export default function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-11 h-11 rounded-2xl bg-robur-goldLight flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-robur-goldDark" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-robur-black truncate">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}