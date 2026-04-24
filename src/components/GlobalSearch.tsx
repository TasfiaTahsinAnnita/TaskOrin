import { useState, useEffect, useRef } from "react";
import { Search, X, KanbanSquare, Folder, ListTodo, Command } from "lucide-react";
import { useWorkStore } from "../store/useWorkStore";
import { useNavigate } from "react-router-dom";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { tasks, projects, sprints, setActiveProject } = useWorkStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const filteredProjects = query ? projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : [];
  const filteredTasks = query ? tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : [];
  const filteredSprints = query ? sprints.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : [];

  const handleSelectProject = (id: string) => {
    setActiveProject(id);
    navigate("/board");
    setIsOpen(false);
    setQuery("");
  };

  const handleSelectTask = (task: any) => {
    setActiveProject(task.projectId);
    navigate("/board");
    setIsOpen(false);
    setQuery("");
    // In a real app we might trigger opening the drawer here
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-400 text-sm hover:border-slate-300 transition-all w-64 shadow-sm"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search everything...</span>
        <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 shadow-sm">
          <Command size={10} /> K
        </div>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center px-4 py-4 border-b border-slate-100">
              <Search className="text-slate-400 mr-3" size={20} />
              <input 
                ref={inputRef}
                type="text" 
                placeholder="Search tasks, projects, sprints..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-lg"
              />
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {query && filteredProjects.length === 0 && filteredTasks.length === 0 && filteredSprints.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic">No results found for "{query}"</div>
              )}
              
              {!query && <div className="p-8 text-center text-slate-400 text-sm">Start typing to search across the workspace...</div>}

              {filteredProjects.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Projects</div>
                  {filteredProjects.map(p => (
                    <button key={p.id} onClick={() => handleSelectProject(p.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg text-left group transition-colors">
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><Folder size={16} /></div>
                      <div>
                        <div className="text-sm font-bold text-slate-700">{p.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium">{p.members} members</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredTasks.length > 0 && (
                <div className="mb-4">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasks</div>
                  {filteredTasks.map(t => (
                    <button key={t.id} onClick={() => handleSelectTask(t)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg text-left group transition-colors">
                      <div className="w-8 h-8 rounded bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><KanbanSquare size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-700 truncate">{t.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400">{t.id}</span>
                          <span className="text-[10px] text-slate-400">• {projects.find(p => p.id === t.projectId)?.name}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredSprints.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprints</div>
                  {filteredSprints.map(s => (
                    <button key={s.id} onClick={() => handleSelectProject(s.projectId)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 rounded-lg text-left group transition-colors">
                      <div className="w-8 h-8 rounded bg-amber-100 text-amber-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><ListTodo size={16} /></div>
                      <div>
                        <div className="text-sm font-bold text-slate-700">{s.name}</div>
                        <div className="text-[10px] text-slate-400">{s.state} • {projects.find(p => p.id === s.projectId)?.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <div className="flex gap-3">
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-600">Enter</kbd> Select</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded shadow-sm text-slate-600">Esc</kbd> Close</span>
              </div>
              <div className="flex items-center gap-1.5">
                Powered by <span className="font-bold text-slate-600">ProjectFlow Engine</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
