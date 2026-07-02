import React from "react";

// Client-facing digital preview of the Service Docket shown to the client
// before they sign. CLIENT-FACING ONLY: shows the client's own details +
// Robur branding. No job numbers, no delivery/weighbridge locations, nothing internal.
export default function DocketPreview({ job, evidencePhoto }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Branded header */}
      <div className="bg-robur-black px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-robur-gold font-extrabold text-lg leading-none">ROBUR</div>
          <div className="text-white/70 text-[9px] tracking-[0.3em] mt-1">RESOURCES</div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold text-sm">SERVICE DOCKET</div>
          <div className="text-robur-gold text-[10px]">Proof of Service</div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <Field label="Client" value={job.client_name} />
        <Field label="Site" value={job.site_name || job.site_address} />
        <Field label="Contact" value={job.contact_name} />
        <Field label="Date" value={job.job_date} />
        {job.service_type && <Field label="Service" value={job.service_type} />}

        {evidencePhoto && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">Service Evidence</div>
            <img src={evidencePhoto} alt="Service evidence" className="w-full h-40 object-cover rounded-lg border border-slate-200" />
          </div>
        )}

        <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          This certifies the service described above has been completed in accordance with the
          client's requirements and Robur Resources standard operating procedures.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</span>
      <span className="text-sm font-medium text-robur-black text-right">{value}</span>
    </div>
  );
}