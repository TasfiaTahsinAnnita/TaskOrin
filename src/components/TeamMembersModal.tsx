import { useState, FormEvent } from "react";
import { useWorkStore } from "../store/useWorkStore";
import { X, UserPlus, Mail, Trash2, CheckCircle2, UserCheck, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
};

export function TeamMembersModal({ isOpen, onClose, projectId }: Props) {
  const allMembers = useWorkStore((state) => state.teamMembers);
  const projects = useWorkStore((state) => state.projects);
  const activeProjectId = useWorkStore((state) => state.activeProjectId);
  const inviteTeamMember = useWorkStore((state) => state.inviteTeamMember);
  const removeTeamMember = useWorkStore((state) => state.removeTeamMember);

  const targetProjectId = projectId || activeProjectId;
  const targetProject = projects.find(p => p.id === targetProjectId);
  const projectMembers = allMembers.filter(m => !m.projectId || !targetProjectId || m.projectId === targetProjectId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Admin" | "Member">("Member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

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
                Team & Invitations {targetProject ? `• ${targetProject.name}` : ''}
              </h3>
              <p className="text-xs text-slate-500">Invite project members and manage assigned roles</p>
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
                Project Members ({projectMembers.length})
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {projectMembers.map((member) => (
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
                        {member.role === "Owner" && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm flex items-center gap-1">
                            👑 Project Creator
                          </span>
                        )}
                        {member.role === "Admin" && (
                          <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                            ⚡ Project Admin
                          </span>
                        )}
                        {member.role === "Member" && (
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
                            const link = `${window.location.origin}/?invite_id=${member.id}&invited_by=${encodeURIComponent(member.invitedBy || "Admin")}&member_name=${encodeURIComponent(member.name)}&email=${encodeURIComponent(member.email)}&role=${encodeURIComponent(member.role)}`;
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

                    {member.role !== "Owner" && (
                      <button
                        type="button"
                        onClick={() => removeTeamMember(member.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
