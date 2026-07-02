import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Fuel, Plus, Trash2, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageTransition, Stagger, StaggerItem, Pressable, Pop, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const EMPTY = { vehicle_rego: "", driver_name: "", fuel_date: format(new Date(), "yyyy-MM-dd"), litres: "", cost: "", odometer: "", station: "" };

export default function FuelLogs() {
  const { user } = useCurrentUser();
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = () => base44.entities.FuelLog.list("-fuel_date", 300).then(setLogs);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm({ ...EMPTY, driver_name: user?.full_name || "" }); setOpen(true); };

  const save = async () => {
    if (!form.vehicle_rego) return;
    await base44.entities.FuelLog.create({
      ...form,
      litres: form.litres ? Number(form.litres) : undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      odometer: form.odometer ? Number(form.odometer) : undefined,
    });
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this entry?")) return;
    await base44.entities.FuelLog.delete(id);
    load();
  };

  const totals = useMemo(() => {
    const cost = logs.reduce((s, l) => s + (l.cost || 0), 0);
    const litres = logs.reduce((s, l) => s + (l.litres || 0), 0);
    return { cost, litres };
  }, [logs]);

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Fuel Logs"
        subtitle="Track fuel purchases and operational cost per vehicle."
        icon={Fuel}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Add Entry
            </Button>
          </motion.div>
        }
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Pop className="bg-robur-black text-white rounded-2xl p-4">
          <div className="text-xs text-white/50">Total Spend</div>
          <div className="text-2xl font-extrabold text-robur-gold">${totals.cost.toFixed(2)}</div>
        </Pop>
        <Pop className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="text-xs text-slate-400">Total Litres</div>
          <div className="text-2xl font-extrabold text-robur-black">{totals.litres.toFixed(1)} L</div>
        </Pop>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={Fuel} text="No fuel entries yet." />
      ) : (
        <Stagger className="space-y-2">
          {logs.map((l) => (
            <StaggerItem key={l.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-robur-black">{l.vehicle_rego}</div>
                  <div className="text-xs text-slate-400">
                    {l.fuel_date ? format(new Date(l.fuel_date), "d MMM yyyy") : ""} · {l.driver_name || "—"}
                    {l.station ? ` · ${l.station}` : ""}
                  </div>
                  {l.odometer ? <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Gauge className="w-3.5 h-3.5" /> {l.odometer} km</div> : null}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-robur-black">${(l.cost || 0).toFixed(2)}</div>
                  <div className="text-xs text-slate-400">{(l.litres || 0).toFixed(1)} L</div>
                  <button onClick={() => remove(l.id)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 className="w-4 h-4 inline" /></button>
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Fuel Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Vehicle Rego</Label><Input value={form.vehicle_rego} onChange={(e) => set("vehicle_rego", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Driver</Label><Input value={form.driver_name} onChange={(e) => set("driver_name", e.target.value)} className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.fuel_date} onChange={(e) => set("fuel_date", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Station</Label><Input value={form.station} onChange={(e) => set("station", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Litres</Label><Input type="number" value={form.litres} onChange={(e) => set("litres", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Cost</Label><Input type="number" value={form.cost} onChange={(e) => set("cost", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Odometer</Label><Input type="number" value={form.odometer} onChange={(e) => set("odometer", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <Button onClick={save} disabled={!form.vehicle_rego} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}