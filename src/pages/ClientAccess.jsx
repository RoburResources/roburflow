import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { KeyRound, Search, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageTransition, Stagger, StaggerItem } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";

export default function ClientAccess() {
  const [clients, setClients] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => base44.entities.Client.list("-created_date", 500).then((c) => { setClients(c); setLoading(false); });
  useEffect(() => { load(); }, []);

  const toggle = async (client, value) => {
    setClients((list) => list.map((c) => (c.id === client.id ? { ...c, portal_access: value } : c)));
    await base44.entities.Client.update(client.id, { portal_access: value });
  };

  const filtered = clients.filter((c) => `${c.name} ${c.email || ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="Client Portal Access" subtitle="Enable clients to view their own job history and documents." icon={KeyRound} />

      <div className="relative mb-5">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients…" className="pl-9 h-11" />
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={KeyRound} text="No clients found." />
      ) : (
        <Stagger className="space-y-2">
          {filtered.map((c) => (
            <StaggerItem key={c.id}>
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-robur-black truncate">{c.name}</div>
                  {c.email ? (
                    <div className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {c.email}</div>
                  ) : (
                    <div className="text-xs text-amber-500">No email — add one to grant access</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold ${c.portal_access ? "text-emerald-600" : "text-slate-400"}`}>
                    {c.portal_access ? "Enabled" : "Disabled"}
                  </span>
                  <Switch checked={!!c.portal_access} disabled={!c.email} onCheckedChange={(v) => toggle(c, v)} />
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </PageTransition>
  );
}