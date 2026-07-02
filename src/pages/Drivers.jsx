import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Mail, Phone, Truck, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";

const EMPTY = { name: "", email: "", phone: "", vehicle_rego: "", active: true };

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = () => base44.entities.Driver.list("-created_date").then(setDrivers);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (d) => { setForm(d); setEditingId(d.id); setOpen(true); };

  const save = async () => {
    if (!form.name) return;
    if (editingId) await base44.entities.Driver.update(editingId, form);
    else await base44.entities.Driver.create(form);
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this driver?")) return;
    await base44.entities.Driver.delete(id);
    load();
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold text-robur-black">Drivers</h1>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
            <Plus className="w-5 h-5 mr-1" /> Add Driver
          </Button>
        </motion.div>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Drivers log in with the email below. Invite them from the app members area so their login email matches.
      </p>

      {drivers.length === 0 ? (
        <div className="glass-card border-dashed p-10 text-center">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No drivers yet.</p>
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {drivers.map((d) => (
            <StaggerItem key={d.id}>
              <Pressable className="glass-card p-4 h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-robur-black">{d.name}</h3>
                    {!d.active && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 text-slate-400 hover:text-robur-black"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(d.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  {d.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {d.email}</div>}
                  {d.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {d.phone}</div>}
                  {d.vehicle_rego && <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5" /> {d.vehicle_rego}</div>}
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Driver" : "Add Driver"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Login Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Vehicle Rego</Label><Input value={form.vehicle_rego} onChange={(e) => set("vehicle_rego", e.target.value)} className="mt-1 h-11" /></div>
            <Button onClick={save} disabled={!form.name} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}