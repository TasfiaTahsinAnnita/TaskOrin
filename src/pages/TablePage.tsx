import { useState, useMemo } from "react";
import { useWorkStore, TaskCard, Priority } from "../store/useWorkStore";
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  SortingState
} from "@tanstack/react-table";
import { ArrowUpDown, Search, Trash2 } from "lucide-react";

const columnHelper = createColumnHelper<TaskCard>();

export function TablePage() {
  const { tasks, updateTask, moveTaskStatus, activeProjectId, deleteTask } = useWorkStore();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === activeProjectId);
  }, [tasks, activeProjectId]);

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "ID",
      cell: info => <span className="text-slate-500 font-mono text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor("title", {
      header: ({ column }) => (
        <button className="flex items-center gap-1 hover:text-slate-900" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Title <ArrowUpDown size={14} />
        </button>
      ),
      cell: info => <span className="font-medium text-slate-800">{info.getValue()}</span>,
    }),
    columnHelper.accessor("assignee", {
      header: "Assignee",
      cell: info => {
        const value = info.getValue();
        return (
          <select 
            value={value}
            onChange={(e) => updateTask(info.row.original.id, (t) => ({ ...t, assignee: e.target.value }))}
            className="bg-transparent border-0 text-sm font-medium focus:ring-0 cursor-pointer hover:bg-slate-100 rounded px-1 -ml-1"
          >
            <option>Aisha</option>
            <option>Ravi</option>
            <option>Nina</option>
            <option>Karan</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
      cell: info => {
        const priority = info.getValue();
        const colors = {
          Low: "bg-emerald-100 text-emerald-800",
          Medium: "bg-amber-100 text-amber-800",
          High: "bg-rose-100 text-rose-800",
        };
        return (
          <select 
            value={priority}
            onChange={(e) => updateTask(info.row.original.id, (t) => ({ ...t, priority: e.target.value as Priority }))}
            className={`${colors[priority]} text-xs font-semibold px-2 py-1 rounded-full border-0 focus:ring-0 cursor-pointer appearance-none`}
            style={{ WebkitAppearance: 'none' }}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: info => {
        const status = info.getValue();
        return (
          <select 
            value={status}
            onChange={(e) => moveTaskStatus(info.row.original.id, e.target.value)}
            className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded border-0 focus:ring-0 cursor-pointer"
          >
            <option value="backlog">Backlog</option>
            <option value="in-progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("points", {
      header: "Points",
      cell: info => (
        <span className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      cell: info => (
        <button 
          onClick={() => { if (confirm('Delete task?')) deleteTask(info.row.original.id); }}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
          title="Delete Task"
        >
          <Trash2 size={16} />
        </button>
      ),
    }),
  ], [updateTask, moveTaskStatus, deleteTask]);

  const table = useReactTable({
    data: projectTasks,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Task List</h2>
          <p className="text-sm text-slate-500">Detailed list view of all tasks in this project.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm w-64"
          />
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50/50">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-4 text-sm align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-slate-500 text-sm">
                    No tasks found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
