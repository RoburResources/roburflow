import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Boxes, Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const CATEGORIES = ["machinery", "vehicle", "tool", "equipment", "other"];
const STATUSES = ["available", "assigned", "maintenance", "retired"];
const STATUS_STYLE = {
  available: "bg-emerald-50 text-emerald-600",
  assigned: "bg-blue-50 text-blue-600",
  maintenance: "bg-amber-50 text-amber-600",
  retired: "bg-slate-100 text-slate-500",
};
const EMPTY = { name: "", asset_tag: "", category: "tool", status: "available", assigned_driver_name: "", assigned_job_no: "", notes: "" };

export default function InventoryAssets() {
  const [assets, setAssets] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = () => base44.entities.Asset.list("-created_date").then(setAssets);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (a) => { setForm({ ...EMPTY, ...a }); setEditingId(a.id); setOpen(true); };

  const save = async () => {
    if (!form.name) return;
    if (editingId) await base44.entities.Asset.update(editingId, form);
    else await base44.entities.Asset.create(form);
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this asset?")) return;
    await base44.entities.Asset.delete(id);
    load();
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Inventory Assets"
        subtitle="Track machinery and tools, assign to jobs or drivers."
        icon={Boxes}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Add Asset
            </Button>
          </motion.div>
        }
      />

      {assets.length === 0 ? (
        <EmptyState icon={Boxes} text="No assets tracked yet." />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assets.map((a) => (
            <StaggerItem key={a.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-robur-black truncate">{a.name}</h3>
                    <div className="text-xs text-slate-400">{a.asset_tag || a.category}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-robur-black"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(a.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[a.status]}`}>{a.status}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full capitalize">{a.category}</span>
                </div>
                {(a.assigned_driver_name || a.assigned_job_no) && (
                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                    <Wrench className="w-3.5 h-3.5" />
                    {a.assigned_driver_name || ""}{a.assigned_driver_name && a.assigned_job_no ? " · " : ""}{a.assigned_job_no || ""}
                  </div>
                )}
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Asset" : "Add Asset"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => set("name", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Asset Tag</Label><Input value={form.asset_tag} onChange={(e) => set("asset_tag", e.target.value)} className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Assigned Driver</Label><Input value={form.assigned_driver_name} onChange={(e) => set("assigned_driver_name", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Assigned Job No.</Label><Input value={form.assigned_job_no} onChange={(e) => set("assigned_job_no", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <Button onClick={save} disabled={!form.name} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}