import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { format, addDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Inbox, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocTypeChips from "@/components/jobs/DocTypeChips";

const UNASSIGNED = "__unassigned__";

export default function DispatchBoard() {
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [allJobs, allDrivers] = await Promise.all([
      base44.entities.Job.list("-created_date", 500),
      base44.entities.Driver.filter({ active: true }),
    ]);
    setJobs(allJobs);
    setDrivers(allDrivers);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Jobs for this date, still assignable (not yet submitted/sent)
  const dayJobs = useMemo(
    () => jobs.filter((j) => j.job_date === date && j.status !== "submitted" && j.status !== "sent"),
    [jobs, date]
  );

  const columns = useMemo(() => {
    const cols = { [UNASSIGNED]: [] };
    drivers.forEach((d) => (cols[d.id] = []));
    dayJobs.forEach((j) => {
      const key = j.assigned_driver_id && cols[j.assigned_driver_id] ? j.assigned_driver_id : UNASSIGNED;
      cols[key].push(j);
    });
    return cols;
  }, [dayJobs, drivers]);

  const shiftDay = (n) => setDate(format(addDays(new Date(date), n), "yyyy-MM-dd"));

  const onDragEnd = async (result) => {
    const { destination, draggableId, source } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const job = jobs.find((j) => j.id === draggableId);
    if (!job) return;

    const toDriver = destination.droppableId === UNASSIGNED ? null : drivers.find((d) => d.id === destination.droppableId);
    const patch = {
      assigned_driver_id: toDriver ? toDriver.id : "",
      assigned_driver_name: toDriver ? toDriver.name : "",
    };
    // Optimistic update
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...patch } : j)));
    await base44.entities.Job.update(job.id, patch);
  };

  return (
    <div className="glass-card p-4 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-robur-gold" />
          <div>
            <h2 className="text-lg font-bold text-robur-black leading-tight">Dispatch Calendar</h2>
            <p className="text-xs text-slate-400">Drag jobs onto a driver to assign</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => shiftDay(-1)} className="text-robur-goldDark hover:bg-robur-gold/20"><ChevronLeft className="w-4 h-4" /></Button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-md bg-white/50 px-3 text-sm font-semibold text-robur-black focus:outline-none"
          />
          <Button variant="ghost" size="icon" onClick={() => shiftDay(1)} className="text-robur-goldDark hover:bg-robur-gold/20"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm py-8 text-center">Loading…</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            <DispatchColumn id={UNASSIGNED} title="Unassigned" subtitle="Drag from here" jobs={columns[UNASSIGNED]} tone="unassigned" />
            {drivers.map((d) => (
              <DispatchColumn key={d.id} id={d.id} title={d.name} subtitle={d.vehicle_rego || "Driver"} jobs={columns[d.id] || []} tone="driver" />
            ))}
            {drivers.length === 0 && (
              <div className="text-sm text-slate-400 py-6 px-4">No active drivers. Add drivers to assign jobs.</div>
            )}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

function DispatchColumn({ id, title, subtitle, jobs, tone }) {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`shrink-0 w-64 rounded-xl p-2.5 transition-colors ${
            snapshot.isDraggingOver ? "bg-robur-gold/25" : "bg-white/40"
          }`}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="min-w-0">
              <div className="font-bold text-sm text-robur-black truncate">{title}</div>
              <div className="text-[10px] text-slate-400 truncate">{subtitle}</div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-robur-gold text-robur-black">
              {jobs.length}
            </span>
          </div>

          <div className="space-y-2 min-h-[60px]">
            {jobs.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center text-slate-300 py-6">
                <Inbox className="w-6 h-6 mb-1" />
                <span className="text-[10px]">Empty</span>
              </div>
            )}
            {jobs.map((job, index) => (
              <Draggable key={job.id} draggableId={job.id} index={index}>
                {(prov, snap) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                    className={`bg-white/60 backdrop-blur-md rounded-lg p-2.5 transition-shadow ${snap.isDragging ? "shadow-lg" : "shadow-sm"}`}
                  >
                    <div className="flex items-start gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-robur-black truncate">{job.client_name}</span>
                          <span className="text-[10px] text-slate-400">{job.job_no}</span>
                        </div>
                        {job.site_address && (
                          <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" /> {job.site_address}
                          </p>
                        )}
                        <div className="mt-1.5"><DocTypeChips types={job.required_documents} /></div>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}