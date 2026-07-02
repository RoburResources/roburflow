import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths,
  format, isSameMonth, isSameDay, isToday,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/motion/Motion";
import PageHeader from "@/components/shared/PageHeader";

const STATUS_DOT = {
  assigned: "bg-slate-400",
  in_progress: "bg-blue-500",
  submitted: "bg-amber-500",
  sent: "bg-emerald-500",
};

export default function DispatchCalendar() {
  const [jobs, setJobs] = useState([]);
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    base44.entities.Job.list("-job_date", 1000).then(setJobs);
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    jobs.forEach((j) => {
      if (!j.job_date) return;
      (map[j.job_date] = map[j.job_date] || []).push(j);
    });
    return map;
  }, [jobs]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const list = [];
    let d = start;
    while (d <= end) { list.push(d); d = addDays(d, 1); }
    return list;
  }, [cursor]);

  return (
    <PageTransition className="p-4 md:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Dispatch Calendar"
        subtitle="Job assignments by date — spot scheduling gaps at a glance."
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft className="w-4 h-4" /></Button>
            <div className="font-bold text-robur-black w-32 text-center">{format(cursor, "MMMM yyyy")}</div>
            <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        }
      />

      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-robur-black text-white text-center text-xs font-semibold py-2">{d}</div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayJobs = byDate[key] || [];
          const muted = !isSameMonth(day, cursor);
          return (
            <div key={key} className={`bg-white min-h-[92px] md:min-h-[110px] p-1.5 ${muted ? "opacity-40" : ""}`}>
              <div className={`text-xs font-semibold mb-1 flex items-center justify-center w-6 h-6 rounded-full ${isToday(day) ? "bg-robur-gold text-robur-black" : "text-slate-500"}`}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayJobs.slice(0, 3).map((j) => (
                  <Link key={j.id} to={`/jobs/${j.id}`} className="block bg-slate-50 hover:bg-slate-100 rounded-md px-1.5 py-1 text-[10px] truncate">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${STATUS_DOT[j.status] || "bg-slate-400"}`} />
                    <span className="text-robur-black font-medium align-middle">{j.client_name}</span>
                  </Link>
                ))}
                {dayJobs.length > 3 && <div className="text-[10px] text-slate-400 px-1.5">+{dayJobs.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
        {Object.entries(STATUS_DOT).map(([status, cls]) => (
          <div key={status} className="flex items-center gap-1.5 capitalize">
            <span className={`w-2 h-2 rounded-full ${cls}`} /> {status.replace("_", " ")}
          </div>
        ))}
      </div>
    </PageTransition>
  );
}