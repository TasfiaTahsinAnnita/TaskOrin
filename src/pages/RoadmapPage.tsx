import { useMemo, useState } from "react";
import { useWorkStore } from "../store/useWorkStore";
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, isValid, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronRight, ChevronDown, Map } from "lucide-react";

type ZoomLevel = "Weeks" | "Months";

export function RoadmapPage() {
  const { projects, sprints } = useWorkStore();
  const [zoom, setZoom] = useState<ZoomLevel>("Weeks");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(projects.map(p => p.id)));
  const [selectedItem, setSelectedItem] = useState<{ type: 'project' | 'sprint', id: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ start: "", end: "" });
  const updateProject = useWorkStore(state => state.updateProject);
  const updateSprint = useWorkStore(state => state.updateSprint);
  const completeSprint = useWorkStore(state => state.completeSprint);
  const [showEndConfirm, setShowEndConfirm] = useState<string | null>(null);

  const toggleProject = (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProjects(next);
  };

  // Calculate global timeline bounds
  const timelineBounds = useMemo(() => {
    let earliest = new Date();
    earliest.setMonth(earliest.getMonth() - 1); // default 1 month ago
    let latest = new Date();
    latest.setMonth(latest.getMonth() + 3); // default 3 months ahead

    projects.forEach(p => {
      if (p.startDate && isValid(new Date(p.startDate))) {
        const sd = new Date(p.startDate);
        if (sd < earliest) earliest = sd;
      }
      if (p.endDate && isValid(new Date(p.endDate))) {
        const ed = new Date(p.endDate);
        if (ed > latest) latest = ed;
      }
    });

    sprints.forEach(s => {
      if (s.startDate && isValid(new Date(s.startDate))) {
        const sd = new Date(s.startDate);
        if (sd < earliest) earliest = sd;
      }
      if (s.endDate && isValid(new Date(s.endDate))) {
        const ed = new Date(s.endDate);
        if (ed > latest) latest = ed;
      }
    });

    return { start: startOfDay(startOfMonth(earliest)), end: startOfDay(endOfMonth(latest)) };
  }, [projects, sprints]);

  // +1 because start and end day are inclusive visually
  const totalDays = differenceInDays(timelineBounds.end, timelineBounds.start) + 1;
  const dayWidth = zoom === "Weeks" ? 35 : 12; // pixels per day
  const timelineWidth = totalDays * dayWidth;

  // Generate timeline headers
  const headers = useMemo(() => {
    const cols = [];
    let current = new Date(timelineBounds.start);
    while (current <= timelineBounds.end) {
      if (zoom === "Months") {
        const span = differenceInDays(endOfMonth(current), current) + 1;
        cols.push({ 
          label: format(current, "MMMM"), 
          subLabel: format(current, "yyyy"), 
          date: new Date(current), 
          span 
        });
        current = addDays(endOfMonth(current), 1);
      } else {
        const span = 7;
        cols.push({ 
          label: format(current, "MMM d"), 
          subLabel: format(addDays(current, 6), "- MMM d"), 
          date: new Date(current), 
          span 
        });
        current = addDays(current, 7);
      }
    }
    return cols;
  }, [timelineBounds, zoom]);

  const calculateStyle = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return { display: 'none' };
    const start = startOfDay(new Date(startDate));
    const end = startOfDay(new Date(endDate));
    if (!isValid(start) || !isValid(end)) return { display: 'none' };

    const offsetDays = differenceInDays(start, timelineBounds.start);
    const durationDays = differenceInDays(end, start) || 1;

    const left = Math.max(0, offsetDays * dayWidth);
    const width = durationDays * dayWidth;

    return {
      left: `${left}px`,
      width: `${width}px`,
    };
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    if (selectedItem.type === 'sprint') {
      updateSprint(selectedItem.id, {
        startDate: editData.start ? new Date(editData.start).toISOString() : undefined,
        endDate: editData.end ? new Date(editData.end).toISOString() : undefined,
      });
    } else if (selectedItem.type === 'project') {
      updateProject(selectedItem.id, {
        startDate: editData.start ? new Date(editData.start).toISOString() : undefined,
        endDate: editData.end ? new Date(editData.end).toISOString() : undefined,
      });
    }
    setIsEditing(false);
  };

  const startEditing = (start?: string, end?: string) => {
    setEditData({
      start: start ? format(new Date(start), 'yyyy-MM-dd') : "",
      end: end ? format(new Date(end), 'yyyy-MM-dd') : ""
    });
    setIsEditing(true);
  };

  const handleEndSprint = (id: string) => {
    completeSprint(id, format(new Date(), 'yyyy-MM-dd'));
    setShowEndConfirm(null);
    setSelectedItem(null);
  };

  const getDetails = () => {
    if (!selectedItem) return null;
    if (selectedItem.type === 'project') {
      const p = projects.find(x => x.id === selectedItem.id);
      if (!p) return null;
      return (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-lg w-80">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-slate-800 text-lg truncate pr-4">{p.name}</h3>
            {!isEditing && (
              <button 
                onClick={() => startEditing(p.startDate, p.endDate)}
                className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Edit Project
              </button>
            )}
          </div>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mb-3">Project</span>
          
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={editData.start}
                  onChange={e => setEditData({ ...editData, start: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={editData.end}
                  onChange={e => setEditData({ ...editData, end: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white text-xs font-bold py-1.5 rounded hover:bg-blue-700">Save</button>
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-1.5 rounded hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">{p.progress}% Completed • {p.members} Members</p>
              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>Start: {p.startDate ? format(new Date(p.startDate), 'MMM d, yyyy') : 'TBD'}</span>
                <span>End: {p.endDate ? format(new Date(p.endDate), 'MMM d, yyyy') : 'TBD'}</span>
              </div>
            </>
          )}
        </div>
      );
    } else {
      const s = sprints.find(x => x.id === selectedItem.id);
      if (!s) return null;
      return (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-lg w-80">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-slate-800 text-lg truncate pr-4">{s.name}</h3>
            {!isEditing && (
              <button 
                onClick={() => startEditing(s.startDate, s.endDate)}
                className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Edit Sprint
              </button>
            )}
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-3 ${s.state === 'Active' ? 'bg-emerald-100 text-emerald-800' : s.state === 'Completed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>{s.state} Sprint</span>
          
          {isEditing ? (
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={editData.start}
                  onChange={e => setEditData({ ...editData, start: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={editData.end}
                  onChange={e => setEditData({ ...editData, end: e.target.value })}
                  className="w-full text-sm border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white text-xs font-bold py-1.5 rounded hover:bg-blue-700">Save</button>
                <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-1.5 rounded hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 mb-4">{s.goal || "No sprint goal defined."}</p>
          )}

          {!isEditing && (
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span>Start: {s.startDate ? format(new Date(s.startDate), 'MMM d, yyyy') : 'TBD'}</span>
                <span>End: {s.endDate ? format(new Date(s.endDate), 'MMM d, yyyy') : 'TBD'}</span>
              </div>
              
              {s.state === 'Active' && !s.endDate && (
                <div className="pt-2 border-t border-slate-100">
                  {showEndConfirm === s.id ? (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <p className="text-xs text-amber-800 font-medium mb-2">Do you want to end the sprint on {format(new Date(), 'MMM d')}?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEndSprint(s.id)}
                          className="flex-1 bg-amber-600 text-white text-[10px] font-bold py-1 rounded hover:bg-amber-700"
                        >
                          Yes, End Now
                        </button>
                        <button 
                          onClick={() => setShowEndConfirm(null)}
                          className="flex-1 bg-white text-slate-600 text-[10px] font-bold py-1 rounded border border-slate-200 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowEndConfirm(s.id)}
                      className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      End Sprint
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <section className="h-full flex flex-col space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Roadmap
          </h2>
          <p className="text-sm text-slate-500">Long-term planning and sprint timelines.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <CalendarIcon size={14} className="text-slate-400 mx-2" />
            {(["Weeks", "Months"] as ZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setZoom(level)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  zoom === level 
                    ? 'bg-blue-600 text-white shadow-sm scale-105' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto flex flex-col">
          <div className="min-w-max flex flex-col">
            
            {/* Timeline Header Row */}
            <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-30 min-w-max w-full">
              <div className="w-64 shrink-0 border-r border-slate-200 p-4 font-bold text-slate-700 flex items-center bg-slate-50 sticky left-0 z-40 shadow-[1px_0_0_#e2e8f0]">
                Projects & Sprints
              </div>
              <div className="flex" style={{ width: `${timelineWidth}px` }}>
                {headers.map((h, i) => (
                  <div 
                    key={i} 
                    className="shrink-0 border-r border-slate-200 p-2 flex flex-col items-center justify-center text-xs text-slate-500"
                    style={{ width: `${h.span * dayWidth}px` }}
                  >
                    <span className="font-semibold text-slate-700">{h.label}</span>
                    {h.subLabel && <span>{h.subLabel}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Body Rows */}
            <div className="flex-1 relative pb-20 w-full min-w-max">
              
              {/* Background Grid Lines */}
              <div className="absolute top-0 bottom-0 flex pointer-events-none" style={{ left: '256px', width: `${timelineWidth}px` }}>
                {headers.map((h, i) => (
                  <div 
                    key={`grid-${i}`} 
                    className="shrink-0 border-r border-slate-100 h-full relative"
                    style={{ width: `${h.span * dayWidth}px` }}
                  >
                    {zoom === "Weeks" && (
                      <div className="absolute inset-0 flex">
                        {[...Array(7)].map((_, day) => (
                          <div key={day} className="flex-1 border-r border-slate-50/50" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Today Indicator */}
              {differenceInDays(new Date(), timelineBounds.start) >= 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-red-500 z-40 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                  style={{ 
                    left: `${256 + (differenceInDays(startOfDay(new Date()), timelineBounds.start) * dayWidth)}px` 
                  }}
                >
                  <div className="absolute top-0 -left-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              )}

              <div className="w-full flex flex-col relative z-10">
                {projects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center w-full sticky left-0 mt-20">
                    <Map size={48} className="text-slate-300 mb-4" />
                    <p>No projects available to map on the roadmap.</p>
                  </div>
                ) : (
                  projects.map(project => {
                    const projectSprints = sprints.filter(s => s.projectId === project.id);
                    const isExpanded = expandedProjects.has(project.id);

                    return (
                      <div key={project.id} className="flex flex-col border-b border-slate-100 relative min-w-max w-full">
                        {/* Project Row */}
                        <div className="flex h-14 hover:bg-slate-50 transition-colors group">
                          <div 
                            className="w-64 shrink-0 border-r border-slate-200 p-4 flex items-center gap-2 cursor-pointer bg-white sticky left-0 z-20 shadow-[1px_0_0_#e2e8f0]"
                            onClick={() => toggleProject(project.id)}
                          >
                            {projectSprints.length > 0 ? (
                              isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />
                            ) : (
                              <div className="w-4" />
                            )}
                            <span className="font-semibold text-slate-800 text-sm truncate">{project.name}</span>
                          </div>
                          <div className="relative cursor-pointer" style={{ width: `${timelineWidth}px` }} onClick={() => setSelectedItem({ type: 'project', id: project.id })}>
                            {project.startDate && project.endDate && (
                              <div 
                                className="absolute top-3 bottom-3 rounded-full opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-3"
                                style={{ 
                                  ...calculateStyle(project.startDate, project.endDate),
                                  backgroundColor: '#3b82f6', 
                                }}
                              >
                                <span className="text-white text-xs font-semibold truncate mix-blend-overlay drop-shadow-md">{project.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sprint Rows */}
                        {isExpanded && projectSprints.map(sprint => {
                          const todayStr = format(new Date(), 'yyyy-MM-dd');
                          const effectiveEndDate = sprint.endDate || (sprint.state === 'Active' ? todayStr : (sprint.startDate ? format(addDays(new Date(sprint.startDate), 14), 'yyyy-MM-dd') : todayStr));

                          return (
                          <div key={sprint.id} className="flex h-12 bg-slate-50/50 hover:bg-slate-100 transition-colors group">
                            <div className="w-64 shrink-0 border-r border-slate-200 py-3 pl-10 pr-4 flex items-center bg-slate-50/90 sticky left-0 z-20 shadow-[1px_0_0_#e2e8f0]">
                              <span className="text-sm text-slate-600 truncate">{sprint.name}</span>
                            </div>
                            <div className="relative cursor-pointer" style={{ width: `${timelineWidth}px` }} onClick={() => setSelectedItem({ type: 'sprint', id: sprint.id })}>
                              {sprint.startDate && effectiveEndDate && (
                                <div 
                                  className="absolute top-2.5 bottom-2.5 rounded-full flex items-center px-3 shadow-sm border"
                                  style={{ 
                                    ...calculateStyle(sprint.startDate, effectiveEndDate),
                                    backgroundColor: sprint.state === 'Active' ? '#10b981' : sprint.state === 'Completed' ? '#94a3b8' : '#f59e0b',
                                    borderColor: sprint.state === 'Active' ? '#059669' : sprint.state === 'Completed' ? '#64748b' : '#d97706',
                                  }}
                                >
                                  <span className="text-white text-xs font-medium truncate drop-shadow-sm">{sprint.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )})}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Detail Panel */}
        {selectedItem && (
          <div className="absolute bottom-6 right-6 z-50">
            <div className="relative">
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-slate-900 shadow-md"
              >
                ×
              </button>
              {getDetails()}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
