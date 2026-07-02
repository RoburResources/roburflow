import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { AlertTriangle, Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const TYPES = ["safety", "site_issue", "equipment_damage", "environmental", "other"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const STATUSES = ["open", "under_review", "resolved"];
const SEV_STYLE = {
  low: "bg-slate-100 text-slate-500",
  medium: "bg-amber-50 text-amber-600",
  high: "bg-orange-50 text-orange-600",
  critical: "bg-red-50 text-red-600",
};
const EMPTY = { title: "", type: "safety", severity: "medium", description: "", location: "", status: "open" };

export default function IncidentReports() {
  const { user, isAdmin } = useCurrentUser();
  const [reports, setReports] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const list = isAdmin
      ? await base44.entities.IncidentReport.list("-created_date")
      : await base44.entities.IncidentReport.filter({ reported_by_name: user?.full_name || user?.email }, "-created_date");
    setReports(list);
  };
  useEffect(() => { if (user) load(); }, [user, isAdmin]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title) return;
    await base44.entities.IncidentReport.create({ ...form, reported_by_name: user?.full_name || user?.email });
    setForm(EMPTY);
    setOpen(false);
    load();
  };

  const setStatus = async (id, status) => {
    await base44.entities.IncidentReport.update(id, { status });
    load();
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Incident Reports"
        subtitle="Flag site issues, safety concerns and equipment damage."
        icon={ShieldAlert}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={() => { setForm(EMPTY); setOpen(true); }} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Report
            </Button>
          </motion.div>
        }
      />

      {reports.length === 0 ? (
        <EmptyState icon={AlertTriangle} text="No incidents reported. Stay safe out there." />
      ) : (
        <Stagger className="space-y-3">
          {reports.map((r) => (
            <StaggerItem key={r.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-robur-black">{r.title}</h3>
                    <div className="text-xs text-slate-400">
                      {r.reported_by_name || "—"} · {format(new Date(r.created_date), "d MMM yyyy, HH:mm")}
                      {r.location ? ` · ${r.location}` : ""}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize shrink-0 ${SEV_STYLE[r.severity]}`}>{r.severity}</span>
                </div>
                {r.description && <p className="mt-2 text-sm text-slate-500 whitespace-pre-wrap">{r.description}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{r.type.replace("_", " ")}</span>
                  {isAdmin ? (
                    <Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}>
                      <SelectTrigger className="h-7 w-36 text-xs ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize ml-auto bg-robur-goldLight text-robur-goldDark">{r.status.replace("_", " ")}</span>
                  )}
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Report an Incident</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => set("severity", v)}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="mt-1" /></div>
            <Button onClick={submit} disabled={!form.title} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Submit Report</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}