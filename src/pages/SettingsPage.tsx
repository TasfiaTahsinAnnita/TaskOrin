import { useState, useEffect } from "react";
import { User, Bell, Shield, Palette, Globe, Save, LogOut, Camera, Mail, Briefcase, Info } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { supabase } from "../lib/supabase";

export function SettingsPage() {
  const { user, profile, setUser, updateProfile } = useAuthStore();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const [name, setName] = useState(profile?.full_name || user?.name || "");
  const [email] = useState(user?.email || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [role, setRole] = useState(profile?.role || "Member");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  
  const [activeSection, setActiveSection] = useState("Profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name);
      setBio(profile.bio || "");
      setRole(profile.role || "Member");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    await updateProfile({
      full_name: name,
      bio: bio,
      role: role,
      avatar_url: avatarUrl
    });

    setIsSaving(false);
    setSaveMessage("Profile updated successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const sections = [
    { id: "Profile", icon: User, label: "Profile Settings" },
    { id: "Notifications", icon: Bell, label: "Notifications" },
    { id: "Security", icon: Shield, label: "Security & Privacy" },
    { id: "Appearance", icon: Palette, label: "Appearance" },
    { id: "Workspace", icon: Globe, label: "Workspace Settings" },
  ];

  return (
    <section className="h-full flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
      {/* Sidebar Nav */}
      <aside className="w-full md:w-64 space-y-2">
        <h2 className="text-xl font-bold text-slate-800 mb-6 px-3">Settings</h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeSection === section.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <section.icon size={18} />
              {section.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-slate-200">
            <button 
              type="button" 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={18} />
              Log Out Account
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeSection === "Profile" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">My Profile</h3>
              <p className="text-sm text-slate-500">Update your personal information and how others see you.</p>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-8 space-y-8">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      name.charAt(0)
                    )}
                  </div>
                  <button type="button" className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors">
                    <Camera size={16} />
                  </button>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-slate-800">Profile Picture</h4>
                  <p className="text-xs text-slate-500 mb-3">JPG, GIF or PNG. Max size 2MB.</p>
                  <input 
                    type="text" 
                    value={avatarUrl} 
                    onChange={(e) => setAvatarUrl(e.target.value)} 
                    placeholder="Paste Image URL"
                    className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={14} className="text-slate-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Briefcase size={14} className="text-slate-400" /> Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Info size={14} className="text-slate-400" /> Bio
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a short bio about yourself..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <span className={`text-sm font-medium transition-opacity ${saveMessage ? 'opacity-100' : 'opacity-0'} text-emerald-600`}>
                  {saveMessage}
                </span>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
        {activeSection !== "Profile" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
               <Palette size={40} />
             </div>
             <h3 className="text-xl font-bold text-slate-800">{activeSection} Module</h3>
             <p className="text-slate-500 max-w-xs">This section is part of the upcoming workspace expansion. Stay tuned!</p>
          </div>
        )}
      </div>
    </section>
  );
}
