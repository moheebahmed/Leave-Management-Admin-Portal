import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  PlusCircle,
  Settings,
  LogOut,
  Bell,
  Tag,
  X,
  Building2,
  Upload,
  CalendarCheck,
  Banknote,
  Clock,
  CalendarDays,
  TableProperties,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "ADMIN",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    label: "Employees",
    items: [
      { to: "/employees", label: "Employees", icon: Users },
      { to: "/add-employee", label: "Add Employees", icon: UserPlus },
      { to: "/departments", label: "Departments", icon: Building2 },
    ],
  },
  {
    label: "Leaves",
    items: [
      { to: "/leave-requests", label: "Leave Requests", icon: ClipboardList },
      { to: "/leave-balance", label: "Leave Balance", icon: ClipboardList },
      { to: "/add-leave", label: "Add Leave Balance", icon: PlusCircle },
      { to: "/leave-types", label: "Leave Types", icon: Tag },
    ],
  },
  {
    label: "Attendance",
    items: [
      { to: '/attendance-upload', label: 'Upload Attendance', icon: Upload },
      { to: '/attendance-records', label: 'Attendance Records', icon: CalendarCheck },
      { to: '/attendance-register', label: 'Attendance Register', icon: TableProperties },
      { to: "/shifts", label: "Shifts", icon: Clock },
      { to: "/holidays", label: "Holidays", icon: CalendarDays },
    ],
  },
  {
  label: 'Payroll',
  items: [
  { to: '/payroll', label: 'Payroll', icon: Banknote },
  { to: '/payroll-settings', label: 'Payroll Settings', icon: Settings },
  ],
  },
  {
    label: "General",
    items: [{ to: "/notifications", label: "Notifications", icon: Bell }],
  },
];

const Sidebar = ({ collapsed, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("auth-change"));
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`
        flex flex-col bg-surface/75 backdrop-blur border-r border-border z-50 transition-all duration-300 shrink-0
        ${collapsed ? "w-16" : "w-60"}
      `}
    >
      {/* Logo */}
      <div
        className={`flex items-center justify-between py-4 border-b border-border overflow-hidden transition-all duration-300 ${collapsed ? "px-1" : "px-4"}`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-10 h-10 shrink-0">
            <img
              src="/logo.png"
              alt="logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div
            className={`transition-opacity duration-200 ${collapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100"}`}
          >
            <div className="font-syne font-bold text-sm text-slate-100 whitespace-nowrap leading-tight">
              LeaveOS
            </div>
            <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
              HR Suite
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div
              className={`text-[9px] font-semibold uppercase tracking-widest text-slate-600 px-2 pb-1.5 transition-opacity duration-200 ${
                collapsed ? "opacity-0" : "opacity-100"
              }`}
            >
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 overflow-hidden whitespace-nowrap
                    ${
                      isActive
                        ? "bg-accent/10 text-accent border border-accent/20 nav-active-bar"
                        : "text-slate-500 hover:bg-card/70 hover:text-slate-200"
                    }`
                  }
                >
                  <Icon size={15} className="shrink-0" />
                  <span
                    className={`transition-opacity duration-200 ${
                      collapsed
                        ? "opacity-0 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    {label}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* System */}
        <div>
          <div
            className={`text-[9px] font-semibold uppercase tracking-widest text-slate-600 px-2 pb-1.5 transition-opacity duration-200 ${
              collapsed ? "opacity-0" : "opacity-100"
            }`}
          >
            System
          </div>
          {/* <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-card/70 hover:text-slate-200 transition-all duration-150 overflow-hidden whitespace-nowrap">
            <Settings size={15} className="shrink-0" />
            <span className={`transition-opacity duration-200 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              Settings
            </span>
          </button> */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-500 hover:bg-card/70 hover:text-danger transition-all duration-150 overflow-hidden whitespace-nowrap"
          >
            <LogOut size={15} className="shrink-0" />
            <span
              className={`transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
            >
              Logout
            </span>
          </button>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-2 border-t border-border">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg overflow-hidden">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div
            className={`transition-opacity duration-200 ${collapsed ? "opacity-0" : "opacity-100"}`}
          >
            <div className="text-xs font-semibold text-slate-200 whitespace-nowrap">
              Admin HR
            </div>
            <div className="text-[10px] text-slate-500">Super Admin HR</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
