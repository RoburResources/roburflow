import React from "react";
import { User, Phone, MapPin, Building2, Hash } from "lucide-react";

// Read-only overview of the job details the driver sees before starting.
function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <Icon className="w-4 h-4 text-robur-goldDark mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
        <div className="text-sm font-medium text-robur-black break-words">{value}</div>
      </div>
    </div>
  );
}

export default function JobOverviewCard({ job }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <Row icon={Building2} label="Client" value={job.client_name} />
      <Row icon={MapPin} label="Site" value={job.site_name} />
      <Row icon={MapPin} label="Address" value={job.site_address} />
      <Row icon={User} label="Contact" value={job.contact_name} />
      <Row icon={Phone} label="Contact Phone" value={job.contact_phone} />
      <Row icon={Hash} label="Job Number" value={job.job_no} />
    </div>
  );
}