import { FormEvent, useState } from "react";
import { useWorkStore } from "../store/useWorkStore";
import { Plus, Users, LayoutList, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProjectsPage() {
  const projects = useWorkStore((state) => state.projects);
  const createProject = useWorkStore((state) => state.createProject);
  const deleteProject = useWorkStore((state) => state.deleteProject);
  const activeWorkspaceId = useWorkStore((state) => state.activeWorkspaceId);
  const setActiveProject = useWorkStore((state) => state.setActiveProject);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState("5");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeWorkspaceId) return;

    createProject({
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      workspaceId: activeWorkspaceId,
      progress: 0,
      members: Number(members),
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      columns: [
        { id: "backlog", name: "Backlog" },
        { id: "in-progress", name: "In Progress", wipLimit: 3 },
        { id: "review", name: "Review", wipLimit: 2 },
        { id: "done", name: "Done" },
      ],
    });
    setShowModal(false);
    setName("");
    setMembers("5");
    setStartDate("");
    setEndDate("");
  };

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
          <p className="text-sm text-slate-500">Manage all your projects and their progress.</p>
        </div>
        <button 
          type="button" 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          New Project
        </button>
      </header>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Create Project</h3>
            </div>
            <form className="p-6 space-y-4" onSubmit={handleCreateProject}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Website Revamp"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Team Size</label>
                <input
                  type="number"
                  min={1}
                  value={members}
                  onChange={(event) => setMembers(event.target.value)}
                  placeholder="Number of members"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <article 
            key={project.id} 
            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
            onClick={() => {
              setActiveProject(project.id);
              navigate("/board");
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <LayoutList size={20} />
              </div>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirm('Are you sure you want to delete this project? All tasks and sprints will be lost.')) {
                    deleteProject(project.id);
                  }
                }} 
                className="text-slate-300 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                title="Delete Project"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full mb-4 inline-flex">
              <Users size={14} />
              {project.members} members
            </span>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{project.name}</h3>
            <p className="text-sm text-slate-500 mb-6">Manage tasks, sprints, and track progress.</p>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="font-bold text-blue-600">{project.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
