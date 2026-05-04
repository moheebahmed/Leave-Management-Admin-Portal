import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { useApp } from "../layouts/DashboardLayout";
import { TableWrapper, EmptyState } from "../components/Table";
import Avatar from "../components/Avatar";
import { Badge } from "../components/Badge";

const ProgressBar = ({ used, total }) => {
  const pct = Math.min(Math.round((used / Math.max(total, 1)) * 100), 100);
  const color = "#E04D33";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] text-slate-600 w-7 text-right">{pct}%</span>
    </div>
  );
};

const LeaveBalance = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [groupedBalances, setGroupedBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchAllBalances();
  }, []);

  const fetchAllBalances = async () => {
    try {
      setLoading(true);

      const empRes = await axios.get(`${API_BASE_URL}/hr/employees`, {
        headers: getAuthHeaders(),
      });
      const employees = empRes.data.data.employees;

      const grouped = [];

      await Promise.all(
        employees.map(async (emp, empIndex) => {
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
                department: emp.department,
                balances: balances,
              });
            }
          } catch {
            // skip
          }
        }),
      );

      setGroupedBalances(grouped);
    } catch (error) {
      console.log("Error fetching balances:", error);
      showToast("Failed to fetch leave balances");
    } finally {
      setLoading(false);
    }
  };

  // Row expand/collapse toggle
  const toggleRow = (empId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [empId]: !prev[empId],
    }));
  };

  const handleDeleteBalance = async (empId, empName) => {
    try {
      await axios.delete(`${API_BASE_URL}/hr/employees/${empId}/balances`, {
        headers: getAuthHeaders(),
      });
      setGroupedBalances((prev) => prev.filter((g) => g.empId !== empId));
      showToast(`Leave balance for ${empName} has been deleted.`);
    } catch {
      showToast("Failed to delete leave balance");
    }
  };

  // Total records count
  const totalRecords = groupedBalances.reduce(
    (sum, g) => sum + g.balances.length,
    0,
  );

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Leave</span>{" "}
            <span className="text-white font-bold">Balances</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {totalRecords} records tracked
          </p>
        </div>
        <button
          className="btn-primary self-start sm:self-auto"
          onClick={() => navigate("/add-leave")}
        >
          <PlusCircle size={14} />
          Add Balance
        </button>
      </div>

      {/* Table */}
      <TableWrapper title="All Leave Records">
        {loading ? (
          <EmptyState message="Loading leave balances..." />
        ) : groupedBalances.length === 0 ? (
          <EmptyState message="No leave balance records yet. Add one to get started." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] w-8"></th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Employee
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Department
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Leave Types
                </th>
                <th className="table-th text-right font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedBalances.map((group) => (
                <>
                  {/*  Main Employee Row */}
                  <tr
                    key={group.empId}
                    className="table-row-hover cursor-pointer"
                    onClick={() => toggleRow(group.empId)}
                  >
                    {/* Expand Icon */}
                    <td className="table-td w-8">
                      {expandedRows[group.empId] ? (
                        <ChevronDown size={14} className="text-accent" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-500" />
                      )}
                    </td>

                    {/* Employee Name */}
                    <td className="table-td">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={group.employeeName}
                          index={group.empId}
                          size="sm"
                        />
                        <span className="font-medium text-slate-200 text-[13.5px] whitespace-nowrap">
                          {group.employeeName}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                      {group.department || "—"}
                    </td>

                    {/* Leave Types Count */}
                    <td className="table-td whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                        {group.balances.length} leave types
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                          title="Edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/edit-leave/${group.empId}`);
                          }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                          title="Delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBalance(
                              group.empId,
                              group.employeeName,
                            );
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Leave Details */}
                  {expandedRows[group.empId] && (
                    <tr key={`${group.empId}-expanded`}>
                      <td colSpan={5} className="px-4 pb-3 pt-0">
                        <div className="ml-8 rounded-lg border border-border overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-surface/50">
                                <th className="table-th text-[11px] text-slate-500 whitespace-nowrap">
                                  Leave Type
                                </th>
                                <th className="table-th text-[11px] text-slate-500 whitespace-nowrap">
                                  Total
                                </th>
                                <th className="table-th text-[11px] text-slate-500 whitespace-nowrap">
                                  Used
                                </th>
                                <th className="table-th text-[11px] text-slate-500 whitespace-nowrap">
                                  Remaining
                                </th>
                                <th
                                  className="table-th text-[11px] text-slate-500 whitespace-nowrap"
                                  style={{ minWidth: 120 }}
                                >
                                  Usage
                                </th>
                                <th className="table-th text-[11px] text-slate-500 whitespace-nowrap">
                                  Updated
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.balances.map((bal) => {
                                return (
                                  <tr
                                    key={bal.id}
                                    className="border-t border-border/50"
                                  >
                                    <td className="table-td whitespace-nowrap">
                                      <Badge color="white">
                                        {bal.LeaveType?.name || "—"}
                                      </Badge>
                                    </td>
                                    <td className="table-td font-semibold text-slate-300 text-[13px] whitespace-nowrap">
                                      {bal.total_allowed}
                                    </td>
                                    <td className="table-td whitespace-nowrap">
                                      <span className="font-medium text-accent text-[13px]">
                                        {bal.used}
                                      </span>
                                    </td>
                                    <td className="table-td whitespace-nowrap">
                                      <span className="font-bold text-[14px] text-emerald">
                                        {bal.remaining}
                                      </span>
                                    </td>
                                    <td
                                      className="table-td"
                                      style={{ minWidth: 120 }}
                                    >
                                      <ProgressBar
                                        used={bal.used}
                                        total={bal.total_allowed}
                                      />
                                    </td>
                                    <td className="table-td text-slate-500 text-[12px] whitespace-nowrap">
                                      {bal.updated_at
                                        ? new Date(
                                            bal.updated_at,
                                          ).toLocaleDateString()
                                        : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
};

export default LeaveBalance;
