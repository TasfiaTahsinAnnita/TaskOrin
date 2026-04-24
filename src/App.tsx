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
import { LayoutDashboard, KanbanSquare, Table as TableIcon, Activity, ListTodo, Map, Bell, Settings } from "lucide-react";
import { GlobalSearch } from "./components/GlobalSearch";
import { NotificationsDropdown } from "./components/NotificationsDropdown";
import { supabase } from "./lib/supabase";
import { useEffect } from "react";
import { useWorkStore } from "./store/useWorkStore";

const navItems = [
  { to: "/", label: "Projects", icon: LayoutDashboard },
  { to: "/board", label: "Board", icon: KanbanSquare },
  { to: "/scrum", label: "Scrum", icon: ListTodo },
  { to: "/roadmap", label: "Roadmap", icon: Map },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/table", label: "Table", icon: TableIcon },
  { to: "/reports", label: "Reports", icon: Activity }
];

export function App() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const fetchInitialData = useWorkStore((state) => state.fetchInitialData);
  const location = useLocation();

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "User",
          avatar_url: session.user.user_metadata.avatar_url
        });
        fetchInitialData();
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    });

    return () => subscription.unsubscribe();
  }, [setUser, fetchInitialData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
          <h1 className="text-xl font-bold text-white mb-1 tracking-tight">ProjectFlow</h1>
          <p className="text-sm text-slate-400">Welcome, {user.name}</p>
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
                    isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm font-medium" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50">
          <GlobalSearch />
          <div className="flex items-center gap-4">
            <NotificationsDropdown />
            <NavLink 
              to="/settings"
              className={({ isActive }) => 
                `p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`
              }
            >
              <Settings size={20} />
            </NavLink>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-800 leading-none">{user.name}</div>
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1">Admin Account</div>
              </div>
              <NavLink to="/settings" className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold border-2 border-white shadow-sm ring-1 ring-slate-200 hover:ring-blue-400 transition-all">
                {user.name.charAt(0)}
              </NavLink>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
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
      </main>
    </div>
  );
}
