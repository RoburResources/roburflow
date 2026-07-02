import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, isBefore, startOfDay } from "date-fns";
import { Wrench, Plus, Pencil, Trash2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const STATUSES = ["scheduled", "completed", "overdue"];
const STATUS_STYLE = {
  scheduled: "bg-blue-50 text-blue-600",
  completed: "bg-emerald-50 text-emerald-600",
  overdue: "bg-red-50 text-red-600",
};
const EMPTY = { vehicle_rego: "", service_type: "", service_date: format(new Date(), "yyyy-MM-dd"), next_service_date: "", odometer: "", cost: "", provider: "", status: "scheduled", notes: "" };

export default function MaintenanceSchedule() {
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = () => base44.entities.MaintenanceRecord.list("-service_date").then(setRecords);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r, odometer: r.odometer ?? "", cost: r.cost ?? "" }); setEditingId(r.id); setOpen(true); };

  const save = async () => {
    if (!form.vehicle_rego) return;
    const payload = { ...form, odometer: form.odometer ? Number(form.odometer) : undefined, cost: form.cost ? Number(form.cost) : undefined };
    if (editingId) await base44.entities.MaintenanceRecord.update(editingId, payload);
    else await base44.entities.MaintenanceRecord.create(payload);
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this record?")) return;
    await base44.entities.MaintenanceRecord.delete(id);
    load();
  };

  const isDue = (r) => r.status !== "completed" && r.next_service_date && isBefore(new Date(r.next_service_date), startOfDay(new Date()));

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Maintenance Schedule"
        subtitle="Log vehicle service dates and track fleet health."
        icon={Wrench}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Log Service
            </Button>
          </motion.div>
        }
      />

      {records.length === 0 ? (
        <EmptyState icon={Wrench} text="No maintenance records yet." />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {records.map((r) => (
            <StaggerItem key={r.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-robur-black">{r.vehicle_rego}</h3>
                    <div className="text-xs text-slate-400">{r.service_type || "Service"}</div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(r)} className="p-1.5 text-slate-400 hover:text-robur-black"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(r.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  <div>Serviced: {r.service_date ? format(new Date(r.service_date), "d MMM yyyy") : "—"}</div>
                  {r.next_service_date && (
                    <div className="flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" /> Next: {format(new Date(r.next_service_date), "d MMM yyyy")}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${isDue(r) ? STATUS_STYLE.overdue : STATUS_STYLE[r.status]}`}>
                    {isDue(r) ? "overdue" : r.status}
                  </span>
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Service" : "Log Service"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Vehicle Rego</Label><Input value={form.vehicle_rego} onChange={(e) => set("vehicle_rego", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Service Type</Label><Input value={form.service_type} onChange={(e) => set("service_type", e.target.value)} placeholder="Oil change, inspection…" className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Service Date</Label><Input type="date" value={form.service_date} onChange={(e) => set("service_date", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Next Service</Label><Input type="date" value={form.next_service_date} onChange={(e) => set("next_service_date", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Odometer</Label><Input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Cost (AUD)</Label><Input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div><Label>Provider</Label><Input value={form.provider} onChange={(e) => set("provider", e.target.value)} className="mt-1 h-11" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <Button onClick={save} disabled={!form.vehicle_rego} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}