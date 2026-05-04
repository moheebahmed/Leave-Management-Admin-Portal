import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Briefcase,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import StatCard from "../components/StatCard";
import Avatar from "../components/Avatar";
import { useApp } from "../layouts/DashboardLayout";
import { getAvatarColor } from "../data/initialData";

// const DUMMY_PENDING = [
//   { id: 'dummy-1', Employee: { full_name: 'Ayesha Khan' }, LeaveType: { name: 'Annual Leave' }, total_days: 3 },
//   { id: 'dummy-2', Employee: { full_name: 'Usman Tariq' }, LeaveType: { name: 'Sick Leave' }, total_days: 1 },
//   { id: 'dummy-3', Employee: { full_name: 'Sara Malik' }, LeaveType: { name: 'Emergency Leave' }, total_days: 2 },
// ]

const Dashboard = () => {
  const { showToast } = useApp();
  const [employees, setEmployees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [onLeaveCount, setOnLeaveCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [employeesRes, requestsRes, typesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/hr/employees`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/hr/leave/requests`, {
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE_URL}/employees/leave/types`, {
          headers: getAuthHeaders(),
        }),
      ]);

      setEmployees(employeesRes.data.data.employees || []);

      const allRequests = requestsRes.data.data.requests || [];
      const pending = allRequests.filter((r) => r.status === "PENDING");
      setPendingRequests(pending);
      setOnLeaveCount(
        allRequests.filter((r) => r.status === "APPROVED").length,
      );
      setLeaveTypes(typesRes.data.data.leave_types || []);
      // Recent activity — latest 5 requests regardless of status
      setRecentActivity(allRequests.slice(0, 5));
    } catch (error) {
      showToast("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(
        `${API_BASE_URL}/hr/leave/requests/${id}/status`,
        { status },
        { headers: getAuthHeaders() },
      );
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      showToast(
        `Request ${status === "APPROVED" ? "approved" : "rejected"} successfully`,
      );
    } catch {
      showToast("Failed to update status");
    }
  };

  // Department breakdown from real employees
  const depts = ["Engineering", "Design", "Marketing", "HR", "Finance"];
  const deptData = depts.map((d, i) => ({
    name: d,
    count: employees.filter((e) => e.department === d).length,
    color: getAvatarColor(i),
  }));
  const maxCount = Math.max(...deptData.map((d) => d.count), 1);

  // Recent activity from all latest requests
  const activityList = recentActivity.map((r) => ({
    color:
      r.status === "APPROVED"
        ? "#10b981"
        : r.status === "REJECTED"
          ? "#ef4444"
          : "#f59e0b",
    text: `${r.Employee?.full_name} applied for ${r.LeaveType?.name}`,
    status: r.status,
    time: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Recently",
  }));

  return (
    <div className="animate-fade-slide space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">Admin</span>{" "}
          <span className="text-white font-bold">Dashboard</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Here's what's happening across your organization today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          value={employees.length}
          label="Total Employees"
          icon={Users}
          color="blue"
          delta="+2 this month"
          deltaType="up"
        />
        <StatCard
          value={leaveTypes.length}
          label="Leave Types"
          icon={Calendar}
          color="cyan"
          delta="Configured"
          deltaType="up"
        />
        <StatCard
          value={onLeaveCount}
          label="Employees on Leave"
          icon={Briefcase}
          color="purple"
          delta="Active now"
          deltaType="down"
        />
        <StatCard
          value={pendingRequests.length}
          label="Pending Requests"
          icon={AlertCircle}
          color="amber"
          delta="Awaiting review"
          deltaType="down"
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card-base p-5">
          <h3 className="section-title mb-4">Recent Activity</h3>
          <div className="space-y-0">
            {activityList.length === 0 ? (
              <p className="text-slate-600 text-sm py-4 text-center">
                No recent activity
              </p>
            ) : (
              activityList.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 py-3 border-b border-border last:border-0"
                >
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: a.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{a.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-600">{a.time}</p>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          a.status === "APPROVED"
                            ? "bg-emerald/10 text-emerald"
                            : a.status === "REJECTED"
                              ? "bg-danger/10 text-danger"
                              : "bg-accent/10 text-accent"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="card-base p-5">
          <h3 className="section-title mb-4">Department Breakdown</h3>
          <div className="space-y-4">
            {deptData.map((d, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-slate-300">{d.name}</span>
                  <span className="text-xs text-slate-500">{d.count} emp</span>
                </div>
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max((d.count / maxCount) * 100, 4)}%`,
                      background: d.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-3 bg-surface/70 rounded-xl border border-border text-center">
            <div className="font-syne text-2xl font-bold text-accent">
              {employees.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Total Employees</div>
          </div>
        </div>
      </div>

      {/* Pending Requests Table */}
      {/* <div className="card-base overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="section-title">Pending Leave Requests</h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
            {pendingRequests.length} pending
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-max sm:min-w-full">
            <thead>
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th whitespace-nowrap hidden sm:table-cell">Leave Type</th>
                <th className="table-th">Days</th>
                <th className="table-th hidden md:table-cell">Status</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="table-td text-center text-slate-500 py-6">Loading...</td></tr>
              ) : (pendingRequests.length > 0 ? pendingRequests : DUMMY_PENDING).map((req, i) => (
                <tr key={req.id} className={`table-row-hover last:[&>td]:border-0 ${req.id?.toString().startsWith('dummy') ? 'opacity-40 pointer-events-none' : ''}`}>
                  <td className="table-td">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={req.Employee?.full_name || 'Unknown'} index={i} size="sm" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-slate-200 truncate block">{req.Employee?.full_name || '—'}</span>
                        <span className="text-xs text-slate-500 sm:hidden">{req.LeaveType?.name || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-slate-400 whitespace-nowrap hidden sm:table-cell">{req.LeaveType?.name || '—'}</td>
                  <td className="table-td font-semibold text-slate-300">{req.total_days}d</td>
                  <td className="table-td hidden md:table-cell">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent">
                      Pending
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => handleStatusChange(req.id, 'APPROVED')}
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors whitespace-nowrap"
                      >
                        <CheckCircle size={10} className="hidden sm:inline" /> <span className="hidden sm:inline">Approve</span><span className="sm:hidden">✓</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(req.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Reject</span><span className="sm:hidden">✕</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              }
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
};

export default Dashboard;
