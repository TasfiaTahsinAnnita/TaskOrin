import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

export type Priority = "Low" | "Medium" | "High";

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
};

export type BoardColumn = {
  id: string;
  name: string;
  tasks: TaskCard[];
};

type WorkContextType = {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  moveTaskToColumn: (taskId: string, destinationColumnId: string) => void;
  updateTask: (taskId: string, updater: (task: TaskCard) => TaskCard) => void;
};

const initialColumns: BoardColumn[] = [
  {
    id: "backlog",
    name: "Backlog",
    tasks: [
      {
        id: "PM-102",
        title: "Define sprint goal",
        assignee: "Aisha",
        priority: "High",
        points: 5,
        description: "Align team on sprint outcome and acceptance criteria.",
        dueDate: "2026-04-25",
        labels: ["Planning", "Sprint"],
        comments: ["Need final confirmation from PM."]
      }
    ]
  },
  {
    id: "in-progress",
    name: "In Progress",
    tasks: [
      {
        id: "PM-118",
        title: "Build task detail drawer",
        assignee: "Ravi",
        priority: "Medium",
        points: 3,
        description: "Open a side panel with complete issue context.",
        dueDate: "2026-04-28",
        labels: ["UI"],
        comments: ["Waiting on design QA."]
      }
    ]
  },
  {
    id: "review",
    name: "Review",
    tasks: [
      {
        id: "PM-123",
        title: "QA board filters",
        assignee: "Nina",
        priority: "High",
        points: 8,
        description: "Validate filter combinations and state sync.",
        dueDate: "2026-04-29",
        labels: ["QA", "Board"],
        comments: ["Regression tests are pending."]
      }
    ]
  },
  {
    id: "done",
    name: "Done",
    tasks: [
      {
        id: "PM-095",
        title: "Setup auth layout",
        assignee: "Karan",
        priority: "Low",
        points: 2,
        description: "Basic login/signup layout with shared styling.",
        dueDate: "2026-04-22",
        labels: ["Auth"],
        comments: ["Completed and ready for polish."]
      }
    ]
  }
];

const WorkContext = createContext<WorkContextType | undefined>(undefined);
const WORK_COLUMNS_KEY = "pm_work_columns";

function getStoredColumns(): BoardColumn[] | null {
  try {
    const raw = localStorage.getItem(WORK_COLUMNS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BoardColumn[];
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function WorkProvider({ children }: { children: React.ReactNode }) {
  const [columns, setColumns] = useState<BoardColumn[]>(() => getStoredColumns() ?? initialColumns);

  useEffect(() => {
    localStorage.setItem(WORK_COLUMNS_KEY, JSON.stringify(columns));
  }, [columns]);

  const value = useMemo<WorkContextType>(
    () => ({
      columns,
      setColumns,
      moveTaskToColumn: (taskId, destinationColumnId) => {
        setColumns((current) => {
          const next = current.map((column) => ({ ...column, tasks: [...column.tasks] }));
          const source = next.find((column) => column.tasks.some((task) => task.id === taskId));
          const destination = next.find((column) => column.id === destinationColumnId);
          if (!source || !destination || source.id === destination.id) return current;

          const taskIndex = source.tasks.findIndex((task) => task.id === taskId);
          if (taskIndex === -1) return current;
          const [task] = source.tasks.splice(taskIndex, 1);
          destination.tasks.push(task);
          return next;
        });
      },
      updateTask: (taskId, updater) => {
        setColumns((current) =>
          current.map((column) => ({
            ...column,
            tasks: column.tasks.map((task) => (task.id === taskId ? updater(task) : task))
          }))
        );
      }
    }),
    [columns]
  );

  return <WorkContext.Provider value={value}>{children}</WorkContext.Provider>;
}

export function useWork() {
  const context = useContext(WorkContext);
  if (!context) {
    throw new Error("useWork must be used inside WorkProvider.");
  }
  return context;
}
