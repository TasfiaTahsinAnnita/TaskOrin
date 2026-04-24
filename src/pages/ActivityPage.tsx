import { useMemo } from "react";
import { useWorkStore } from "../store/useWorkStore";
import { format, parseISO } from "date-fns";
import { Clock, CheckCircle2, MessageSquare, Paperclip, PlusCircle, ArrowRightCircle } from "lucide-react";

export function ActivityPage() {
  const { tasks, projects } = useWorkStore();

  const allActivity = useMemo(() => {
    const logs: any[] = [];
    tasks.forEach(task => {
      const projectName = projects.find(p => p.id === task.projectId)?.name || "Unknown Project";
      task.activity.forEach(act => {
        logs.push({
          ...act,
          taskId: task.id,
          taskTitle: task.title,
          projectName
        });
      });
    });

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [tasks, projects]);

  const getIcon = (action: string) => {
    const low = action.toLowerCase();
    if (low.includes("comment")) return <MessageSquare size={16} className="text-blue-500" />;
    if (low.includes("attached") || low.includes("attachment")) return <Paperclip size={16} className="text-purple-500" />;
    if (low.includes("created")) return <PlusCircle size={16} className="text-emerald-500" />;
    if (low.includes("moved to done")) return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (low.includes("moved to")) return <ArrowRightCircle size={16} className="text-blue-500" />;
    return <Clock size={16} className="text-slate-400" />;
  };

  return (
    <section className="h-full flex flex-col space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Global Activity</h2>
        <p className="text-sm text-slate-500">A real-time feed of everything happening across your workspace.</p>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Events</span>
          <span className="text-xs text-slate-400">{allActivity.length} events logged</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {allActivity.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Clock size={48} className="opacity-20" />
              <p>No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-8 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100" />
              
              {allActivity.map((log, i) => (
                <div key={log.id} className="relative flex gap-6 group">
                  <div className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                    {getIcon(log.action)}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-slate-600">
                        <span className="font-bold text-slate-900">{log.user}</span>
                        {" "}{log.action}{" "}
                        <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                          {log.taskId}: {log.taskTitle}
                        </span>
                      </div>
                      <time className="text-[10px] font-bold text-slate-400 uppercase">
                        {format(parseISO(log.timestamp), "MMM d, h:mm a")}
                      </time>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      {log.projectName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
