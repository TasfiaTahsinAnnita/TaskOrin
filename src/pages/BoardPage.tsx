import { FormEvent, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { DndContext, useDroppable, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskCard } from "../store/useWorkStore";
import { useWorkStore } from "../store/useWorkStore";
import { Plus, X, Search, Clock, User, Filter, LayoutTemplate, Trash2, Paperclip, MessageSquare, ListTodo } from "lucide-react";
import { format } from "date-fns";

export function BoardPage() {
  const { tasks, projects, sprints, activeProjectId, updateTask, moveTaskStatus, createTask, addActivity, deleteTask } = useWorkStore();
  
  const project = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
  const columns = project?.columns || [];
  
  const activeSprint = useMemo(() => sprints.find(s => s.projectId === activeProjectId && s.state === "Active"), [sprints, activeProjectId]);
  
  const [showActiveSprintOnly, setShowActiveSprintOnly] = useState(true);
  const [groupBy, setGroupBy] = useState<"None" | "Assignee" | "Priority">("None");
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("Aisha");
  const [priority, setPriority] = useState<TaskCard["priority"]>("Medium");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [selectedTask, setSelectedTask] = useState<TaskCard | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const projectTasksRaw = useMemo(() => tasks.filter(t => t.projectId === activeProjectId), [tasks, activeProjectId]);
  
  const projectTasks = useMemo(() => {
    let filtered = projectTasksRaw;
    if (showActiveSprintOnly && activeSprint) {
      filtered = filtered.filter(t => t.sprintId === activeSprint.id);
    }
    return filtered.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.labels.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesAssignee = assigneeFilter === "All" || task.assignee === assigneeFilter;
      return matchesSearch && matchesAssignee;
    });
  }, [projectTasksRaw, showActiveSprintOnly, activeSprint, searchQuery, assigneeFilter]);

  const assigneesList = useMemo(() => {
    const set = new Set<string>();
    projectTasksRaw.forEach((task) => set.add(task.assignee));
    return ["All", ...Array.from(set)];
  }, [projectTasksRaw]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    
    const task = projectTasks.find(t => t.id === active.id);
    if (!task) return;

    // The destination id might be a columnId (if no swimlanes) or a composite \`cell-${swimlaneKey}-${columnId}\`
    const destinationStr = String(over.id);
    let targetColumnId = destinationStr;
    let targetSwimlaneValue: string | null = null;
    
    if (destinationStr.startsWith("cell-")) {
      const parts = destinationStr.replace("cell-", "").split("---");
      if (parts.length === 2) {
        targetSwimlaneValue = parts[0];
        targetColumnId = parts[1];
      }
    }

    if (task.status === targetColumnId && 
        (!targetSwimlaneValue || (groupBy === "Assignee" && task.assignee === targetSwimlaneValue) || (groupBy === "Priority" && task.priority === targetSwimlaneValue))) {
      return; // No change
    }

    const destCol = columns.find(c => c.id === targetColumnId);
    const destTasksCount = projectTasksRaw.filter(t => t.status === targetColumnId).length;

    if (destCol?.wipLimit && task.status !== targetColumnId && destTasksCount >= destCol.wipLimit) {
      alert(`WIP Limit reached for ${destCol.name}`);
      return;
    }

    // Move status
    if (task.status !== targetColumnId) {
      moveTaskStatus(String(active.id), targetColumnId);
    }
    
    // Move swimlane if applicable
    if (targetSwimlaneValue) {
      if (groupBy === "Assignee" && task.assignee !== targetSwimlaneValue) {
        updateTask(task.id, t => ({ ...t, assignee: targetSwimlaneValue as string }));
      } else if (groupBy === "Priority" && task.priority !== targetSwimlaneValue) {
        updateTask(task.id, t => ({ ...t, priority: targetSwimlaneValue as TaskCard["priority"] }));
      }
    }
  };

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeProjectId) return;
    
    const newTask: TaskCard = {
      id: `PM-${Math.floor(200 + Math.random() * 700)}`,
      title: title.trim(),
      assignee,
      priority,
      points: 3, // Default points
      description: description.trim(),
      dueDate: new Date().toISOString().split('T')[0],
      labels: [],
      comments: [],
      status: "backlog",
      projectId: activeProjectId,
      activity: [{ id: Math.random().toString(), action: "Task created", timestamp: new Date().toISOString(), user: "System" }]
    };

    createTask(newTask);
    setShowTaskForm(false);
    setTitle("");
  };

  const openTask = (task: TaskCard) => {
    setSelectedTask(task);
    setCommentInput("");
  };

  const addComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTask || !commentInput.trim()) return;

    const text = commentInput.trim();
    updateTask(selectedTask.id, (task) => ({ ...task, comments: [...task.comments, text] }));
    addActivity(selectedTask.id, `Added comment: "${text}"`, "Current User");
    
    setSelectedTask((task) => (task ? { 
      ...task, 
      comments: [...task.comments, text],
      activity: [{ id: Math.random().toString(), action: `Added comment: "${text}"`, timestamp: new Date().toISOString(), user: "Current User" }, ...task.activity]
    } : task));
    
    setCommentInput("");
  };

  const handleAddAttachment = () => {
    if (!selectedTask) return;
    const fileNames = ["design_spec_v2.pdf", "mockup_final.png", "user_feedback_summary.docx", "sprint_report.xlsx"];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    useWorkStore.getState().addAttachment(selectedTask.id, randomFile);
    setSelectedTask(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), randomFile] } : null);
  };

  // Swimlane grouping logic
  const swimlanes = useMemo(() => {
    if (groupBy === "None") return [];
    
    const keys = new Set<string>();
    projectTasks.forEach(t => {
      if (groupBy === "Assignee") keys.add(t.assignee);
      if (groupBy === "Priority") keys.add(t.priority);
    });
    
    return Array.from(keys).sort();
  }, [groupBy, projectTasks]);

  return (
    <section className="h-full flex flex-col space-y-4">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Kanban Board
            {activeSprint && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {activeSprint.name} (Active)
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500">Manage tasks visually across stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-sm" 
            onClick={() => setShowTaskForm(!showTaskForm)}
          >
            {showTaskForm ? <X size={16} /> : <Plus size={16} />}
            {showTaskForm ? "Close Form" : "New Task"}
          </button>
        </div>
      </header>

      {/* Task Form logic omitted for brevity, keeping existing implementation */}
      {showTaskForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shrink-0">
          <form className="flex flex-col gap-4" onSubmit={handleCreateTask}>
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Quick Add Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option>Aisha</option>
                <option>Ravi</option>
                <option>Nina</option>
                <option>Karan</option>
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskCard["priority"])} className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-y" />
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-slate-800 text-white px-5 py-2 rounded-md font-medium text-sm hover:bg-slate-700 transition-colors">Create Task</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 border border-slate-200 rounded-lg shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by title or labels..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <Filter size={16} className="text-slate-400" />
          <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="text-sm border border-slate-300 rounded-md py-1.5 pl-2 pr-6 outline-none bg-slate-50">
            {assigneesList.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <LayoutTemplate size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Group By:</span>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as any)} className="text-sm border border-slate-300 rounded-md py-1.5 pl-2 pr-6 outline-none bg-slate-50">
            <option value="None">None</option>
            <option value="Assignee">Assignee</option>
            <option value="Priority">Priority</option>
          </select>
        </div>
        {activeSprint && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input type="checkbox" checked={showActiveSprintOnly} onChange={(e) => setShowActiveSprintOnly(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" />
              Active Sprint Only
            </label>
          </div>
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-auto bg-slate-50/50 rounded-xl border border-slate-200">
          
          {/* COLUMN HEADERS */}
          <div className="flex gap-4 p-4 min-w-max border-b border-slate-200 bg-slate-100/50 sticky top-0 z-10">
            {groupBy !== "None" && <div className="w-48 shrink-0 flex items-center"><span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Swimlane</span></div>}
            {columns.map(column => {
              const colTasks = projectTasksRaw.filter(t => t.status === column.id);
              const isOverLimit = column.wipLimit && colTasks.length > column.wipLimit;
              return (
                <div key={column.id} className="min-w-[280px] max-w-[320px] shrink-0 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 text-sm">{column.name}</h3>
                  {column.wipLimit && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isOverLimit ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600"}`}>
                      WIP: {column.wipLimit}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* BOARD BODY */}
          <div className="p-4 min-w-max">
            {groupBy === "None" ? (
              <div className="flex gap-4 h-full min-h-[500px]">
                {columns.map(column => {
                  const tasksInCol = projectTasks.filter(t => t.status === column.id);
                  return (
                    <div key={column.id} className="bg-slate-100 rounded-xl min-w-[280px] max-w-[320px] shrink-0 border border-slate-200 flex flex-col">
                      <div className="flex-1 p-2">
                        <SortableContext items={tasksInCol.map(t => t.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2 min-h-[100px] h-full">
                            {tasksInCol.map(task => <DraggableTaskCard key={task.id} task={task} onOpen={openTask} />)}
                            <DropZone columnId={column.id} />
                          </div>
                        </SortableContext>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {swimlanes.map(lane => (
                  <div key={lane} className="flex gap-4 border-b border-slate-200 pb-6 last:border-b-0">
                    <div className="w-48 shrink-0">
                      <div className="sticky top-16 font-bold text-slate-800 flex items-center gap-2">
                        {groupBy === "Assignee" ? (
                          <><div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{lane.charAt(0)}</div> {lane}</>
                        ) : (
                          <><div className={`w-3 h-3 rounded-full ${lane === 'High' ? 'bg-rose-500' : lane === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div> {lane}</>
                        )}
                      </div>
                    </div>
                    {columns.map(column => {
                      const tasksInCell = projectTasks.filter(t => t.status === column.id && (groupBy === "Assignee" ? t.assignee === lane : t.priority === lane));
                      const cellId = `cell-${lane}---${column.id}`;
                      return (
                        <div key={cellId} className="bg-slate-100 rounded-xl min-w-[280px] max-w-[320px] shrink-0 border border-slate-200 flex flex-col min-h-[150px]">
                          <div className="flex-1 p-2">
                            <SortableContext items={tasksInCell.map(t => t.id)} strategy={verticalListSortingStrategy}>
                              <div className="space-y-2 h-full min-h-[100px]">
                                {tasksInCell.map(task => <DraggableTaskCard key={task.id} task={task} onOpen={openTask} />)}
                                <DropZone columnId={cellId} />
                              </div>
                            </SortableContext>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DndContext>

      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => setSelectedTask(null)}>
          <article className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded">{selectedTask.id}</span>
                <h3 className="text-xl font-bold text-slate-800">{selectedTask.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  className="p-2 hover:bg-red-100 rounded-full text-red-500 transition-colors" 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this task?')) {
                      deleteTask(selectedTask.id);
                      setSelectedTask(null);
                    }
                  }}
                  title="Delete Task"
                >
                  <Trash2 size={20} />
                </button>
                <button type="button" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors" onClick={() => setSelectedTask(null)}>
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <ListTodo size={16} className="text-blue-600" />
                    Description
                  </h4>
                  <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{selectedTask.description || "No description provided."}</p>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Paperclip size={16} className="text-blue-600" />
                      Attachments
                    </h4>
                    <button 
                      onClick={handleAddAttachment}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                    >
                      + Add Mock File
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(selectedTask.attachments || []).length > 0 ? (
                      selectedTask.attachments?.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-white hover:border-blue-300 transition-colors cursor-pointer group">
                          <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600">
                            <Paperclip size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-700 truncate">{file}</div>
                            <div className="text-[10px] text-slate-400">2.4 MB</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                        No attachments yet.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-600" />
                    Conversation & History
                  </h4>
                  <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                    {selectedTask.comments.map((comment, i) => (
                      <div key={`c-${i}`} className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-slate-700">
                        <div className="font-semibold text-blue-800 mb-1 flex items-center gap-1.5"><User size={14}/> Comment</div>
                        {comment}
                      </div>
                    ))}
                    {selectedTask.activity.map((act) => (
                      <div key={act.id} className="flex gap-3 text-sm text-slate-500 items-start">
                        <div className="mt-0.5"><Clock size={14} /></div>
                        <div>
                          <span className="font-medium text-slate-700">{act.user}</span> {act.action}
                          <div className="text-xs text-slate-400 mt-0.5">{format(new Date(act.timestamp), 'MMM d, yyyy HH:mm')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <form className="flex gap-2" onSubmit={addComment}>
                    <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="Add a comment..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">Send</button>
                  </form>
                </div>
              </div>
              
              <div className="space-y-5 bg-slate-50 p-4 rounded-xl border border-slate-100 h-fit">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assignee</div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{selectedTask.assignee.charAt(0)}</div>
                    {selectedTask.assignee}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</div>
                  <div className="inline-flex items-center text-sm font-medium bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md capitalize">
                    {columns.find(c => c.id === selectedTask.status)?.name || selectedTask.status}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sprint</div>
                  <div className="text-sm font-medium text-slate-800">
                    {sprints.find(s => s.id === selectedTask.sprintId)?.name || "Backlog"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Priority</div>
                  <div className={`inline-flex items-center text-sm font-semibold px-2.5 py-1 rounded-full ${
                    selectedTask.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                    selectedTask.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {selectedTask.priority}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Points</div>
                  <div className="text-sm font-medium text-slate-700">{selectedTask.points}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</div>
                  <div className="text-sm font-medium text-slate-700">{selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM d, yyyy') : "Not set"}</div>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function DraggableTaskCard({ task, onOpen }: { task: TaskCard; onOpen: (task: TaskCard) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border ${isDragging ? 'border-blue-500 shadow-lg' : 'border-slate-200 shadow-sm'} rounded-xl p-3 cursor-pointer hover:border-slate-300 transition-colors`}
      onClick={() => onOpen(task)}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{task.id}</span>
        <button type="button" className="text-slate-400 hover:text-blue-600 transition-colors" onClick={(e) => { e.stopPropagation(); onOpen(task); }}>
          <div className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded hover:bg-blue-50">Open</div>
        </button>
      </div>
      <h4 className="text-sm font-bold text-slate-800 leading-snug mb-3 line-clamp-2">{task.title}</h4>
      
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.slice(0, 2).map(l => (
            <span key={l} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium">{l}</span>
          ))}
          {task.labels.length > 2 && <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">+{task.labels.length - 2}</span>}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold" title={task.assignee}>
            {task.assignee.charAt(0)}
          </div>
          <span className="text-xs font-medium text-slate-500">{task.points}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${
          task.priority === 'High' ? 'bg-rose-500' :
          task.priority === 'Medium' ? 'bg-amber-500' :
          'bg-emerald-500'
        }`} title={`${task.priority} Priority`}></div>
      </div>
    </div>
  );
}

function DropZone({ columnId }: { columnId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[24px] mt-2 rounded-lg border-2 border-dashed transition-colors ${isOver ? "border-blue-400 bg-blue-50/50" : "border-transparent"}`}
    />
  );
}
