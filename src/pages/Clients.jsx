import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Mail, Phone, MapPin, Pencil, Trash2, Users } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import RateCardEditor from "@/components/clients/RateCardEditor";

const EMPTY = { name: "", email: "", phone: "", site_address: "", notes: "", rate_card: [] };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = () => base44.entities.Client.list("-created_date").then(setClients);
  useEffect(() => { load(); }, []);
  usePullToRefresh(load);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (c) => { setForm(c); setEditingId(c.id); setOpen(true); };

  const save = async () => {
    if (!form.name) return;
    if (editingId) await base44.entities.Client.update(editingId, form);
    else await base44.entities.Client.create(form);
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this client?")) return;
    await base44.entities.Client.delete(id);
    load();
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-robur-black">Clients</h1>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
          <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
            <Plus className="w-5 h-5 mr-1" /> Add Client
          </Button>
        </motion.div>
      </div>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No clients yet.</p>
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map((c) => (
            <StaggerItem key={c.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-robur-black">{c.name}</h3>
                  <div className="flex gap-1">
                    <button aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)} className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-robur-black hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                    <button aria-label={`Delete ${c.name}`} onClick={() => remove(c.id)} className="w-11 h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {c.email}</div>}
                  {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {c.phone}</div>}
                  {c.site_address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {c.site_address}</div>}
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Client" : "Add Client"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Site Address</Label><Input value={form.site_address} onChange={(e) => set("site_address", e.target.value)} className="mt-1 h-11" /></div>
            <RateCardEditor value={form.rate_card} onChange={(v) => set("rate_card", v)} />
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <Button onClick={save} disabled={!form.name} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}