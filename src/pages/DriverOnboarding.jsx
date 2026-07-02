import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { UserCheck, Plus, Pencil, Trash2, Phone, IdCard, Award, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

const EMPTY = {
  driver_name: "", license_number: "", license_class: "", license_expiry: "",
  emergency_contact_name: "", emergency_contact_phone: "", onboarding_complete: false,
  certifications: [],
};

export default function DriverOnboarding() {
  const [profiles, setProfiles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = () => base44.entities.DriverProfile.list("-created_date").then(setProfiles);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const openNew = () => { setForm(EMPTY); setEditingId(null); setOpen(true); };
  const openEdit = (p) => { setForm({ ...EMPTY, ...p, certifications: p.certifications || [] }); setEditingId(p.id); setOpen(true); };

  const addCert = () => set("certifications", [...form.certifications, { name: "", expiry: "" }]);
  const updateCert = (i, k, v) => set("certifications", form.certifications.map((c, idx) => (idx === i ? { ...c, [k]: v } : c)));
  const removeCert = (i) => set("certifications", form.certifications.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!form.driver_name) return;
    const payload = { ...form, certifications: form.certifications.filter((c) => c.name) };
    if (editingId) await base44.entities.DriverProfile.update(editingId, payload);
    else await base44.entities.DriverProfile.create(payload);
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this profile?")) return;
    await base44.entities.DriverProfile.delete(id);
    load();
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Driver Onboarding"
        subtitle="Certifications, licenses and emergency contacts for compliance."
        icon={UserCheck}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={openNew} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Add Driver
            </Button>
          </motion.div>
        }
      />

      {profiles.length === 0 ? (
        <EmptyState icon={UserCheck} text="No onboarding records yet." />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profiles.map((p) => (
            <StaggerItem key={p.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-robur-black">{p.driver_name}</h3>
                    {p.onboarding_complete && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Complete</span>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-robur-black"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(p.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-sm text-slate-500">
                  {p.license_number && <div className="flex items-center gap-2"><IdCard className="w-3.5 h-3.5" /> {p.license_class ? `${p.license_class} · ` : ""}{p.license_number}{p.license_expiry ? ` · exp ${format(new Date(p.license_expiry), "MMM yyyy")}` : ""}</div>}
                  {p.emergency_contact_name && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {p.emergency_contact_name} · {p.emergency_contact_phone}</div>}
                </div>
                {(p.certifications || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.certifications.map((c, i) => (
                      <span key={i} className="text-[10px] bg-robur-goldLight text-robur-goldDark px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Award className="w-3 h-3" /> {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Driver Profile" : "Add Driver Profile"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Driver Name</Label><Input value={form.driver_name} onChange={(e) => set("driver_name", e.target.value)} className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>License No.</Label><Input value={form.license_number} onChange={(e) => set("license_number", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Class</Label><Input value={form.license_class} onChange={(e) => set("license_class", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div><Label>License Expiry</Label><Input type="date" value={form.license_expiry} onChange={(e) => set("license_expiry", e.target.value)} className="mt-1 h-11" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Emergency Contact</Label><Input value={form.emergency_contact_name} onChange={(e) => set("emergency_contact_name", e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Contact Phone</Label><Input value={form.emergency_contact_phone} onChange={(e) => set("emergency_contact_phone", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>Certifications</Label>
                <button onClick={addCert} className="text-xs text-robur-goldDark font-semibold inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add</button>
              </div>
              <div className="mt-2 space-y-2">
                {form.certifications.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={c.name} onChange={(e) => updateCert(i, "name", e.target.value)} placeholder="Certification" className="h-10 text-sm" />
                    <Input type="date" value={c.expiry} onChange={(e) => updateCert(i, "expiry", e.target.value)} className="h-10 text-sm w-40" />
                    <button onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <Label>Onboarding complete</Label>
              <Switch checked={form.onboarding_complete} onCheckedChange={(v) => set("onboarding_complete", v)} />
            </div>
            <Button onClick={save} disabled={!form.driver_name} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}