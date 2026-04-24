import { useState, useRef, useEffect } from "react";
import { Bell, Check, Info, AlertTriangle, X } from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
  time: string;
  read: boolean;
};

const initialNotifications: Notification[] = [
  { id: "1", title: "Task Completed", message: "Aisha moved 'Define sprint goal' to Done", type: "success", time: "2m ago", read: false },
  { id: "2", title: "New Comment", message: "Ravi left a comment on 'Build task detail drawer'", type: "info", time: "15m ago", read: false },
  { id: "3", title: "Deadline Approaching", message: "Project 'Website Revamp' is due in 3 days", type: "warning", time: "1h ago", read: true },
];

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success": return <Check size={14} className="text-emerald-500" />;
      case "warning": return <AlertTriangle size={14} className="text-amber-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-[70] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
            <button 
              onClick={markAllRead}
              className="text-[10px] font-bold text-blue-600 hover:underline uppercase"
            >
              Mark all as read
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                All caught up!
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    n.type === 'success' ? 'bg-emerald-100' : 
                    n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <div className="text-xs font-bold text-slate-800 truncate pr-2">{n.title}</div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button className="w-full py-3 bg-white border-t border-slate-100 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
