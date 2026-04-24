import { useState } from "react";
import { User, Bell, Shield, Palette, Globe, Save, LogOut } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [theme, setTheme] = useState("System");
  const [notifications, setNotifications] = useState(true);

  return (
    <section className="h-full flex flex-col space-y-6 max-w-4xl mx-auto pb-12">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500">Manage your profile and application preferences.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="space-y-1">
          {[
            { id: 'profile', label: 'Profile', icon: User, active: true },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'region', label: 'Region & Language', icon: Globe },
          ].map(item => (
            <button 
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.active ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button 
              type="button" 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={18} />
              Logout Session
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Profile Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Public Profile</h3>
              <p className="text-xs text-slate-500">This information will be visible to other team members.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold border-4 border-slate-50 shadow-inner">
                  {name.charAt(0)}
                </div>
                <div>
                  <button className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors mb-2">Change Avatar</button>
                  <p className="text-[10px] text-slate-400">JPG, GIF or PNG. Max size of 800K</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Biography</label>
                <textarea 
                  placeholder="Tell us a bit about yourself..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow h-24 resize-none" 
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Preferences</h3>
              <p className="text-xs text-slate-500">Customize how you interact with the application.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-800">Email Notifications</div>
                  <div className="text-xs text-slate-500">Receive weekly summaries and task alerts.</div>
                </div>
                <button 
                  onClick={() => setNotifications(!notifications)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div>
                  <div className="text-sm font-bold text-slate-800">Theme Mode</div>
                  <div className="text-xs text-slate-500">Switch between light, dark or system appearance.</div>
                </div>
                <select 
                  value={theme}
                  onChange={e => setTheme(e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 outline-none"
                >
                  <option>Light</option>
                  <option>Dark</option>
                  <option>System</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button className="px-6 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Discard Changes</button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md">
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
