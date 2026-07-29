import { useState, FormEvent } from "react";
import { useWorkStore, TeamMember } from "../store/useWorkStore";
import { X, UserPlus, Mail, Shield, Trash2, CheckCircle2, UserCheck, Sparkles } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
};

export function TeamMembersModal({ isOpen, onClose, projectId }: Props) {
  const teamMembers = useWorkStore((state) => state.teamMembers);
  const inviteTeamMember = useWorkStore((state) => state.inviteTeamMember);
  const removeTeamMember = useWorkStore((state) => state.removeTeamMember);

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
        projectId: projectId
      });

      setSuccessMessage(`Invitation sent to ${newMember.name} (${newMember.email})!`);
      setName("");
      setEmail("");
      setRole("Member");
      setTimeout(() => setSuccessMessage(""), 4000);
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
              <h3 className="text-lg font-bold text-slate-800">Team Members & Invitations</h3>
              <p className="text-xs text-slate-500">Invite colleagues to assign tasks and collaborate</p>
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
                Invite New Member via Email
              </span>
            </div>

            {successMessage && (
              <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-3 rounded-lg border border-emerald-100 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                {successMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 ml-0.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivers"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 ml-0.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@company.com"
                    className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "Admin" | "Member")}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white hover:bg-blue-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                {isSubmitting ? "Inviting..." : "Send Invitation"}
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={16} className="text-slate-400" />
                Active Team Members ({teamMembers.length})
              </h4>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
              {teamMembers.map((member) => (
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
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                            Creator
                          </span>
                        )}
                        {member.role === "Admin" && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{member.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>

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
