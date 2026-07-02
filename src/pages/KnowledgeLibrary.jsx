import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { BookOpen, Plus, Trash2, FileDown, ChevronRight } from "lucide-react";
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

const CATEGORIES = ["safety_procedure", "company_policy", "sop", "manual", "guide", "other"];
const CAT_LABEL = {
  safety_procedure: "Safety Procedure", company_policy: "Company Policy", sop: "SOP", manual: "Manual", guide: "Guide", other: "Other",
};
const EMPTY = { title: "", category: "guide", body: "", attachment_url: "", published: true };

// Shared documentation library. Serves both /quick-references and /resource-library.
export default function KnowledgeLibrary({ title = "Quick References", subtitle = "Safety procedures, policies and guides." }) {
  const { isAdmin } = useCurrentUser();
  const [articles, setArticles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [reading, setReading] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = () => base44.entities.KnowledgeArticle.list("-created_date").then(setArticles);
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title) return;
    await base44.entities.KnowledgeArticle.create(form);
    setForm(EMPTY);
    setOpen(false);
    load();
  };
  const remove = async (id) => {
    if (!confirm("Delete this article?")) return;
    await base44.entities.KnowledgeArticle.delete(id);
    load();
  };

  const visible = articles.filter((a) => (isAdmin || a.published) && (filter === "all" || a.category === filter));

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={BookOpen}
        actions={isAdmin && (
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Button onClick={() => { setForm(EMPTY); setOpen(true); }} className="bg-robur-gold hover:bg-robur-goldDark text-robur-black font-bold">
              <Plus className="w-5 h-5 mr-1" /> New Article
            </Button>
          </motion.div>
        )}
      />

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {["all", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium ${filter === c ? "bg-robur-black text-white" : "bg-white border border-slate-200 text-slate-500"}`}
          >
            {c === "all" ? "All" : CAT_LABEL[c]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={BookOpen} text="No documents available." />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((a) => (
            <StaggerItem key={a.id}>
              <Pressable className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-robur-goldLight text-robur-goldDark font-semibold">{CAT_LABEL[a.category]}</span>
                    <h3 className="font-bold text-robur-black mt-1.5">{a.title}</h3>
                  </div>
                  {isAdmin && <button onClick={() => remove(a.id)} className="p-1.5 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {a.body && (
                    <button onClick={() => setReading(a)} className="flex items-center gap-1 text-sm font-semibold text-robur-black">
                      Read <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {a.attachment_url && (
                    <a href={a.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm font-semibold text-robur-goldDark ml-auto">
                      <FileDown className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>
              </Pressable>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Dialog open={!!reading} onOpenChange={(o) => !o && setReading(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{reading?.title}</DialogTitle></DialogHeader>
          <div className="prose prose-sm max-w-none text-slate-600">
            <ReactMarkdown>{reading?.body || ""}</ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Article</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} className="mt-1 h-11" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CAT_LABEL[c]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Content (markdown)</Label><Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={5} className="mt-1" /></div>
            <div>
              <Label className="mb-2 block">Attachment (optional)</Label>
              <PhotoCapture photos={form.attachment_url ? [form.attachment_url] : []} onChange={(urls) => set("attachment_url", urls[urls.length - 1] || "")} accept="image/*,application/pdf" allowCamera={false} />
            </div>
            <Button onClick={save} disabled={!form.title} className="w-full h-11 bg-robur-black hover:bg-black text-white font-bold">Publish</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}