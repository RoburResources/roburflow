import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { nextNumber } from "@/lib/counters";
import { DOC_TYPE_LABELS } from "@/lib/documentSchemas";

const DOC_OPTIONS = ["service_docket", "dmt", "mgt"];

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    client_name: "",
    client_email: "",
    contact_name: "",
    contact_phone: "",
    site_name: "",
    site_address: "",
    job_date: format(new Date(), "yyyy-MM-dd"),
    assigned_driver_id: "",
    assigned_driver_name: "",
    required_documents: ["service_docket"],
    service_type: "",
    notes: "",
  });

  useEffect(() => {
    base44.entities.Client.list().then(setClients);
    base44.entities.Driver.filter({ active: true }).then(setDrivers);
    if (editing) {
      base44.entities.Job.get(id).then((j) => j && setForm((f) => ({ ...f, ...j })));
    }
  }, [id, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pickClient = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    setForm((f) => ({
      ...f,
      client_id: clientId,
      client_name: c?.name || "",
      client_email: c?.email || "",
      contact_name: f.contact_name || c?.contact_name || "",
      contact_phone: f.contact_phone || c?.contact_phone || "",
      site_name: f.site_name || c?.site_name || "",
      site_address: f.site_address || c?.site_address || "",
    }));
  };

  const pickDriver = (driverId) => {
    const d = drivers.find((x) => x.id === driverId);
    setForm((f) => ({ ...f, assigned_driver_id: driverId, assigned_driver_name: d?.name || "" }));
  };

  const toggleDoc = (doc) => {
    setForm((f) => {
      const has = f.required_documents.includes(doc);
      return { ...f, required_documents: has ? f.required_documents.filter((d) => d !== doc) : [...f.required_documents, doc] };
    });
  };

  const save = async () => {
    if (!form.client_name || !form.job_date) return;
    setSaving(true);
    if (editing) {
      await base44.entities.Job.update(id, form);
    } else {
      const num = await nextNumber("job");
      await base44.entities.Job.create({ ...form, job_no: `JOB-${num}`, status: "assigned" });
    }
    navigate("/jobs");
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-slate-500 mb-4 text-sm"><ArrowLeft className="w-4 h-4" /> Back to jobs</Link>
      <h1 className="text-2xl font-extrabold text-robur-black mb-6">{editing ? "Edit Job" : "New Job"}</h1>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-5">
        <div>
          <Label>Client</Label>
          {clients.length > 0 ? (
            <Select value={form.client_id} onValueChange={pickClient}>
              <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select a client" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-slate-400 mt-1">No clients yet — <Link to="/clients" className="text-robur-goldDark font-semibold">add one</Link> or type below.</p>
          )}
          <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} placeholder="Client name" className="mt-2 h-11" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Client Email</Label>
            <Input type="email" value={form.client_email} onChange={(e) => set("client_email", e.target.value)} placeholder="for sending documents" className="mt-1 h-11" />
          </div>
          <div>
            <Label>Job Date</Label>
            <Input type="date" value={form.job_date} onChange={(e) => set("job_date", e.target.value)} className="mt-1 h-11" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Contact Name</Label>
            <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} placeholder="On-site contact" className="mt-1 h-11" />
          </div>
          <div>
            <Label>Contact Phone</Label>
            <Input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="On-site phone" className="mt-1 h-11" />
          </div>
        </div>

        <div>
          <Label>Site Name</Label>
          <Input value={form.site_name} onChange={(e) => set("site_name", e.target.value)} placeholder="e.g. Shine Auto Parts" className="mt-1 h-11" />
        </div>

        <div>
          <Label>Site Address</Label>
          <Input value={form.site_address} onChange={(e) => set("site_address", e.target.value)} className="mt-1 h-11" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Assigned Driver</Label>
            <Select value={form.assigned_driver_id} onValueChange={pickDriver}>
              <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select driver" /></SelectTrigger>
              <SelectContent>
                {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Service Type</Label>
            <Input value={form.service_type} onChange={(e) => set("service_type", e.target.value)} placeholder="Pickup, Swap, Deliver…" className="mt-1 h-11" />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Required Documents</Label>
          <div className="space-y-2">
            {DOC_OPTIONS.map((doc) => (
              <label key={doc} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                <Checkbox checked={form.required_documents.includes(doc)} onCheckedChange={() => toggleDoc(doc)} />
                <span className="text-sm font-medium">{DOC_TYPE_LABELS[doc]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Notes for Driver</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="mt-1" rows={3} />
        </div>

        <Button onClick={save} disabled={saving || !form.client_name} className="w-full h-12 bg-robur-black hover:bg-black text-white font-bold">
          <Save className="w-5 h-5 mr-2" /> {saving ? "Saving…" : editing ? "Update Job" : "Create Job"}
        </Button>
      </div>
    </div>
  );
}