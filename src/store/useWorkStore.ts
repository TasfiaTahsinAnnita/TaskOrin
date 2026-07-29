import { create } from "zustand";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./useAuthStore";

export type Priority = "Low" | "Medium" | "High";

export type ActivityLog = {
  id: string;
  action: string;
  timestamp: string;
  user: string;
};

export type TaskCard = {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  points: number;
  description: string;
  dueDate: string;
  labels: string[];
  comments: string[];
  status: string;
  projectId: string;
  sprintId?: string;
  completedAt?: string;
  activity: ActivityLog[];
  attachments?: string[];
};

export type BoardColumn = {
  id: string;
  name: string;
  wipLimit?: number;
};

export type Project = {
  id: string;
  name: string;
  workspaceId: string;
  progress: number;
  members: number;
  columns: BoardColumn[];
  startDate?: string;
  endDate?: string;
};

export type Sprint = {
  id: string;
  name: string;
  projectId: string;
  state: "Planned" | "Active" | "Completed";
  startDate?: string;
  endDate?: string;
  goal?: string;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  avatarUrl?: string;
  status: "Active" | "Pending";
  invitedAt?: string;
  projectId?: string;
};

export type Workspace = {
  id: string;
  name: string;
};

type WorkState = {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  projects: Project[];
  activeProjectId: string | null;
  tasks: TaskCard[];
  sprints: Sprint[];
  teamMembers: TeamMember[];
  isLoading: boolean;

  // Actions
  fetchInitialData: () => Promise<void>;
  setActiveWorkspace: (id: string) => void;
  setActiveProject: (id: string) => void;
  createProject: (project: Project) => Promise<void>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  createTask: (task: TaskCard) => Promise<void>;
  updateTask: (taskId: string, updater: (task: TaskCard) => TaskCard) => Promise<void>;
  moveTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  addActivity: (taskId: string, action: string, user: string) => Promise<void>;
  createSprint: (sprint: Sprint) => Promise<void>;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => Promise<void>;
  startSprint: (sprintId: string) => Promise<void>;
  completeSprint: (sprintId: string, endDate?: string) => Promise<void>;
  updateTaskSprint: (taskId: string, sprintId: string | null) => Promise<void>;
  addAttachment: (taskId: string, fileName: string) => Promise<void>;
  
  inviteTeamMember: (member: { name: string; email: string; role?: "Admin" | "Member"; projectId?: string }) => Promise<TeamMember>;
  removeTeamMember: (memberId: string) => Promise<void>;

  deleteTask: (taskId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteSprint: (sprintId: string) => Promise<void>;
};

const TEAM_MEMBERS_STORAGE_KEY = "taskorin_team_members";

export const useWorkStore = create<WorkState>((set, get) => ({
  workspaces: [{ id: "w1", name: "Default Workspace" }],
  activeWorkspaceId: "w1",
  projects: [],
  activeProjectId: null,
  tasks: [],
  sprints: [],
  teamMembers: [],
  isLoading: false,

  fetchInitialData: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set({ isLoading: true });

    const [projectsRes, sprintsRes, tasksRes, membersRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', user.id),
      supabase.from('sprints').select('*'),
      supabase.from('tasks').select('*, activity_logs(*)'),
      supabase.from('team_members').select('*')
    ]);

    const projects = (projectsRes.data || []).map(p => ({
      id: p.id,
      name: p.name,
      workspaceId: p.workspace_id,
      progress: p.progress,
      members: p.members,
      columns: p.columns || [],
      startDate: p.start_date,
      endDate: p.end_date
    }));

    const sprints = (sprintsRes.data || []).map(s => ({
      id: s.id,
      name: s.name,
      projectId: s.project_id,
      state: s.state,
      startDate: s.start_date,
      endDate: s.end_date,
      goal: s.goal
    }));

    const tasks = (tasksRes.data || []).map(t => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee,
      priority: t.priority,
      points: t.points,
      description: t.description,
      dueDate: t.due_date,
      labels: t.labels || [],
      comments: t.comments || [],
      attachments: t.attachments || [],
      status: t.status,
      projectId: t.project_id,
      sprintId: t.sprint_id,
      completedAt: t.completed_at,
      activity: (t.activity_logs || []).map((a: any) => ({
        id: a.id,
        action: a.action,
        timestamp: a.timestamp,
        user: a.user
      })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }));

    // Setup initial creator team member from logged in user
    const ownerMember: TeamMember = {
      id: user.id,
      name: user.name || user.email.split('@')[0] || "Project Owner",
      email: user.email,
      role: "Owner",
      avatarUrl: user.avatar_url,
      status: "Active",
      invitedAt: new Date().toISOString()
    };

    let dbMembers: TeamMember[] = [];

    if (!membersRes.error && membersRes.data && membersRes.data.length > 0) {
      dbMembers = membersRes.data.map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role || "Member",
        avatarUrl: m.avatar_url,
        status: m.status || "Active",
        invitedAt: m.invited_at,
        projectId: m.project_id
      }));
    } else {
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(TEAM_MEMBERS_STORAGE_KEY);
        if (stored) {
          dbMembers = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error reading team members from localStorage:", e);
      }
    }

    // Combine creator with invited members (deduplicating by email/id)
    const membersMap = new Map<string, TeamMember>();
    membersMap.set(ownerMember.email.toLowerCase(), ownerMember);

    dbMembers.forEach((m) => {
      const key = m.email.toLowerCase();
      if (!membersMap.has(key)) {
        membersMap.set(key, m);
      }
    });

    const combinedMembers = Array.from(membersMap.values());

    set({ 
      projects, 
      sprints, 
      tasks, 
      teamMembers: combinedMembers,
      activeProjectId: projects[0]?.id || null,
      isLoading: false 
    });
  },

  inviteTeamMember: async ({ name, email, role = "Member", projectId }) => {
    const newMember: TeamMember = {
      id: `tm-${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      status: "Active",
      invitedAt: new Date().toISOString(),
      projectId: projectId || get().activeProjectId || undefined
    };

    // Save to Supabase (if table exists)
    try {
      await supabase.from('team_members').insert({
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role,
        status: newMember.status,
        invited_at: newMember.invitedAt,
        project_id: newMember.projectId
      });
    } catch (e) {
      console.warn("Supabase insert team_members bypassed:", e);
    }

    // Always persist to local state & localStorage
    const updatedMembers = [...get().teamMembers.filter(m => m.email.toLowerCase() !== newMember.email), newMember];
    set({ teamMembers: updatedMembers });

    try {
      localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(updatedMembers));
    } catch (e) {
      console.error("Error saving team members to localStorage:", e);
    }

    return newMember;
  },

  removeTeamMember: async (memberId: string) => {
    try {
      await supabase.from('team_members').delete().eq('id', memberId);
    } catch (e) {
      console.warn("Supabase delete team_members bypassed:", e);
    }

    const updatedMembers = get().teamMembers.filter(m => m.id !== memberId && m.role !== "Owner");
    set({ teamMembers: updatedMembers });

    try {
      localStorage.setItem(TEAM_MEMBERS_STORAGE_KEY, JSON.stringify(updatedMembers));
    } catch (e) {
      console.error("Error updating localStorage after removing team member:", e);
    }
  },

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
  setActiveProject: (id) => set({ activeProjectId: id }),
  
  createProject: async (project) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { data, error } = await supabase.from('projects').insert({
      name: project.name,
      workspace_id: project.workspaceId,
      progress: project.progress,
      members: project.members,
      columns: project.columns,
      start_date: project.startDate,
      end_date: project.endDate,
      user_id: user.id
    }).select().single();

    if (!error && data) {
      set((state) => ({ projects: [...state.projects, { ...project, id: data.id }] }));
    }
  },

  updateProject: async (projectId, updates) => {
    const { error } = await supabase.from('projects').update({
      name: updates.name,
      progress: updates.progress,
      members: updates.members,
      start_date: updates.startDate,
      end_date: updates.endDate,
      columns: updates.columns
    }).eq('id', projectId);

    if (!error) {
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p)),
      }));
    }
  },

  createTask: async (task) => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase.from('tasks').insert({
      id: task.id,
      title: task.title,
      assignee: task.assignee,
      priority: task.priority,
      points: task.points,
      description: task.description,
      due_date: task.dueDate,
      labels: task.labels,
      status: task.status,
      project_id: task.projectId,
      sprint_id: task.sprintId,
      user_id: user.id
    });

    if (!error) {
      // Also add initial activity
      await supabase.from('activity_logs').insert({
        task_id: task.id,
        action: "Task created",
        user: "System"
      });

      set((state) => ({ tasks: [...state.tasks, task] }));
    }
  },

  updateTask: async (taskId, updater) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const updated = updater(task);

    const { error } = await supabase.from('tasks').update({
      title: updated.title,
      assignee: updated.assignee,
      priority: updated.priority,
      points: updated.points,
      description: updated.description,
      due_date: updated.dueDate,
      labels: updated.labels,
      comments: updated.comments,
      attachments: updated.attachments,
      status: updated.status,
      sprint_id: updated.sprintId,
      completed_at: updated.completedAt
    }).eq('id', taskId);

    if (!error) {
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      }));
    }
  },

  moveTaskStatus: async (taskId, newStatus) => {
    const isDone = newStatus === "done";
    const completedAt = isDone ? new Date().toISOString() : null;
    
    const { error } = await supabase.from('tasks').update({
      status: newStatus,
      completed_at: completedAt
    }).eq('id', taskId);

    if (!error) {
      const action = `Moved to ${newStatus}`;
      const userName = useAuthStore.getState().user?.name || "Current User";
      await supabase.from('activity_logs').insert({
        task_id: taskId,
        action,
        user: userName
      });

      set((state) => ({
        tasks: state.tasks.map((task) => {
          if (task.id === taskId) {
            const updated = { 
              ...task, 
              status: newStatus,
              completedAt: completedAt || undefined
            };
            updated.activity = [
              {
                id: Math.random().toString(),
                action,
                timestamp: new Date().toISOString(),
                user: userName,
              },
              ...updated.activity,
            ];
            return updated;
          }
          return task;
        }),
      }));
    }
  },

  addActivity: async (taskId, action, user) => {
    const { error } = await supabase.from('activity_logs').insert({
      task_id: taskId,
      action,
      user
    });

    if (!error) {
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                activity: [
                  { id: Math.random().toString(), action, timestamp: new Date().toISOString(), user },
                  ...task.activity,
                ],
              }
            : task
        ),
      }));
    }
  },

  createSprint: async (sprint) => {
    const { data, error } = await supabase.from('sprints').insert({
      name: sprint.name,
      project_id: sprint.projectId,
      state: sprint.state,
      start_date: sprint.startDate,
      end_date: sprint.endDate,
      goal: sprint.goal
    }).select().single();

    if (!error && data) {
      set((state) => ({ sprints: [...state.sprints, { ...sprint, id: data.id }] }));
    }
  },

  updateSprint: async (sprintId, updates) => {
    const { error } = await supabase.from('sprints').update({
      name: updates.name,
      state: updates.state,
      start_date: updates.startDate,
      end_date: updates.endDate,
      goal: updates.goal
    }).eq('id', sprintId);

    if (!error) {
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === sprintId ? { ...s, ...updates } : s)),
      }));
    }
  },

  startSprint: async (sprintId) => {
    const sprint = get().sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    const defaultStart = new Date();
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultStart.getDate() + 14);

    const updates = {
      state: "Active" as const,
      startDate: sprint.startDate || format(defaultStart, 'yyyy-MM-dd'),
      endDate: sprint.endDate || format(defaultEnd, 'yyyy-MM-dd'),
    };

    const { error } = await supabase.from('sprints').update({
      state: updates.state,
      start_date: updates.startDate,
      end_date: updates.endDate
    }).eq('id', sprintId);

    if (!error) {
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === sprintId ? { ...s, ...updates } : s)),
      }));
    }
  },

  completeSprint: async (sprintId, endDate) => {
    const finalEnd = endDate || format(new Date(), 'yyyy-MM-dd');
    const { error } = await supabase.from('sprints').update({
      state: "Completed",
      end_date: finalEnd
    }).eq('id', sprintId);

    if (!error) {
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === sprintId ? { ...s, state: "Completed", endDate: finalEnd } : s)),
      }));
    }
  },

  updateTaskSprint: async (taskId, sprintId) => {
    const { error } = await supabase.from('tasks').update({
      sprint_id: sprintId
    }).eq('id', taskId);

    if (!error) {
      const action = sprintId ? `Added to sprint` : `Removed from sprint`;
      await supabase.from('activity_logs').insert({
        task_id: taskId,
        action,
        user: "System"
      });

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                sprintId: sprintId || undefined,
                activity: [
                  { id: Math.random().toString(), action, timestamp: new Date().toISOString(), user: "System" },
                  ...task.activity,
                ],
              }
            : task
        ),
      }));
    }
  },

  addAttachment: async (taskId, fileName) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;

    const attachments = [...(task.attachments || []), fileName];
    const { error } = await supabase.from('tasks').update({
      attachments
    }).eq('id', taskId);

    if (!error) {
      const userName = useAuthStore.getState().user?.name || "Current User";
      await supabase.from('activity_logs').insert({
        task_id: taskId,
        action: `Attached file: ${fileName}`,
        user: userName
      });

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                attachments,
                activity: [
                  { id: Math.random().toString(), action: `Attached file: ${fileName}`, timestamp: new Date().toISOString(), user: userName },
                  ...t.activity,
                ],
              }
            : t
        ),
      }));
    }
  },

  deleteTask: async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
      }));
    }
  },

  deleteProject: async (projectId) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) {
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        tasks: state.tasks.filter((t) => t.projectId !== projectId),
        sprints: state.sprints.filter((s) => s.projectId !== projectId),
        activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
      }));
    }
  },

  deleteSprint: async (sprintId) => {
    const { error } = await supabase.from('sprints').delete().eq('id', sprintId);
    if (!error) {
      set((state) => ({
        sprints: state.sprints.filter((s) => s.id !== sprintId),
        tasks: state.tasks.map((t) => (t.sprintId === sprintId ? { ...t, sprintId: undefined } : t)),
      }));
    }
  },
}));

