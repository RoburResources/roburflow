import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { expiryStatus } from "@/pages/DriverCertifications";

const TYPE_LABEL = {
  drivers_license: "Driver's License", insurance: "Insurance", medical: "Medical", white_card: "White Card",
  dangerous_goods: "Dangerous Goods", forklift: "Forklift", other: "Other",
};

export default function ComplianceDashboard() {
  const [certs, setCerts] = useState([]);

  useEffect(() => { base44.entities.Certification.list("expiry_date").then(setCerts); }, []);

  const withStatus = certs.map((c) => ({ ...c, st: expiryStatus(c.expiry_date) }));
  const expired = withStatus.filter((c) => c.st.days !== null && c.st.days < 0);
  const expiring = withStatus.filter((c) => c.st.days !== null && c.st.days >= 0 && c.st.days <= 60);
  const valid = withStatus.filter((c) => c.st.days === null || c.st.days > 60);

  const Stat = ({ icon: Icon, label, count, tone }) => (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tone}`}><Icon className="w-5 h-5" /></div>
      <div className="text-2xl font-extrabold text-robur-black">{count}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );

  const Row = ({ c }) => (
    <StaggerItem>
      <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-robur-black">{c.driver_name}</h3>
          <div className="text-xs text-slate-400">{TYPE_LABEL[c.type]} · {c.expiry_date ? format(new Date(c.expiry_date), "d MMM yyyy") : "No expiry"}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${c.st.style}`}>{c.st.label}</span>
      </Pressable>
    </StaggerItem>
  );

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader title="Compliance Dashboard" subtitle="Fleet-wide license and certification renewals." icon={ShieldCheck} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={AlertTriangle} label="Expired" count={expired.length} tone="bg-red-50 text-red-600" />
        <Stat icon={Clock} label="Expiring ≤60d" count={expiring.length} tone="bg-amber-50 text-amber-600" />
        <Stat icon={CheckCircle2} label="Valid" count={valid.length} tone="bg-emerald-50 text-emerald-600" />
      </div>

      {certs.length === 0 ? (
        <EmptyState icon={ShieldCheck} text="No certifications tracked yet." />
      ) : (
        <div className="space-y-6">
          {expired.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-red-600 mb-2">Expired — action required</h2>
              <Stagger className="space-y-2">{expired.map((c) => <Row key={c.id} c={c} />)}</Stagger>
            </div>
          )}
          {expiring.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-amber-600 mb-2">Renewing soon</h2>
              <Stagger className="space-y-2">{expiring.map((c) => <Row key={c.id} c={c} />)}</Stagger>
            </div>
          )}
          {valid.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-400 mb-2">Valid</h2>
              <Stagger className="space-y-2">{valid.map((c) => <Row key={c.id} c={c} />)}</Stagger>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}