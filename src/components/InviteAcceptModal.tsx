import { useState, useEffect } from "react";
import { useWorkStore } from "../store/useWorkStore";
import { useAuthStore } from "../store/useAuthStore";
import { CheckCircle2, XCircle, Sparkles, ShieldCheck, MailCheck } from "lucide-react";

export function InviteAcceptModal() {
  const [inviteData, setInviteData] = useState<{
    id: string;
    invitedBy: string;
    memberName: string;
    email: string;
    role: string;
    projectName: string;
  } | null>(null);

  const [acceptedToast, setAcceptedToast] = useState(false);
  const { projects, teamMembers, acceptTeamMember, removeTeamMember } = useWorkStore();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    // 1. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get("invite_id");
    const invitedBy = params.get("invited_by") || "A project creator";
    const memberName = params.get("member_name") || currentUser?.name || "Team Member";
    const email = params.get("email") || currentUser?.email || "";
    const role = params.get("role") || "Member";
    const projectName = params.get("project_name") || "TaskOrin Project";

    if (inviteId) {
      setInviteData({
        id: inviteId,
        invitedBy: decodeURIComponent(invitedBy),
        memberName: decodeURIComponent(memberName),
        email: decodeURIComponent(email),
        role: decodeURIComponent(role),
        projectName: decodeURIComponent(projectName)
      });
      return;
    }

    // 2. Check if logged in user has a pending invite in store
    if (currentUser?.email) {
      const pendingInvite = teamMembers.find(
        m => m.email.toLowerCase() === currentUser.email.toLowerCase() && m.status === "Pending"
      );
      if (pendingInvite) {
        const targetProj = projects.find(p => p.id === pendingInvite.projectId);
        setInviteData({
          id: pendingInvite.id,
          invitedBy: pendingInvite.invitedBy || "Project Creator",
          memberName: pendingInvite.name,
          email: pendingInvite.email,
          role: pendingInvite.role,
          projectName: targetProj?.name || "TaskOrin Project"
        });
      }
    }
  }, [teamMembers, currentUser, projects]);

  if (!inviteData) return null;

  const handleAccept = async () => {
    await acceptTeamMember(inviteData.id);
    
    // Clear URL search params
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);

    setAcceptedToast(true);
    setTimeout(() => {
      setInviteData(null);
      setAcceptedToast(false);
    }, 2200);
  };

  const handleDecline = async () => {
    await removeTeamMember(inviteData.id);

    // Clear URL search params
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);

    setInviteData(null);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-lg">
            <MailCheck size={32} className="text-white" />
          </div>
          <div className="inline-flex items-center gap-1.5 bg-blue-500/40 text-blue-100 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider mb-2 border border-blue-400/30">
            <Sparkles size={12} /> Project Invitation
          </div>
          <h2 className="text-xl font-bold leading-snug">
            You've Been Invited to {inviteData.projectName}!
          </h2>
        </div>

        {/* Body content */}
        <div className="p-6 text-center space-y-5">
          {acceptedToast ? (
            <div className="py-6 flex flex-col items-center space-y-3 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Welcome to {inviteData.projectName}!</h3>
              <p className="text-sm text-slate-500">
                Invitation accepted! The project and all its Kanban stages, tasks, sprints, and table views are now open in your interface.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-900">{inviteData.invitedBy}</span> has invited you to join <span className="font-bold text-blue-600">{inviteData.projectName}</span> as a:
                </p>
                <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 font-bold text-sm px-3.5 py-1 rounded-full border border-blue-200">
                  <ShieldCheck size={16} />
                  {inviteData.role === "Admin" ? "⚡ Project Admin" : "👤 Team Member"}
                </div>
                <div className="pt-2 text-xs text-slate-400 border-t border-slate-200/60 mt-2">
                  Invited email: <span className="font-semibold text-slate-700">{inviteData.email}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Accepting will give you instant access to this project, including its tasks, Kanban board, sprints, and team collaboration.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
                >
                  <XCircle size={16} />
                  Decline
                </button>

                <button
                  type="button"
                  onClick={handleAccept}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-md shadow-blue-500/20"
                >
                  <CheckCircle2 size={16} />
                  Accept Invite
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
