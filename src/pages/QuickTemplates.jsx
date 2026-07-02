import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LayoutTemplate, Plus, Pencil, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const DOCS = [
  { key: "service_docket", label: "Service Docket" },
  { key: "dmt", label: "DMT" },
  { key: "mgt", label: "MGT" },
];
const EMPTY = { title: "", service_type: "", body: "", required_documents: ["service_docket"] };

export default function QuickTemplates() {
  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = () => base44.entities.JobTemplate.list("-created_date").then(setTemplates);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDoc = (key) =>
    setForm((f) => ({
      ...f,
      required_documents: f.required_documents.includes(key)
        ? f.required_documents.filter((d) => d !== key)
        : [...f.required_documents, key],
    }));

  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (t) => { setForm({ ...EMPTY, ...t }); setEditingId(t.id); setOpen(true); };

  const save = async () => {
    if (!form.title) return;
    if (editingId) await base44.entities.JobTemplate.update(editingId, form);
    else await base44.entities.JobTemplate.create(form);
    setOpen(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm("Delete this template?")) return;
    await base44.entities.JobTemplate.delete(id);
    load();
  };

  const copy = (t) => {
    navigator.clipboard.writeText(t.body || t.title);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Quick Templates"
        subtitle="Reusable job descriptions to speed up assignments."
        icon={LayoutTemplate}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> New
            </Button>
          </motion.div>
        }
      />

      {templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} text="No templates yet." />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((t) => (
            <StaggerItem key={t.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold text-robur-black truncate">{t.title}</h3>
                    {t.service_type && <div className="text-xs text-robur-goldDark font-semibold">{t.service_type}</div>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => copy(t)} className="p-1.5 text-slate-400 hover:text-robur-black">
                      {copied === t.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => openEdit(t)} className="p-1.5 text-slate-400 hover:text-robur-black"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(t.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {t.body && <p className="mt-2 text-sm text-slate-500 line-clamp-3 whitespace-pre-wrap">{t.body}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {(t.required_documents || []).map((d) => (
                    <span key={d} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{DOCS.find((x) => x.key === d)?.label || d}</span>
                  ))}
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1 h-11" /></div>
            <div><Label>Service Type</Label><Input value={form.service_type} onChange={(e) => set("service_type", e.target.value)} placeholder="Pickup, Swap, Deliver…" className="mt-1 h-11" /></div>
            <div><Label>Description</Label><Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={4} className="mt-1" /></div>
            <div>
              <Label>Required Documents</Label>
              <div className="mt-2 space-y-2">
                {DOCS.map((d) => (
                  <label key={d.key} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={form.required_documents.includes(d.key)} onCheckedChange={() => toggleDoc(d.key)} />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={save} disabled={!form.title} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}