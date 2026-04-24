import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { BoardPage } from "./pages/BoardPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { TablePage } from "./pages/TablePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ScrumPage } from "./pages/ScrumPage";
import { ActivityPage } from "./pages/ActivityPage";
import { SettingsPage } from "./pages/SettingsPage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { useAuthStore } from "./store/useAuthStore";
import { KanbanSquare, Table as TableIcon, Activity, ListTodo, Map, Settings, BarChart3, LayoutGrid } from "lucide-react";
import { GlobalSearch } from "./components/GlobalSearch";
import { NotificationsDropdown } from "./components/NotificationsDropdown";
import { supabase } from "./lib/supabase";
import { useEffect } from "react";
import { useWorkStore } from "./store/useWorkStore";

const navItems = [
  { to: "/", label: "Projects", icon: LayoutGrid },
  { to: "/board", label: "Kanban Board", icon: KanbanSquare },
  { to: "/scrum", label: "Scrum & Sprint", icon: ListTodo },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/activity", label: "Global Activity", icon: Activity },
  { to: "/table", label: "Data Table", icon: TableIcon },
  { to: "/reports", label: "Analytics", icon: BarChart3 }
];

export function App() {
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const initialized = useAuthStore((state) => state.initialized);
  const setUser = useAuthStore((state) => state.setUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const fetchInitialData = useWorkStore((state) => state.fetchInitialData);
  const location = useLocation();

  useEffect(() => {
    console.log("Auth Initialization Started...");
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("Session Check Error:", error);
      
      if (session?.user) {
        console.log("Session Found:", session.user.email);
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User",
          avatar_url: session.user.user_metadata.avatar_url
        });
        fetchInitialData();
      } else {
        console.log("No Session Found");
      }
      setInitialized(true);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth State Changed:", event, session?.user?.email);
      
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User",
          avatar_url: session.user.user_metadata.avatar_url
        });
        fetchInitialData();
      } else {
        setUser(null);
      }
      setInitialized(true);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setInitialized, fetchInitialData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-blue-200 font-bold tracking-widest uppercase text-xs">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location.pathname }} />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col transition-all duration-300 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 mb-1">
             <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  "P"
                )}
             </div>
             <h1 className="text-xl font-bold text-white tracking-tight">TaskOrin</h1>
          </div>
          <p className="text-xs text-slate-400 font-medium">Workspace: {profile?.full_name || user.name}</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button 
            type="button" 
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 text-slate-300 hover:bg-rose-600 hover:text-white transition-all text-sm font-bold" 
            onClick={handleLogout}
          >
            Logout Session
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <GlobalSearch />
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <NavLink 
              to="/settings"
              className={({ isActive }) => 
                `p-2 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-inner' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Settings size={20} />
            </NavLink>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-none">{profile?.full_name || user.name}</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1">{profile?.role || "Admin Account"}</div>
              </div>
              <NavLink to="/settings" className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold border-2 border-white shadow-md ring-1 ring-slate-200 hover:ring-blue-400 transition-all overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </NavLink>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 pb-20">
          <Routes>
            <Route path="/" element={<ProjectsPage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/scrum" element={<ScrumPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/table" element={<TablePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>

        {/* Permanent Footer */}
        <footer className="shrink-0 bg-white border-t border-slate-200 py-4 px-8 flex flex-col md:flex-row items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} TaskOrin</span>
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <span>Built by Tasfia Tahsin Annita</span>
          </div>
          <div className="flex items-center gap-6 mt-2 md:mt-0">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
