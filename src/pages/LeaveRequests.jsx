import { useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Copy,
  Search,
  ChevronDown,
  X,
  Save,
  Plus,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { useApp } from "../layouts/DashboardLayout";
import { TableWrapper, EmptyState } from "../components/Table";
import Avatar from "../components/Avatar";
import ConfirmModal from "../components/ConfirmModal";

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status, onStatusChange, isLeadApproval, request, leaveBalances }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [balanceError, setBalanceError] = useState("");

  const colors = {
    APPROVED: "bg-emerald/10 text-emerald border-emerald/20",
    PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    REJECTED: "bg-danger/10 text-danger border-danger/20",
  };
  const allStatuses = ["APPROVED", "PENDING", "REJECTED"];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <span
        className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer select-none flex items-center gap-1 ${colors[status] || colors.PENDING}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        {status}
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </span>

      <div
        className="absolute z-50 mt-1 left-0 bg-[#1a1a1a] border border-border rounded-lg shadow-xl overflow-hidden min-w-[140px]"
        style={{
          transition: "opacity 0.15s ease, transform 0.15s ease",
          opacity: open ? 1 : 0,
          transform: open
            ? "translateY(0px) scale(1)"
            : "translateY(-6px) scale(0.97)",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {allStatuses.map((s) => {
          const isDisabled = s === "APPROVED" && !isLeadApproval;

          let hasInsufficientBalance = false;
          let balanceInfo = null;

          if (s === "APPROVED" && leaveBalances && request) {
            console.log("Checking balance for request:", request.Employee?.id, request.LeaveType?.id, request.total_days);
            console.log("Available balances:", leaveBalances);

            const employeeBalance = leaveBalances.find(
              (b) => b.empId === request.Employee?.id
            );

            console.log("Employee balance found:", employeeBalance);

            if (employeeBalance && employeeBalance.balances) {
              const leaveTypeBalance = employeeBalance.balances.find(
                (b) => b.LeaveType?.id === request.LeaveType?.id || b.leave_type_id === request.LeaveType?.id
              );

              console.log("Leave type balance found:", leaveTypeBalance);

              if (leaveTypeBalance) {
                balanceInfo = leaveTypeBalance;
                const remaining = leaveTypeBalance.remaining || (leaveTypeBalance.total_allowed - leaveTypeBalance.used);
                console.log("Remaining balance:", remaining, "Requested days:", request.total_days);
                if (remaining < request.total_days) {
                  hasInsufficientBalance = true;
                }
              }
            }
          }

          return (
            <div
              key={s}
              className={`text-xs px-3 py-2 flex items-center gap-2 transition-colors ${colors[s]} 
                ${s === status ? "opacity-100 font-semibold" : "opacity-70"}
                ${isDisabled || hasInsufficientBalance
                  ? "opacity-30 cursor-not-allowed"
                  : "cursor-pointer hover:bg-white/5"
                }`}
              onClick={(e) => {
                e.stopPropagation();
                if (isDisabled || hasInsufficientBalance) return;
                if (s !== status) onStatusChange(s);
                setOpen(false);
              }}
              title={hasInsufficientBalance ? `Insufficient balance: ${balanceInfo?.remaining || (balanceInfo?.total_allowed - balanceInfo?.used)} remaining, ${request.total_days} requested` : isDisabled ? "Lead approval required" : ""}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="flex-1">{s}</span>
              {isDisabled && (
                <span className="text-[9px] text-yellow-500 font-medium">
                  Lead required
                </span>
              )}
              {hasInsufficientBalance && (
                <span className="text-[9px] text-danger font-medium">
                  No balance
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Feedback Modal ───────────────────────────────────────────────────────────
const FeedbackModal = ({ request, onClose, onSave, leaveBalances }) => {
  const [feedback, setFeedback] = useState(request?.feedback || "");
  const [saving, setSaving] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  const handleSave = async (status) => {
    setSaving(true);

    // Check leave balance if approving
    if (status === "APPROVED" && leaveBalances) {
      const employeeBalance = leaveBalances.find(
        (b) => b.empId === request.Employee?.id
      );

      if (employeeBalance && employeeBalance.balances) {
        const leaveTypeBalance = employeeBalance.balances.find(
          (b) => b.LeaveType?.id === request.LeaveType?.id || b.leave_type_id === request.LeaveType?.id
        );

        if (leaveTypeBalance) {
          const remaining = leaveTypeBalance.remaining || (leaveTypeBalance.total_allowed - leaveTypeBalance.used);
          if (remaining < request.total_days) {
            setBalanceError(
              `Insufficient balance! Employee has ${remaining} days remaining but requesting ${request.total_days} days.`
            );
            setSaving(false);
            return;
          }
        }
      }
    }

    await onSave(request.id, { feedback, status });
    setSaving(false);
    onClose();
  };

  if (!request) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-[15px]">Update Feedback</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Request #{request.id} — {request.Employee?.full_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Row */}
        <div className="bg-surface/50 border border-border rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Leave Type</span>
            <span className="text-cyan">{request.LeaveType?.name || "—"}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Status</span>
            <span
              className={`font-semibold ${request.status === "APPROVED"
                ? "text-emerald"
                : request.status === "REJECTED"
                  ? "text-red-400"
                  : "text-yellow-400"
                }`}
            >
              {request.status}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total Days</span>
            <span className="text-white">{request.total_days}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Lead Approval</span>
            <span
              className={`font-semibold ${request.isLeadApproval ? "text-white" : "text-yellow-500"}`}
            >
              {request.isLeadApproval ? "APPROVED" : "PENDING"}
            </span>
          </div>
        </div>

        {/* Balance Error Alert */}
        {balanceError && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-3">
            <p className="text-xs text-danger font-medium">{balanceError}</p>
          </div>
        )}

        {/* Feedback Input */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium">Feedback</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter feedback..."
            rows={3}
            className="w-full bg-surface/70 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-accent/50 resize-none transition-colors"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={() => handleSave("REJECTED")}
            disabled={saving}
            className="btn-ghost text-xs w-[4.5rem] text-white"
          >
            Rejected
          </button>

          <button
            onClick={() => handleSave("APPROVED")}
            disabled={saving || !!balanceError}
            className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={13} className="text-white" />
            {saving ? "Saving..." : (balanceError ? "Cannot Approve" : "APPROVED")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const LeaveRequests = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [modalRequest, setModalRequest] = useState(null);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalances();
  }, []);

  const fetchLeaveBalances = async () => {
    try {
      const empRes = await axios.get(`${API_BASE_URL}/hr/employees`, {
        headers: getAuthHeaders(),
      });
      const employees = empRes.data.data.employees;

      const grouped = [];

      await Promise.all(
        employees.map(async (emp) => {
          try {
            const balRes = await axios.get(
              `${API_BASE_URL}/hr/employees/${emp.id}/balances`,
              { headers: getAuthHeaders() },
            );
            const balances = balRes.data.data.balances;

            if (balances.length > 0) {
              grouped.push({
                empId: emp.id,
                employeeName: emp.full_name,
                balances: balances,
              });
            }
          } catch (error) {
            console.log("Error fetching balance for employee:", emp.id, error);
          }
        }),
      );

      console.log("Leave Balances Fetched:", grouped);
      setLeaveBalances(grouped);
    } catch (error) {
      console.log("Error fetching balances:", error);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/hr/leave/requests`, {
        headers: getAuthHeaders(),
      });
      setRequests(res.data.data.requests || []);
    } catch (error) {
      showToast("Failed to fetch leave requests");
    } finally {
      setLoading(false);
    }
  };

  const filtered = requests.filter(
    (req) =>
      req.Employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      req.LeaveType?.name?.toLowerCase().includes(search.toLowerCase()) ||
      req.status?.toLowerCase().includes(search.toLowerCase()),
  );

  // ─── Employee ke basis pe group karo ─────────────────────────────────────
  const groupedByEmployee = filtered.reduce((acc, req) => {
    const key = req.Employee?.full_name || "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(req);
    return acc;
  }, {});

  const groupedRows = Object.values(groupedByEmployee);
  // ─────────────────────────────────────────────────────────────────────────

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name: name || `Request #${id}` });
  };

  const confirmDelete = async () => {
    const { id, isBulk } = deleteTarget;
    setDeleteTarget(null);
    try {
      if (isBulk) {
        await Promise.all(
          selectedRows.map((rid) =>
            axios.delete(`${API_BASE_URL}/hr/leave/requests/${rid}`, {
              headers: getAuthHeaders(),
            }),
          ),
        );
        setRequests((prev) => prev.filter((r) => !selectedRows.includes(r.id)));
        setSelectedRows([]);
        showToast("Selected requests deleted successfully");
      } else {
        await axios.delete(`${API_BASE_URL}/hr/leave/requests/${id}`, {
          headers: getAuthHeaders(),
        });
        setRequests((prev) => prev.filter((r) => r.id !== id));
        showToast("Leave request deleted successfully");
      }
    } catch {
      showToast("Failed to delete leave request");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/hr/leave/requests/${id}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() },
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );

      if (newStatus === "APPROVED" || newStatus === "REJECTED") {
        await fetchLeaveBalances();
      }

      showToast(`Status updated to ${newStatus}`);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleFeedbackSave = async (id, { feedback, status }) => {
    try {
      await axios.put(
        `${API_BASE_URL}/employees/leave/requests/${id}/update`,
        { feedback },
        { headers: getAuthHeaders() },
      );
      if (status) {
        await axios.put(
          `${API_BASE_URL}/hr/leave/requests/${id}/status`,
          { status },
          { headers: getAuthHeaders() },
        );
      }
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, feedback, ...(status && { status }) } : r,
        ),
      );

      if (status === "APPROVED" || status === "REJECTED") {
        await fetchLeaveBalances();
      }

      showToast("Saved successfully ");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save");
    }
  };

  const handleLeadApprovalToggle = async (id, currentValue) => {
    const newValue = !currentValue;
    try {
      await axios.put(
        `${API_BASE_URL}/employees/leave/requests/${id}/update`,
        { isLeadApproval: newValue },
        { headers: getAuthHeaders() },
      );
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isLeadApproval: newValue } : r)),
      );
      showToast(`Lead Approval ${newValue ? "enabled" : "disabled"}`);
    } catch (error) {
      showToast("Failed to update Lead Approval");
    }
  };

  const handleCopy = (request) => {
    const text = `Employee: ${request.Employee?.full_name}\nLeave Type: ${request.LeaveType?.name}\nDates: ${request.start_date} - ${request.end_date}\nDays: ${request.total_days}\nStatus: ${request.status}`;
    navigator.clipboard.writeText(text);
    showToast("Request details copied to clipboard");
  };

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Feedback Modal */}
      {modalRequest && (
        <FeedbackModal
          request={modalRequest}
          onClose={() => setModalRequest(null)}
          onSave={handleFeedbackSave}
          leaveBalances={leaveBalances}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Leave</span>{" "}
            <span className="text-white font-bold">Requests</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {requests.length} requests submitted
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedRows.length > 0 && (
            <button
              className="btn-ghost hover:!bg-danger/10 hover:!text-danger"
              onClick={() => {
                setDeleteTarget({
                  id: null,
                  name: `${selectedRows.length} selected requests`,
                  isBulk: true,
                });
              }}
            >
              <Trash2 size={14} />
              Delete Selected ({selectedRows.length})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <TableWrapper
        title="All Leave Requests"
        action={
          <div className="flex items-center gap-2 bg-surface/70 border border-border rounded-lg px-3 py-1.5">
            <Search size={12} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests…"
              className="bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none w-40"
            />
          </div>
        }
      >
        {loading ? (
          <EmptyState message="Loading leave requests..." />
        ) : filtered.length === 0 ? (
          <EmptyState message="No leave requests found." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Employee
                </th>
                {/* <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  IDwwwww
                </th> */}
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Leave Type
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Start Date
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  End Date
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Total Days
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Reason
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Status
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Actioned By
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Feedback
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Lead Approval
                </th>
                <th className="table-th text-center font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group, groupIndex) =>
                group.map((req, rowIndex) => (
                  <tr
                    key={req.id}
                    className="table-row-hover last:[&>td]:border-0 cursor-pointer"
                    onClick={() => setModalRequest(req)}
                  >
                    {rowIndex === 0 && (
                      <td
                        className="table-td align-middle"
                        rowSpan={group.length}
                        style={{
                          borderRight: "1px solid rgba(255,255,255,0.07)",
                          background: "rgba(255,255,255,0.01)",
                          verticalAlign: "middle",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={req.Employee?.full_name || "Unknown"}
                            index={req.Employee?.id}
                            size="sm"
                          />
                          <span className="font-medium text-slate-200 text-[13.5px] whitespace-nowrap">
                            {req.Employee?.full_name || "—"}
                          </span>
                        </div>
                        {group.length > 1 && (
                          <div className="mt-1">
                            <span className="text-[10px] text-slate-500 bg-surface/60 border border-border px-1.5 py-0.5 rounded-full">
                              {group.length} requests
                            </span>
                          </div>
                        )}
                      </td>
                    )}
                    {/* Leave Type */}
                    <td className="table-td whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
                        {req.LeaveType?.name || "—"}
                      </span>
                    </td>

                    {/* Start Date */}
                    <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                      {req.start_date
                        ? new Date(req.start_date).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* End Date */}
                    <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                      {req.end_date
                        ? new Date(req.end_date).toLocaleDateString()
                        : "—"}
                    </td>

                    {/* Total Days */}
                    <td className="table-td">
                      <span className="font-semibold text-slate-300 text-[13px]">
                        {req.total_days}
                      </span>
                    </td>

                    {/* Reason */}
                    <td className="table-td text-[#fff] font-medium text-[12.5px] max-w-[160px] truncate">
                      {req.reason || "—"}
                    </td>

                    {/* Status */}
                    <td
                      className="table-td"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StatusBadge
                        status={req.status}
                        isLeadApproval={req.isLeadApproval}
                        request={req}
                        leaveBalances={leaveBalances}
                        onStatusChange={(newStatus) =>
                          handleStatusChange(req.id, newStatus)
                        }
                      />
                    </td>

                    {/* Actioned By */}
                    <td className="table-td text-slate-400 text-[12.5px]">
                      {req.actioned_by || "—"}
                    </td>

                    {/* Feedback */}
                    <td className="table-td text-[12.5px] max-w-[130px] truncate">
                      {req.feedback ? (
                        <span className="text-slate-300">{req.feedback}</span>
                      ) : (
                        <span className="text-slate-600 italic">
                          No feedback
                        </span>
                      )}
                    </td>

                    {/* Lead Approval Toggle */}
                    <td
                      className="table-td"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          handleLeadApprovalToggle(req.id, req.isLeadApproval)
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${req.isLeadApproval ? "bg-accent" : "bg-slate-700"
                          }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${req.isLeadApproval
                            ? "translate-x-5"
                            : "translate-x-0"
                            }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td
                      className="table-td"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                          title="Edit Feedback"
                          onClick={() => setModalRequest(req)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn-ghost hover:!bg-cyan/10 hover:!text-cyan hover:!border-cyan/30"
                          title="Copy"
                          onClick={() => handleCopy(req)}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                          title="Delete"
                          onClick={() => handleDelete(req.id, req.Employee?.full_name)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        )}
      </TableWrapper>

      <ConfirmModal
        target={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        entityLabel="Leave Request"
      />
    </div>
  );
};

export default LeaveRequests;