import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Settings2, Save, Loader2, Building2, Cpu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { PageTransition } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import DeleteAccountSection from "@/components/settings/DeleteAccountSection";

const DEFAULTS = {
  company_name: "Robur Resources",
  company_abn: "",
  company_address: "",
  company_phone: "",
  company_email: "",
  pdf_footer_note: "",
  ai_model: "Qwen/Qwen3-VL-8B-Instruct",
  cc_email: "",
  notify_on_submission: true,
  notify_on_incident: true,
};

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-background rounded-2xl p-5 border border-border shadow-sm mb-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-robur-goldDark" />
        <h2 className="font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SystemSettings() {
  const [id, setId] = useState(null);
  const [form, setForm] = useState(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.AppSettings.list("-created_date", 1).then((r) => {
      if (r[0]) { setId(r[0].id); setForm({ ...DEFAULTS, ...r[0] }); }
    });
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...DEFAULTS, ...form };
      if (id) await base44.entities.AppSettings.update(id, payload);
      else { const rec = await base44.entities.AppSettings.create(payload); setId(rec.id); }
      toast({ title: "Settings saved" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto">
      <PageHeader title="System Settings" subtitle="Company details, AI service and notifications." icon={Settings2} />

      <Section icon={Building2} title="Company / PDF Branding">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Label>Company Name</Label><Input value={form.company_name} onChange={(e) => set("company_name", e.target.value)} className="mt-1 h-11" /></div>
          <div><Label>ABN</Label><Input value={form.company_abn} onChange={(e) => set("company_abn", e.target.value)} className="mt-1 h-11" /></div>
          <div><Label>Phone</Label><Input value={form.company_phone} onChange={(e) => set("company_phone", e.target.value)} className="mt-1 h-11" /></div>
          <div className="col-span-2"><Label>Email</Label><Input value={form.company_email} onChange={(e) => set("company_email", e.target.value)} className="mt-1 h-11" /></div>
          <div className="col-span-2"><Label>Address</Label><Input value={form.company_address} onChange={(e) => set("company_address", e.target.value)} className="mt-1 h-11" /></div>
          <div className="col-span-2"><Label>PDF Footer Note</Label><Textarea value={form.pdf_footer_note} onChange={(e) => set("pdf_footer_note", e.target.value)} rows={2} className="mt-1" /></div>
        </div>
      </Section>

      <Section icon={Cpu} title="AI Service">
        <Label>Vision Model</Label>
        <Input value={form.ai_model} onChange={(e) => set("ai_model", e.target.value)} className="mt-1 h-11" />
        <p className="text-xs text-muted-foreground mt-2">
          Docket extraction runs on your connected Hugging Face account. API keys are managed securely in your workspace connectors, not here.
        </p>
      </Section>

      <Section icon={Bell} title="Notifications">
        <div className="flex items-center justify-between py-2">
          <div><div className="text-sm font-semibold text-foreground">Notify on job submission</div><div className="text-xs text-muted-foreground">Alert admins when a driver submits.</div></div>
          <Switch checked={form.notify_on_submission} onCheckedChange={(v) => set("notify_on_submission", v)} />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-border">
          <div><div className="text-sm font-semibold text-foreground">Notify on incident report</div><div className="text-xs text-muted-foreground">Alert admins on new incidents.</div></div>
          <Switch checked={form.notify_on_incident} onCheckedChange={(v) => set("notify_on_incident", v)} />
        </div>
        <div className="pt-3 border-t border-border mt-2">
          <Label>CC Email on client sends</Label>
          <Input value={form.cc_email} onChange={(e) => set("cc_email", e.target.value)} className="mt-1 h-11" />
        </div>
      </Section>

      <Button onClick={save} disabled={saving} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
        {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving…</> : <><Save className="w-5 h-5 mr-2" /> Save Settings</>}
      </Button>

      <div className="mt-6">
        <DeleteAccountSection />
      </div>
    </PageTransition>
  );
}