import { useMemo, useState } from "react";
import { useWorkStore, TaskCard, Sprint } from "../store/useWorkStore";
import { DndContext, DragEndEvent, useDroppable, useSensor, useSensors, PointerSensor, closestCorners } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, Plus, Play, MoreVertical } from "lucide-react";

export function ScrumPage() {
  const { tasks, sprints, activeProjectId, updateTaskSprint, createSprint, startSprint, completeSprint } = useWorkStore();
  const [showModal, setShowModal] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");

  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === activeProjectId), [tasks, activeProjectId]);
  const projectSprints = useMemo(() => sprints.filter(s => s.projectId === activeProjectId).sort((a, b) => {
    if (a.state === "Active") return -1;
    if (b.state === "Active") return 1;
    return 0;
  }), [sprints, activeProjectId]);

  const backlogTasks = useMemo(() => projectTasks.filter(t => !t.sprintId), [projectTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const destinationId = String(over.id);

    // If dropped on a droppable container (sprint or backlog)
    let targetSprintId: string | null = null;
    
    if (destinationId === "backlog") {
      targetSprintId = null;
    } else if (destinationId.startsWith("sprint-")) {
      targetSprintId = destinationId.replace("sprint-", "");
    } else {
      // It might have been dropped on another task
      const overTask = projectTasks.find(t => t.id === destinationId);
      if (overTask) {
        targetSprintId = overTask.sprintId || null;
      }
    }

    const task = projectTasks.find(t => t.id === taskId);
    if (task && task.sprintId !== targetSprintId) {
      updateTaskSprint(taskId, targetSprintId);
    }
  };

  const openCreateModal = () => {
    setSprintName(`Sprint ${projectSprints.length + 1}`);
    setSprintStartDate("");
    setSprintEndDate("");
    setShowModal(true);
  };

  const handleCreateSprint = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeProjectId) return;

    const newSprint: Sprint = {
      id: `s-${Math.random().toString(36).substr(2, 9)}`,
      name: sprintName.trim(),
      projectId: activeProjectId,
      state: "Planned",
      startDate: sprintStartDate ? new Date(sprintStartDate).toISOString() : undefined,
      endDate: sprintEndDate ? new Date(sprintEndDate).toISOString() : undefined,
    };
    createSprint(newSprint);
    setShowModal(false);
  };

  return (
    <section className="h-full flex flex-col space-y-6 overflow-y-auto pr-4">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Backlog & Planning</h2>
          <p className="text-sm text-slate-500">Plan your sprints and prioritize work.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors border border-slate-300"
        >
          <Plus size={16} />
          Create Sprint
        </button>
      </header>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Plan New Sprint</h3>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreateSprint}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sprint Name</label>
                <input
                  type="text"
                  value={sprintName}
                  onChange={(event) => setSprintName(event.target.value)}
                  placeholder="e.g. Sprint 3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={sprintStartDate}
                    onChange={(event) => setSprintStartDate(event.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={sprintEndDate}
                    onChange={(event) => setSprintEndDate(event.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
                  />
                </div>
              </div>
              <div className="pt-4 flex items-center gap-3 justify-end">
                <button 
                  type="button" 
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-6">
          {/* SPRINTS */}
          {projectSprints.map(sprint => (
            <SprintContainer key={sprint.id} sprint={sprint} tasks={projectTasks.filter(t => t.sprintId === sprint.id)} onStart={() => startSprint(sprint.id)} onComplete={() => completeSprint(sprint.id)} />
          ))}

          {/* BACKLOG */}
          <BacklogContainer tasks={backlogTasks} />
        </div>
      </DndContext>
    </section>
  );
}

function SprintContainer({ sprint, tasks, onStart, onComplete }: { sprint: Sprint, tasks: TaskCard[], onStart: () => void, onComplete: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `sprint-${sprint.id}` });
  const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-colors ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'}`}>
      <div className={`p-4 border-b flex items-center justify-between ${sprint.state === 'Active' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {sprint.name}
            {sprint.state === 'Active' && <span className="bg-blue-600 text-white text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Active</span>}
            {sprint.state === 'Completed' && <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold">Completed</span>}
          </h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">{tasks.length} issues</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs">{totalPoints}</div>
            pts
          </div>
          
          {sprint.state === 'Planned' && (
            <button onClick={onStart} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors">
              <Play size={14} fill="currentColor" /> Start Sprint
            </button>
          )}
          {sprint.state === 'Active' && (
            <button onClick={onComplete} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded-md transition-colors">
              <CheckCircle2 size={14} /> Complete Sprint
            </button>
          )}
        </div>
      </div>
      
      <div ref={setNodeRef} className="p-2 min-h-[100px] flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg m-2">
            Drag issues here to plan the sprint
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => <DraggableListItem key={task.id} task={task} />)}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function BacklogContainer({ tasks }: { tasks: TaskCard[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'backlog' });
  const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-colors mt-4 ${isOver ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200'}`}>
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-800">Backlog</h3>
          <span className="text-sm font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">{tasks.length} issues</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs">{totalPoints}</div>
          pts
        </div>
      </div>
      
      <div ref={setNodeRef} className="p-2 min-h-[150px] flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg m-2">
            Your backlog is empty.
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => <DraggableListItem key={task.id} task={task} />)}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

function DraggableListItem({ task }: { task: TaskCard }) {
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
      className={`group flex items-center justify-between p-3 bg-white border rounded-lg hover:border-slate-300 transition-colors cursor-grab ${isDragging ? 'border-blue-500 shadow-md' : 'border-slate-200'}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-4">
        <MoreVertical size={16} className="text-slate-300 group-hover:text-slate-500" />
        <span className="text-xs font-mono font-semibold text-slate-500 w-16">{task.id}</span>
        <span className="text-sm font-medium text-slate-800 line-clamp-1">{task.title}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {task.labels.length > 0 && (
          <div className="hidden md:flex gap-1">
            {task.labels.slice(0, 2).map(l => (
              <span key={l} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">{l}</span>
            ))}
          </div>
        )}
        <div className={`w-2 h-2 rounded-full ${
          task.priority === 'High' ? 'bg-rose-500' :
          task.priority === 'Medium' ? 'bg-amber-500' :
          'bg-emerald-500'
        }`} title={`${task.priority} Priority`}></div>
        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold" title={task.assignee}>
          {task.assignee.charAt(0)}
        </div>
        <div className="w-6 flex justify-end text-sm font-semibold text-slate-600">{task.points}</div>
      </div>
    </div>
  );
}
