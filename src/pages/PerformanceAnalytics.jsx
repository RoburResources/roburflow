import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, subDays, startOfDay } from "date-fns";
import { BarChart3, CheckCircle2, FileStack, Truck } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageTransition, Pop } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <Pop className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-extrabold text-robur-black">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </Pop>
  );
}

export default function PerformanceAnalytics() {
  const [jobs, setJobs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Job.list("-created_date", 1000),
      base44.entities.JobDocument.filter({ completed: true }, "-created_date", 1000),
    ]).then(([j, d]) => {
      setJobs(j);
      setDocs(d);
      setLoading(false);
    });
  }, []);

  const completed = jobs.filter((j) => j.status === "sent" || j.status === "submitted").length;
  const completionRate = jobs.length ? Math.round((completed / jobs.length) * 100) : 0;

  const volumeSeries = useMemo(() => {
    const days = Array.from({ length: 14 }).map((_, i) => startOfDay(subDays(new Date(), 13 - i)));
    return days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const count = docs.filter((d) => format(new Date(d.created_date), "yyyy-MM-dd") === key).length;
      return { day: format(day, "d MMM"), documents: count };
    });
  }, [docs]);

  const driverSeries = useMemo(() => {
    const map = {};
    jobs.forEach((j) => {
      if (j.status === "sent" || j.status === "submitted") {
        const name = j.assigned_driver_name || "Unassigned";
        map[name] = (map[name] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, jobs]) => ({ name, jobs })).sort((a, b) => b.jobs - a.jobs).slice(0, 8);
  }, [jobs]);

  if (loading) return <div className="p-8 text-slate-400 text-sm text-center">Loading analytics…</div>;

  return (
    <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
      <PageHeader title="Performance Analytics" subtitle="Completion rates, volume and driver productivity." icon={BarChart3} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat icon={CheckCircle2} label="Completion Rate" value={`${completionRate}%`} accent="bg-emerald-50 text-emerald-600" />
        <Stat icon={FileStack} label="Total Documents" value={docs.length} accent="bg-robur-goldLight text-robur-goldDark" />
        <Stat icon={Truck} label="Active Drivers" value={driverSeries.length} accent="bg-blue-50 text-blue-600" />
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-5">
        <h2 className="font-bold text-robur-black mb-4">Document Volume (14 days)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={volumeSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="documents" stroke="#E0A800" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <h2 className="font-bold text-robur-black mb-4">Jobs Completed by Driver</h2>
        {driverSeries.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No completed jobs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={driverSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="jobs" fill="#1A1A1A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </PageTransition>
  );
}