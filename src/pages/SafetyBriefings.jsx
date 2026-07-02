import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { ShieldCheck, Plus, Trash2, CheckCircle2, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import PullToRefreshIndicator from "@/components/shared/PullToRefreshIndicator";
import EmptyState from "@/components/shared/EmptyState";

const CATEGORIES = ["safety", "operational", "policy", "urgent"];
const CAT_STYLE = {
  safety: "bg-emerald-50 text-emerald-600",
  operational: "bg-blue-50 text-blue-600",
  policy: "bg-slate-100 text-slate-500",
  urgent: "bg-red-50 text-red-600",
};
const EMPTY = { title: "", body: "", category: "safety", mandatory: true, active: true };

export default function SafetyBriefings() {
  const { user, isAdmin } = useCurrentUser();
  const [briefings, setBriefings] = useState([]);
  const [acks, setAcks] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [b, a] = await Promise.all([
      base44.entities.SafetyBriefing.list("-created_date"),
      base44.entities.BriefingAck.list("-created_date"),
    ]);
    setBriefings(b);
    setAcks(a);
  };
  useEffect(() => { load(); }, []);
  const { isRefreshing } = usePullToRefresh(load);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title) return;
    await base44.entities.SafetyBriefing.create(form);
    setForm(EMPTY);
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this briefing?")) return;
    await base44.entities.SafetyBriefing.delete(id);
    load();
  };

  const myEmail = user?.email;
  const hasAcked = (bid) => acks.some((a) => a.briefing_id === bid && a.driver_email === myEmail);
  const ackCount = (bid) => acks.filter((a) => a.briefing_id === bid).length;

  const acknowledge = async (b) => {
    const optimistic = {
      id: `temp-${b.id}`,
      briefing_id: b.id,
      briefing_title: b.title,
      driver_name: user?.full_name || user?.email,
      driver_email: user?.email,
    };
    setAcks((prev) => [optimistic, ...prev]);
    await base44.entities.BriefingAck.create({
      briefing_id: b.id,
      briefing_title: b.title,
      driver_name: user?.full_name || user?.email,
      driver_email: user?.email,
    });
    load();
  };

  const visible = isAdmin ? briefings : briefings.filter((b) => b.active);

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Safety Briefings"
        subtitle={isAdmin ? "Post mandatory notices drivers must acknowledge." : "Review and acknowledge before your shift."}
        icon={ShieldCheck}
        actions={isAdmin && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={() => { setForm(EMPTY); setOpen(true); }} className="cta-aurora hover:opacity-90 text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> New Briefing
            </Button>
          </motion.div>
        )}
      />

      <PullToRefreshIndicator isRefreshing={isRefreshing} />

      {visible.length === 0 ? (
        <EmptyState icon={ShieldCheck} text="No briefings posted." />
      ) : (
        <Stagger className="space-y-3">
          {visible.map((b) => {
            const acked = hasAcked(b.id);
            return (
              <StaggerItem key={b.id}>
                <Pressable className="glass-card glass-lift p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{b.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${CAT_STYLE[b.category]}`}>{b.category}</span>
                        {b.mandatory && <span className="text-[10px] px-2 py-0.5 rounded-full bg-robur-goldLight text-robur-goldDark font-semibold">Mandatory</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(b.created_date), "d MMM yyyy")}</div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => remove(b.id)} aria-label={`Delete briefing ${b.title}`} className="p-1.5 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                  {b.body && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{b.body}</p>}

                  <div className="mt-3 flex items-center justify-between">
                    {isAdmin ? (
                      <span className="text-xs text-muted-foreground"><span className="tabular-mono">{ackCount(b.id)}</span> acknowledgement{ackCount(b.id) === 1 ? "" : "s"}</span>
                    ) : acked ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Acknowledged</span>
                    ) : (
                      <Button onClick={() => acknowledge(b)} className="h-9 cta-aurora hover:opacity-90 text-robur-black font-bold">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> I Acknowledge
                      </Button>
                    )}
                    {b.category === "urgent" && <AlertOctagon className="w-5 h-5 text-red-500" />}
                  </div>
                </Pressable>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Briefing</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1 h-11" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Content</Label><Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={5} className="mt-1" /></div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={form.mandatory} onCheckedChange={(v) => set("mandatory", v)} />
              Mandatory acknowledgement before shift
            </label>
            <Button onClick={save} disabled={!form.title} className="w-full h-11 cta-aurora hover:opacity-90 text-robur-black font-bold">Post Briefing</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}