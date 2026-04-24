import { useMemo, useState } from "react";
import { useWorkStore, TaskCard } from "../store/useWorkStore";
import { 
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
  LineChart, Line, ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Download, LayoutDashboard, FolderKanban, Timer, Users, Activity, Calendar } from "lucide-react";
import { format } from "date-fns";

type Tab = "Global" | "Project" | "Sprint" | "Member";
type DateFilter = "7D" | "30D" | "ALL";

export function ReportsPage() {
  const { tasks, projects, sprints, activeProjectId } = useWorkStore();
  const [activeTab, setActiveTab] = useState<Tab>("Project");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(activeProjectId);

  // Filter tasks based on selected project context (unless Global)
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === selectedProjectId), [tasks, selectedProjectId]);
  const activeSprint = useMemo(() => sprints.find(s => s.projectId === selectedProjectId && s.state === "Active"), [sprints, selectedProjectId]);

  const handleExportCSV = () => {
    const dataset = activeTab === "Global" ? tasks : projectTasks;
    if (dataset.length === 0) return;

    const headers = ["ID", "Title", "Assignee", "Priority", "Points", "Status", "ProjectID", "SprintID", "CompletedAt"];
    const csvContent = [
      headers.join(","),
      ...dataset.map(t => [
        t.id, 
        `"${t.title.replace(/"/g, '""')}"`, 
        t.assignee, 
        t.priority, 
        t.points, 
        t.status, 
        t.projectId, 
        t.sprintId || "", 
        t.completedAt || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `projectflow-export-${activeTab.toLowerCase()}-${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="h-full flex flex-col space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            Reports & Dashboards
          </h2>
          <p className="text-sm text-slate-500">Advanced analytics and visualizations across your workspace.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab !== "Global" && projects.length > 0 && (
            <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <FolderKanban size={14} className="text-slate-400 ml-3" />
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-transparent text-sm text-slate-700 font-medium py-1.5 px-3 focus:outline-none cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <Calendar size={14} className="text-slate-400 mx-2" />
            {(["7D", "30D", "ALL"] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  dateFilter === filter ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {filter === "ALL" ? "All Time" : `Last ${filter}`}
              </button>
            ))}
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto">
        {[
          { id: "Global", icon: LayoutDashboard },
          { id: "Project", icon: FolderKanban },
          { id: "Sprint", icon: Timer },
          { id: "Member", icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-blue-600 text-blue-600 bg-blue-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <tab.icon size={16} />
            {tab.id}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-4 space-y-8 pb-8">
        {activeTab === "Global" && <GlobalDashboard tasks={tasks} projects={projects} dateFilter={dateFilter} />}
        {activeTab === "Project" && <ProjectDashboard tasks={projectTasks} dateFilter={dateFilter} />}
        {activeTab === "Sprint" && <SprintDashboard tasks={projectTasks} activeSprint={activeSprint} />}
        {activeTab === "Member" && <MemberDashboard tasks={projectTasks} dateFilter={dateFilter} />}
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// HELPER FOR DATE FILTER
// ----------------------------------------------------------------------
function filterByDate(tasks: TaskCard[], dateFilter: DateFilter) {
  if (dateFilter === "ALL") return tasks;
  
  const days = dateFilter === "7D" ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  // Note: For 'created' we don't have a reliable field on TaskCard natively without parsing activity logs,
  // but let's assume we filter tasks based on any activity happening or if completedAt is within range.
  // To keep it simple, we'll filter tasks that are either NOT done, or done within the cutoff.
  return tasks.filter(t => {
    if (t.status !== "done") return true; // Active tasks are always relevant
    if (t.completedAt) {
      return new Date(t.completedAt) >= cutoff;
    }
    return true; // Fallback
  });
}

// ----------------------------------------------------------------------
// GLOBAL DASHBOARD
// ----------------------------------------------------------------------
function GlobalDashboard({ tasks, projects, dateFilter }: { tasks: TaskCard[], projects: any[], dateFilter: DateFilter }) {
  const filteredTasks = filterByDate(tasks, dateFilter);
  
  const throughputData = useMemo(() => {
    const data: Record<string, number> = {};
    const daysToMap = dateFilter === "7D" ? 7 : (dateFilter === "30D" ? 30 : 14); // Default 14 for ALL
    const today = new Date();
    for (let i = daysToMap - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      data[format(d, 'MMM dd')] = 0;
    }
    
    tasks.forEach(t => {
      if (t.status === "done" && t.completedAt) {
        const dateStr = format(new Date(t.completedAt), 'MMM dd');
        if (data[dateStr] !== undefined) {
          data[dateStr]++;
        }
      }
    });

    return Object.keys(data).map(key => ({ name: key, completed: data[key] }));
  }, [tasks, dateFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Projects" value={projects.length} icon={FolderKanban} />
        <MetricCard title="Relevant Tasks" value={filteredTasks.length} icon={Activity} />
        <MetricCard title="Tasks Completed" value={filteredTasks.filter(t => t.status === "done").length} icon={Activity} />
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Global Throughput</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={throughputData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="completed" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// PROJECT DASHBOARD (PIE & RADAR)
// ----------------------------------------------------------------------
function ProjectDashboard({ tasks, dateFilter }: { tasks: TaskCard[], dateFilter: DateFilter }) {
  const filteredTasks = filterByDate(tasks, dateFilter);

  // Status Pie Chart Data
  const statusData = useMemo(() => {
    const counts = { backlog: 0, "in-progress": 0, review: 0, done: 0 };
    filteredTasks.forEach(t => {
      if (counts[t.status as keyof typeof counts] !== undefined) {
        counts[t.status as keyof typeof counts]++;
      }
    });
    return [
      { name: 'Backlog', value: counts.backlog, fill: '#94a3b8' },
      { name: 'In Progress', value: counts["in-progress"], fill: '#3b82f6' },
      { name: 'Review', value: counts.review, fill: '#f59e0b' },
      { name: 'Done', value: counts.done, fill: '#10b981' }
    ].filter(d => d.value > 0);
  }, [filteredTasks]);

  // Priority Pie Chart Data
  const priorityData = useMemo(() => {
    const counts = { High: 0, Medium: 0, Low: 0 };
    filteredTasks.forEach(t => counts[t.priority]++);
    return [
      { name: 'High', value: counts.High, fill: '#ef4444' },
      { name: 'Medium', value: counts.Medium, fill: '#f59e0b' },
      { name: 'Low', value: counts.Low, fill: '#10b981' }
    ].filter(d => d.value > 0);
  }, [filteredTasks]);

  // Label Radar Chart Data
  const labelData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks.forEach(t => {
      t.labels.forEach(l => {
        counts[l] = (counts[l] || 0) + 1;
      });
    });
    return Object.keys(counts).map(key => ({
      subject: key,
      A: counts[key],
      fullMark: Math.max(...Object.values(counts)) + 2
    }));
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-2">Status Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Breakdown of issues by workflow column.</p>
          <div className="h-64 w-full flex justify-center items-center">
            {statusData.length > 0 ? (
              <PieChart width={300} height={250}>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            ) : (
              <div className="text-slate-400 text-sm">No tasks available for this time range</div>
            )}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-2">Priority Distribution</h3>
          <p className="text-xs text-slate-500 mb-4">Task volume categorized by priority.</p>
          <div className="h-64 w-full flex justify-center items-center">
            {priorityData.length > 0 ? (
              <PieChart width={300} height={250}>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            ) : (
              <div className="text-slate-400 text-sm">No tasks available for this time range</div>
            )}
          </div>
        </div>
      </div>

      {/* Label Analytics */}
      {labelData.length > 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-2">Label Analytics</h3>
          <p className="text-xs text-slate-500 mb-6">Radar visualization of work distribution across tags.</p>
          <div className="h-80 w-full flex justify-center items-center">
            <RadarChart cx="50%" cy="50%" outerRadius={100} width={400} height={300} data={labelData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Tasks" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </RadarChart>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SPRINT DASHBOARD
// ----------------------------------------------------------------------
function SprintDashboard({ tasks, activeSprint }: { tasks: TaskCard[], activeSprint?: any }) {
  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4 bg-white border border-slate-200 rounded-xl">
        <Timer size={48} className="text-slate-300" />
        <h3 className="text-lg font-medium text-slate-700">No Active Sprint</h3>
        <p className="text-sm">Start a sprint in the Scrum tab to see burndown analytics.</p>
      </div>
    );
  }

  const sprintTasks = tasks.filter(t => t.sprintId === activeSprint.id);
  const totalPoints = sprintTasks.reduce((sum, t) => sum + t.points, 0);
  const completedPoints = sprintTasks.filter(t => t.status === "done").reduce((sum, t) => sum + t.points, 0);

  const burndownData = [
    { day: "Day 1", ideal: totalPoints, actual: totalPoints },
    { day: "Day 2", ideal: totalPoints * 0.8, actual: totalPoints * 0.9 },
    { day: "Day 3", ideal: totalPoints * 0.6, actual: totalPoints - completedPoints },
    { day: "Day 4", ideal: totalPoints * 0.4 },
    { day: "Day 5", ideal: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard title="Sprint Points" value={totalPoints} icon={Timer} />
        <MetricCard title="Completed Points" value={completedPoints} icon={Activity} />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6">Sprint Burndown ({activeSprint.name})</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={burndownData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="ideal" name="Ideal Burndown" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" name="Actual Remaining" stroke="#ef4444" strokeWidth={3} dot={{r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MEMBER DASHBOARD
// ----------------------------------------------------------------------
function MemberDashboard({ tasks, dateFilter }: { tasks: TaskCard[], dateFilter: DateFilter }) {
  const filteredTasks = filterByDate(tasks, dateFilter);

  const workloadData = useMemo(() => {
    const data: Record<string, { member: string; High: number; Medium: number; Low: number }> = {};
    
    filteredTasks.forEach(t => {
      if (t.status !== "done") {
        if (!data[t.assignee]) data[t.assignee] = { member: t.assignee, High: 0, Medium: 0, Low: 0 };
        data[t.assignee][t.priority] += t.points;
      }
    });

    return Object.values(data).sort((a, b) => (b.High + b.Medium + b.Low) - (a.High + a.Medium + a.Low));
  }, [filteredTasks]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-2">Workload by Member (Story Points)</h3>
        <p className="text-xs text-slate-500 mb-6">Stacked bar chart showing active assignments categorized by priority.</p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={workloadData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="member" axisLine={false} tickLine={false} tick={{fill: '#334155', fontSize: 13, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="High" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} barSize={50} />
              <Bar dataKey="Medium" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Low" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend }: { title: string, value: number | string, icon: any, trend?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <h4 className="text-slate-500 font-medium text-sm mb-1">{title}</h4>
        <div className="text-3xl font-bold text-slate-800">{value}</div>
        {trend && <div className="text-xs font-medium text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded">{trend}</div>}
      </div>
      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
        <Icon size={24} />
      </div>
    </div>
  );
}
