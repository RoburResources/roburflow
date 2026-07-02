import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { AlertTriangle, Wrench, CalendarClock, ShieldAlert, ArrowRight } from "lucide-react";
import { PageTransition, Stagger, StaggerItem, Pressable } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const SEV_STYLE = {
  low: "bg-slate-100 text-slate-500", medium: "bg-amber-50 text-amber-600",
  high: "bg-orange-50 text-orange-600", critical: "bg-red-50 text-red-600",
};

export default function MaintenanceAlerts() {
  const [records, setRecords] = useState([]);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    base44.entities.MaintenanceRecord.list("next_service_date").then(setRecords);
    base44.entities.IncidentReport.filter({ type: "equipment_damage" }, "-created_date").then(setIncidents);
  }, []);

  const today = new Date();
  const upcoming = records
    .filter((r) => r.status !== "completed" && r.next_service_date)
    .map((r) => ({ ...r, days: differenceInDays(new Date(r.next_service_date), today) }))
    .sort((a, b) => a.days - b.days);

  const overdue = upcoming.filter((r) => r.days < 0);
  const soon = upcoming.filter((r) => r.days >= 0 && r.days <= 14);
  const later = upcoming.filter((r) => r.days > 14);
  const openDamage = incidents.filter((i) => i.status !== "resolved");

  const badge = (days) =>
    days < 0 ? { t: `${Math.abs(days)}d overdue`, s: "bg-red-50 text-red-600" }
    : days <= 14 ? { t: `${days}d`, s: "bg-orange-50 text-orange-600" }
    : { t: `${days}d`, s: "bg-emerald-50 text-emerald-600" };

  const Stat = ({ icon: Icon, label, count, tone }) => (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${tone}`}><Icon className="w-5 h-5" /></div>
      <div className="text-2xl font-extrabold text-robur-black">{count}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );

  const MaintRow = ({ r }) => {
    const b = badge(r.days);
    return (
      <StaggerItem>
        <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-robur-black">{r.vehicle_rego}</h3>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" /> {r.service_type || "Service"} · {format(new Date(r.next_service_date), "d MMM yyyy")}
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${b.s}`}>{b.t}</span>
        </Pressable>
      </StaggerItem>
    );
  };

  const nothing = upcoming.length === 0 && openDamage.length === 0;

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Maintenance Alerts"
        subtitle="Upcoming schedules and urgent repair alerts."
        icon={AlertTriangle}
        actions={
          <Link to="/maintenance-schedule" className="flex items-center gap-1 text-sm font-semibold text-robur-goldDark">
            Schedule <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={AlertTriangle} label="Overdue" count={overdue.length} tone="bg-red-50 text-red-600" />
        <Stat icon={Wrench} label="Due ≤14d" count={soon.length} tone="bg-orange-50 text-orange-600" />
        <Stat icon={ShieldAlert} label="Damage reports" count={openDamage.length} tone="bg-amber-50 text-amber-600" />
      </div>

      {nothing ? (
        <EmptyState icon={Wrench} text="No maintenance due and no open damage reports." />
      ) : (
        <div className="space-y-6">
          {openDamage.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-red-600 mb-2">Urgent — equipment damage reported</h2>
              <Stagger className="space-y-2">
                {openDamage.map((i) => (
                  <StaggerItem key={i.id}>
                    <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-robur-black">{i.title}</h3>
                        <div className="text-xs text-slate-400">{i.location || "—"} · {format(new Date(i.created_date), "d MMM yyyy")}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize shrink-0 ${SEV_STYLE[i.severity]}`}>{i.severity}</span>
                    </Pressable>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          )}
          {overdue.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-red-600 mb-2">Overdue services</h2>
              <Stagger className="space-y-2">{overdue.map((r) => <MaintRow key={r.id} r={r} />)}</Stagger>
            </div>
          )}
          {soon.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-orange-600 mb-2">Due within 2 weeks</h2>
              <Stagger className="space-y-2">{soon.map((r) => <MaintRow key={r.id} r={r} />)}</Stagger>
            </div>
          )}
          {later.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-400 mb-2">Upcoming</h2>
              <Stagger className="space-y-2">{later.map((r) => <MaintRow key={r.id} r={r} />)}</Stagger>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  );
}