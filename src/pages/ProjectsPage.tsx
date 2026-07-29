import { FormEvent, useState } from "react";
import { useWorkStore } from "../store/useWorkStore";
import { useAuthStore } from "../store/useAuthStore";
import { Plus, Users, LayoutList, Trash2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeamMembersModal } from "../components/TeamMembersModal";

export function ProjectsPage() {
  const currentUser = useAuthStore((state) => state.user);
  const projects = useWorkStore((state) => state.projects);
  const teamMembers = useWorkStore((state) => state.teamMembers);
  const createProject = useWorkStore((state) => state.createProject);
  const deleteProject = useWorkStore((state) => state.deleteProject);
  const activeWorkspaceId = useWorkStore((state) => state.activeWorkspaceId);
  const setActiveProject = useWorkStore((state) => state.setActiveProject);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [teamModalProjectId, setTeamModalProjectId] = useState<string | null>(null);
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
      members: Number(members) || teamMembers.length || 1,
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
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
          <p className="text-sm text-slate-500">Manage all your team projects and workspace boards</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 shadow-sm"
        >
          <Plus size={18} />
          Create Project
        </button>
      </header>

      {teamModalProjectId && (
        <TeamMembersModal
          isOpen={Boolean(teamModalProjectId)}
          onClose={() => setTeamModalProjectId(null)}
          projectId={teamModalProjectId}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Mobile App Redesign"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Estimated Team Size</label>
                <input
                  type="number"
                  min="1"
                  value={members}
                  onChange={(event) => setMembers(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const isCreator = currentUser?.id && project.creatorId ? project.creatorId === currentUser.id : true;

          return (
            <article 
              key={project.id} 
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
              onClick={() => {
                setActiveProject(project.id);
                navigate("/board");
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <LayoutList size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setTeamModalProjectId(project.id);
                      }} 
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 transition-colors"
                      title="Manage team members for this project"
                    >
                      <UserPlus size={14} />
                      Team
                    </button>
                    {isCreator && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (confirm('Are you sure you want to delete this project? All tasks and sprints will be lost.')) {
                            deleteProject(project.id);
                          }
                        }} 
                        className="text-slate-300 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50 ml-1"
                        title="Delete Project"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    <Users size={14} />
                    {teamMembers.filter(m => (!m.projectId || m.projectId === project.id) && m.status === "Active").length} Active Members
                  </span>
                  {isCreator ? (
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                      👑 Project Creator
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
                      👤 Team Member
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">{project.name}</h3>
                <p className="text-sm text-slate-500 mb-6">Manage tasks, sprints, and track progress for this project.</p>
              </div>
              
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
          );
        })}
      </div>
    </section>
  );
}
