import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Receipt, Loader2, FileDown, Calculator, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateSettlementImage } from "@/lib/settlementHtml";

export default function Settlements() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(format(new Date(), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ paid_to: "", payment_method: "", payment_reference: "", payment_status: "Pending", payment_date: format(new Date(), "yyyy-MM-dd") });
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    base44.entities.JobDocument.filter({ completed: true }, "-created_date", 500).then((d) => {
      setDocs(d.filter((x) => x.doc_type === "dmt" || x.doc_type === "mgt"));
      setLoading(false);
    });
  }, []);

  const rateFor = (client, material) => {
    if (!client?.rate_card || !material) return null;
    const m = String(material).trim().toLowerCase();
    const hit = client.rate_card.find((r) => String(r.material || "").trim().toLowerCase() === m);
    return hit ? parseFloat(hit.rate) : null;
  };

  const buildFromRange = async () => {
    // Pull jobs + clients so we can price each ticket from the client's rate card
    const [jobs, clients] = await Promise.all([
      base44.entities.Job.list("-job_date", 500),
      base44.entities.Client.list("-created_date", 500),
    ]);
    const jobById = Object.fromEntries(jobs.map((j) => [j.id, j]));
    const clientById = Object.fromEntries(clients.map((c) => [c.id, c]));
    const inRange = docs.filter((d) => {
      const j = jobById[d.job_id];
      if (!j?.job_date) return false;
      return j.job_date >= from && j.job_date <= to;
    });
    const rows = inRange.map((d) => {
      const data = d.data || {};
      const j = jobById[d.job_id];
      const client = j ? clientById[j.client_id] : null;
      const material = data.description || data.material_grade || "";
      const net = parseFloat(data.weight_net) || 0;
      // Prefer the client's rate card; fall back to any rate captured on the ticket
      const rate = rateFor(client, material) ?? (parseFloat(data.unit_price) || 0);
      const amount = rate && net ? (rate * net).toFixed(2) : (data.total_price || data.amount_aud || "");
      return { ref: d.doc_no, material, net_weight: data.weight_net || "", rate: rate || "", amount };
    });
    setItems(rows);

    // Auto-fill the header from the job(s) in range — payment reference = job number
    const firstJob = inRange.map((d) => jobById[d.job_id]).find(Boolean);
    if (firstJob) {
      setMeta((m) => ({
        ...m,
        paid_to: m.paid_to || firstJob.client_name || "",
        payment_reference: m.payment_reference || firstJob.job_no || "",
      }));
    }
  };

  const updateItem = (i, k, v) => setItems((list) => list.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addItem = () => setItems((l) => [...l, { ref: "", material: "", net_weight: "", rate: "", amount: "" }]);
  const removeItem = (i) => setItems((l) => l.filter((_, idx) => idx !== i));

  const totalNet = items.reduce((s, it) => s + (parseFloat(it.net_weight) || 0), 0);
  const totalPayment = items.reduce((s, it) => s + (parseFloat(String(it.amount).replace(/[^0-9.]/g, "")) || 0), 0);

  const generate = async () => {
    setGenerating(true);
    setPdfUrl("");
    try {
      const url = await generateSettlementImage({
        ...meta,
        settlement_period: from === to ? format(new Date(from), "d MMM yyyy") : `${format(new Date(from), "d MMM")} – ${format(new Date(to), "d MMM yyyy")}`,
        total_net_weight: totalNet.toFixed(2),
        total_payment: totalPayment.toFixed(2),
        total_loads: items.length,
        line_items: items,
      });
      setPdfUrl(url);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-foreground mb-1 tracking-tighter">Daily Settlement Summary</h1>
      <p className="text-sm text-muted-foreground mb-6">Aggregate completed tickets into a payment summary for a client.</p>

      <div className="glass-card p-5 mb-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><Label>From Date</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 h-11" /></div>
          <div><Label>To Date</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 h-11" /></div>
        </div>
        <Button onClick={buildFromRange} disabled={loading} className="w-full h-11 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
          <Calculator className="w-4 h-4 mr-2" /> Pull Tickets in Range
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div><Label>Paid To</Label><Input value={meta.paid_to} onChange={(e) => setMeta({ ...meta, paid_to: e.target.value })} className="mt-1 h-11" /></div>
        <div><Label>Payment Method</Label><Input value={meta.payment_method} onChange={(e) => setMeta({ ...meta, payment_method: e.target.value })} className="mt-1 h-11" /></div>
        <div><Label>Payment Reference</Label><Input value={meta.payment_reference} onChange={(e) => setMeta({ ...meta, payment_reference: e.target.value })} className="mt-1 h-11" /></div>
        <div><Label>Payment Status</Label><Input value={meta.payment_status} onChange={(e) => setMeta({ ...meta, payment_status: e.target.value })} className="mt-1 h-11" /></div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-robur-black">Line Items</h2>
        <button onClick={addItem} className="text-sm text-robur-goldDark font-semibold inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add row</button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card border-dashed p-8 text-center text-slate-500 text-sm mb-5">
          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          Pull tickets from a date range, or add rows manually.
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {items.map((it, i) => (
            <div key={i} className="bg-white/50 backdrop-blur-md rounded-xl p-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <Input value={it.ref} onChange={(e) => updateItem(i, "ref", e.target.value)} placeholder="Ref" className="h-10 text-sm" />
                <Input value={it.material} onChange={(e) => updateItem(i, "material", e.target.value)} placeholder="Material" className="h-10 text-sm" />
                <Input value={it.net_weight} onChange={(e) => updateItem(i, "net_weight", e.target.value)} placeholder="Net (t)" className="h-10 text-sm tabular-mono" />
                <Input value={it.rate} onChange={(e) => updateItem(i, "rate", e.target.value)} placeholder="Rate" className="h-10 text-sm tabular-mono" />
                <Input value={it.amount} onChange={(e) => updateItem(i, "amount", e.target.value)} placeholder="Amount (AUD)" className="h-10 text-sm tabular-mono" />
                <button onClick={() => removeItem(i)} className="flex items-center justify-center text-red-500 bg-white/50 rounded-md h-10"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-card p-5 mb-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><div className="text-xs text-muted-foreground font-medium">Total Net</div><div className="text-lg font-semibold text-foreground tabular-mono">{totalNet.toFixed(2)} t</div></div>
          <div><div className="text-xs text-muted-foreground font-medium">Total Payment</div><div className="text-lg font-semibold text-robur-goldDark tabular-mono">${totalPayment.toFixed(2)}</div></div>
          <div><div className="text-xs text-muted-foreground font-medium">Total Loads</div><div className="text-lg font-semibold text-foreground tabular-mono">{items.length}</div></div>
        </div>
      </div>

      <Button onClick={generate} disabled={generating || items.length === 0} className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
        {generating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating…</> : <><FileDown className="w-5 h-5 mr-2" /> Generate Summary Image</>}
      </Button>

      {pdfUrl && (
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="block mt-4">
          <Button className="w-full h-12 bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold"><FileDown className="w-5 h-5 mr-2" /> Open Generated Image</Button>
        </a>
      )}
    </div>
  );
}