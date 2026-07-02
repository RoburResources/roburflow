import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Wallet, Plus, Fuel, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageTransition, Stagger, StaggerItem, Pressable, motion } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import PhotoCapture from "@/components/capture/PhotoCapture";

const CATEGORIES = ["fuel", "tolls", "parking", "maintenance", "supplies", "other"];
const STATUSES = ["pending", "approved", "reimbursed", "rejected"];
const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-blue-50 text-blue-600",
  reimbursed: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
};
const EMPTY = { category: "fuel", amount: "", expense_date: format(new Date(), "yyyy-MM-dd"), job_no: "", description: "", receipt_url: "" };

export default function ExpenseTracker() {
  const { user, isAdmin } = useCurrentUser();
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const list = isAdmin
      ? await base44.entities.Expense.list("-expense_date")
      : await base44.entities.Expense.filter({ driver_email: user?.email }, "-expense_date");
    setExpenses(list);
  };
  useEffect(() => { if (user) load(); }, [user]);
  useEffect(() => { base44.entities.Job.list("-job_date", 100).then(setJobs); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.amount) return;
    const job = jobs.find((j) => j.job_no === form.job_no);
    const payload = {
      ...form,
      amount: Number(form.amount),
      job_id: job?.id,
      driver_name: user?.full_name || user?.email,
      driver_email: user?.email,
      status: "pending",
    };
    // Optimistically show the new expense immediately.
    const optimistic = { ...payload, id: `temp-${Date.now()}` };
    setExpenses((prev) => [optimistic, ...prev]);
    setForm(EMPTY);
    setOpen(false);
    await base44.entities.Expense.create(payload);
    load();
  };

  const setStatus = async (id, status) => {
    await base44.entities.Expense.update(id, { status });
    load();
  };

  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <PageTransition className="p-4 md:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Expense Tracker"
        subtitle="Log fuel, tolls and costs against jobs for reimbursement."
        icon={Wallet}
        actions={
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={() => { setForm(EMPTY); setOpen(true); }} className="cta-aurora hover:opacity-90 text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> Log Expense
            </Button>
          </motion.div>
        }
      />

      <div className="glass-card p-4 mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">{isAdmin ? "Total logged" : "Your total"}</span>
        <span className="text-2xl font-semibold text-foreground tabular-mono">${total.toFixed(2)}</span>
      </div>

      {expenses.length === 0 ? (
        <EmptyState icon={Fuel} text="No expenses logged yet." />
      ) : (
        <Stagger className="space-y-3">
          {expenses.map((e) => (
            <StaggerItem key={e.id}>
              <Pressable className="glass-card glass-lift p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground capitalize">{e.category}</h3>
                      {e.job_no && <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/5 text-muted-foreground tabular-mono">{e.job_no}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {e.expense_date ? format(new Date(e.expense_date), "d MMM yyyy") : "—"}
                      {isAdmin && e.driver_name ? ` · ${e.driver_name}` : ""}
                    </div>
                    {e.description && <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-foreground tabular-mono">${(e.amount || 0).toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {e.receipt_url && (
                    <a href={e.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-robur-goldDark font-semibold">
                      <ReceiptIcon className="w-3.5 h-3.5" /> Receipt
                    </a>
                  )}
                  {isAdmin ? (
                    <Select value={e.status} onValueChange={(v) => setStatus(e.id, v)}>
                      <SelectTrigger className="h-7 w-32 text-xs ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ml-auto ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                  )}
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Expense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => set("category", v)}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount (AUD)</Label><Input type="number" value={form.amount} onChange={(e) => set("amount", e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={form.expense_date} onChange={(e) => set("expense_date", e.target.value)} className="mt-1 h-11" /></div>
              <div>
                <Label>Job</Label>
                <Select value={form.job_no || "none"} onValueChange={(v) => set("job_no", v === "none" ? "" : v)}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No job</SelectItem>
                    {jobs.filter((j) => j.job_no).map((j) => <SelectItem key={j.id} value={j.job_no}>{j.job_no} · {j.client_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="mt-1" /></div>
            <div>
              <Label className="mb-2 block">Receipt</Label>
              <PhotoCapture photos={form.receipt_url ? [form.receipt_url] : []} onChange={(urls) => set("receipt_url", urls[urls.length - 1] || "")} label="Add Receipt" />
            </div>
            <Button onClick={save} disabled={!form.amount} className="w-full h-11 cta-aurora hover:opacity-90 text-robur-black font-bold">Save Expense</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}