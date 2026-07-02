import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, differenceInDays } from "date-fns";
import { BadgeCheck, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PhotoCapture from "@/components/capture/PhotoCapture";

const TYPES = ["drivers_license", "insurance", "medical", "white_card", "dangerous_goods", "forklift", "other"];
const TYPE_LABEL = {
  drivers_license: "Driver's License", insurance: "Insurance", medical: "Medical", white_card: "White Card",
  dangerous_goods: "Dangerous Goods", forklift: "Forklift", other: "Other",
};
const EMPTY = { driver_name: "", type: "drivers_license", cert_number: "", issued_date: "", expiry_date: "", document_url: "", notes: "" };

export function expiryStatus(expiry) {
  if (!expiry) return { label: "No expiry", style: "bg-slate-100 text-slate-500", days: null };
  const days = differenceInDays(new Date(expiry), new Date());
  if (days < 0) return { label: "Expired", style: "bg-red-50 text-red-600", days };
  if (days <= 30) return { label: `${days}d left`, style: "bg-orange-50 text-orange-600", days };
  if (days <= 60) return { label: `${days}d left`, style: "bg-amber-50 text-amber-600", days };
  return { label: "Valid", style: "bg-emerald-50 text-emerald-600", days };
}

export default function DriverCertifications() {
  const [certs, setCerts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = () => base44.entities.Certification.list("-expiry_date").then(setCerts);
  useEffect(() => { load(); base44.entities.Driver.list().then(setDrivers); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (c) => { setForm({ ...EMPTY, ...c }); setEditingId(c.id); setOpen(true); };

  const save = async () => {
    if (!form.driver_name) return;
    if (editingId) await base44.entities.Certification.update(editingId, form);
    else await base44.entities.Certification.create(form);
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this certification?")) return;
    await base44.entities.Certification.delete(id);
    load();
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Driver Certifications"
        subtitle="Track licenses, insurance and compliance expiry dates."
        icon={BadgeCheck}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={openNew} className="cta-aurora hover:opacity-90 text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Add Certification
            </Button>
          </motion.div>
        }
      />

      {certs.length === 0 ? (
        <EmptyState icon={BadgeCheck} text="No certifications on file." />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {certs.map((c) => {
            const st = expiryStatus(c.expiry_date);
            return (
              <StaggerItem key={c.id}>
                <Pressable className="glass-card glass-lift p-4 h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{c.driver_name}</h3>
                      <div className="text-xs text-muted-foreground">{TYPE_LABEL[c.type]}{c.cert_number ? ` · ${c.cert_number}` : ""}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(c.id)} className="p-1.5 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {c.expiry_date ? `Expires ${format(new Date(c.expiry_date), "d MMM yyyy")}` : "No expiry date"}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.style}`}>{st.label}</span>
                    {c.document_url && (
                      <a href={c.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-robur-goldDark font-semibold ml-auto">
                        <FileText className="w-3.5 h-3.5" /> Document
                      </a>
                    )}
                  </div>
                </Pressable>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Certification" : "Add Certification"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Driver</Label>
              <Select value={form.driver_name || ""} onValueChange={(v) => set("driver_name", v)}>
                <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select driver" /></SelectTrigger>
                <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Certificate Number</Label><Input value={form.cert_number} onChange={(e) => set("cert_number", e.target.value)} className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Issued</Label><Input type="date" value={form.issued_date} onChange={(e) => set("issued_date", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Expiry</Label><Input type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div>
              <Label className="mb-2 block">Document</Label>
              <PhotoCapture photos={form.document_url ? [form.document_url] : []} onChange={(urls) => set("document_url", urls[urls.length - 1] || "")} accept="image/*,application/pdf" allowCamera={false} />
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="mt-1" /></div>
            <Button onClick={save} disabled={!form.driver_name} className="w-full h-11 cta-aurora hover:opacity-90 text-robur-black font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}