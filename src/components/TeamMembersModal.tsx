import { useState, FormEvent } from "react";
import { useWorkStore, TeamMember } from "../store/useWorkStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, UserPlus, Mail, Trash2, CheckCircle2, UserCheck, Sparkles, LogOut } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
};

export function TeamMembersModal({ isOpen, onClose, projectId }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const allMembers = useWorkStore((state) => state.teamMembers);
  const projects = useWorkStore((state) => state.projects);
  const activeProjectId = useWorkStore((state) => state.activeProjectId);
  const inviteTeamMember = useWorkStore((state) => state.inviteTeamMember);
  const removeTeamMember = useWorkStore((state) => state.removeTeamMember);
  const setActiveProject = useWorkStore((state) => state.setActiveProject);

  const targetProjectId = projectId || activeProjectId;
  const targetProject = projects.find(p => p.id === targetProjectId);
  const rawProjectMembers = allMembers.filter(m => m.projectId === targetProjectId || (!m.projectId && targetProject?.creatorId === currentUser?.id));

  // Deduplicate by email so a user never appears twice in the same project
  const uniqueProjectMembers = Array.from(
    rawProjectMembers.reduce((map: Map<string, TeamMember>, m: TeamMember) => {
      const emailKey = m.email.toLowerCase();
      if (!map.has(emailKey)) {
        map.set(emailKey, m);
      }
      return map;
    }, new Map<string, TeamMember>()).values()
  );

  const currentUserMember = uniqueProjectMembers.find(
    m => currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase()
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Member">("Member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleLeaveProject = async (memberId: string) => {
    if (confirm(`Are you sure you want to leave "${targetProject?.name || 'this project'}"? You will lose access to its board and tasks.`)) {
      await removeTeamMember(memberId);
      const remainingProjects = projects.filter(p => p.id !== targetProjectId);
      if (remainingProjects.length > 0) {
        setActiveProject(remainingProjects[0].id);
      }
      onClose();
    }
  };

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const newMember = await inviteTeamMember({
        name: name.trim(),
        email: email.trim(),
        role: role,
        projectId: targetProjectId || undefined
      });

      // Construct mailto link for client-side mail opening fallback
      const subject = encodeURIComponent(`Invitation to join ${targetProject?.name || 'TaskOrin Project'}`);
      const body = encodeURIComponent(`Hi ${newMember.name},\n\nYou have been invited to join our project "${targetProject?.name || 'TaskOrin'}" as a ${newMember.role}.\n\nAccess and accept your invitation here: ${window.location.origin}/?invite_id=${newMember.id}&project_id=${targetProjectId}&project_name=${encodeURIComponent(targetProject?.name || '')}\n\nBest regards,\nTaskOrin Team`);
      
      setSuccessMessage(`Invitation dispatched via Supabase Auth to ${newMember.name} (${newMember.email})!`);
      
      // Auto-open user's mail client as well for convenient sending
      window.open(`mailto:${newMember.email}?subject=${subject}&body=${body}`, '_blank');

      setName("");
      setEmail("");
      setRole("Member");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Error inviting member:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Manage Team • {targetProject ? targetProject.name : 'Project'}
              </h3>
              <p className="text-xs text-slate-500">Manage project members, invitations, and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                Invite Member to {targetProject?.name || 'Project'}
              </span>
            </div>

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <input
                  type="text"
                  placeholder="Member Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="md:col-span-4 relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "Admin" | "Member")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <UserPlus size={16} />
                {isSubmitting ? "Inviting..." : "Send Invitation"}
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <UserCheck size={16} className="text-slate-400" />
                Project Members ({uniqueProjectMembers.length})
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {uniqueProjectMembers.map((member, index) => {
                const isSelf = Boolean(currentUser?.email && member.email.toLowerCase() === currentUser.email.toLowerCase());
                const isCreator = index === 0 || member.role === "Owner";

                return (
                  <div key={member.id} className="py-3 flex items-center justify-between group hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">{member.name}</span>
                          {isSelf && (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                          {isCreator ? (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm flex items-center gap-1">
                              👑 Project Creator
                            </span>
                          ) : member.role === "Admin" ? (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                              ⚡ Project Admin
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              👤 Team Member
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{member.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {member.status === "Pending" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const link = `${window.location.origin}/?invite_id=${member.id}&project_id=${targetProjectId}&project_name=${encodeURIComponent(targetProject?.name || '')}&invited_by=${encodeURIComponent(member.invitedBy || "Admin")}&member_name=${encodeURIComponent(member.name)}&email=${encodeURIComponent(member.email)}&role=${encodeURIComponent(member.role)}`;
                              navigator.clipboard.writeText(link);
                              alert(`Invite link copied to clipboard!\n\n${link}`);
                            }}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                            title="Copy direct invitation link"
                          >
                            Copy Link
                          </button>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Invite
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      )}

                      {/* Explicit Leave / Remove Action Buttons */}
                      {isSelf ? (
                        <button
                          type="button"
                          onClick={() => handleLeaveProject(member.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-lg border border-rose-300 transition-colors shrink-0 shadow-sm"
                          title="Leave this project and remove your membership"
                        >
                          <LogOut size={14} />
                          Leave Project
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${member.name} (${member.email}) from this project?`)) {
                              removeTeamMember(member.id);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors border border-rose-200 shrink-0"
                          title="Delete member from project"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {currentUserMember ? (
            <button
              type="button"
              onClick={() => handleLeaveProject(currentUserMember.id)}
              className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
            >
              <LogOut size={14} />
              Leave this project
            </button>
          ) : (
            <span className="text-xs text-slate-400">Project Team Settings</span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
