import { useState, useEffect } from "react";
import { Search, Filter, X, ChevronDown, ChevronRight } from "lucide-react";
import { TableWrapper, EmptyState } from "../components/Table";
import Avatar from "../components/Avatar";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { useApp } from "../layouts/DashboardLayout";

const MONTHS = [
  { value: "", label: "All Months" },
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-04", label: "April 2026" },
];

const DEPARTMENTS = [
  "All Departments",
  "Engineering",
  "HR",
  "Finance",
  "Design",
  "Marketing",
];

// Extract HH:MM from "HH:MM:SS" or "2026-01-01T18:00:00.000Z" or "2026-01-01 18:00:00"
const extractTime = (val) => {
  if (!val) return null;
  const s = String(val);
  const isoMatch =
    s.match(/T(\d{2}:\d{2})/) || s.match(/\d{4}-\d{2}-\d{2}[T ](\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  const timeMatch = s.match(/^(\d{2}:\d{2})/);
  if (timeMatch) return timeMatch[1];
  return s.slice(0, 5);
};

// Convert minutes to "Xh Ym" format
const minsToHours = (val) => {
  if (!val) return null;
  const total = parseFloat(val);
  if (isNaN(total) || total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = Math.round(total % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Calculate attendance status
const getStatus = (row) => {
  const hasWork = row.work_time && parseFloat(row.work_time) > 0;
  if (!row.clock_in && !hasWork) return "Absent";
  if (row.late && parseFloat(row.late) > 0) return "Late";
  return "Present";
};

const mapEmpAttendance = (emp, rows) =>
  rows.map((r, i) => {
    const lateVal = r.late_minutes ?? r.late ?? null;
    const earlyVal = r.early_minutes ?? r.early ?? null;
    const otVal = r.overtime_minutes ?? r.ot_time ?? null;
    const workVal = r.work_hours ?? r.work_time ?? null;
    const clockIn = extractTime(r.check_in || r.clock_in);
    const clockOut = extractTime(r.check_out || r.clock_out);

    return {
      id: r.id || `${emp.id}-${i}`,
      emp_no: String(emp.employee_code || emp.id),
      ac_no: String(emp.employee_code || emp.id),
      name: emp.full_name || "—",
      department: emp.department || "—",
      date: r.date || "",
      timetable: r.timetable || "Full Day",
      on_duty: extractTime(r.on_duty),
      off_duty: extractTime(r.off_duty),
      clock_in: clockIn,
      clock_out: clockOut,
      normal: r.normal ?? 1,
      real_time: r.real_time ?? null,
      late: lateVal != null && lateVal !== 0 ? String(lateVal) : null,
      early: earlyVal != null && earlyVal !== 0 ? String(earlyVal) : null,
      absent: r.absent ?? 0,
      ot_time: otVal != null && otVal !== 0 ? String(otVal) : null,
      work_time: workVal != null && workVal !== 0 ? String(workVal) : null,
    };
  });

const AttendanceRecords = () => {
  const { showToast } = useApp();
  const [search, setSearch] = useState("");
  const [empList, setEmpList] = useState([]);
  const [attendanceByEmp, setAttendanceByEmp] = useState({});
  const [empLoadingMap, setEmpLoadingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setMonth] = useState("");
  const [selectedDept, setDept] = useState("All Departments");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const empRes = await axios.get(`${API_BASE_URL}/hr/employees`, {
          headers: getAuthHeaders(),
        });
        setEmpList(empRes.data?.data?.employees || []);
      } catch (err) {
        console.error("Fetch employees error:", err);
        showToast?.("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const toggleExpand = async (emp) => {
    const emp_no = String(emp.employee_code || emp.id);
    const isOpen = expanded[emp_no];

    setExpanded((prev) => ({ ...prev, [emp_no]: !isOpen }));

    if (isOpen || attendanceByEmp[emp.id] !== undefined) return;

    setEmpLoadingMap((prev) => ({ ...prev, [emp.id]: true }));
    try {
      const res = await axios.get(
        `${API_BASE_URL}/attendance/employee/${emp.id}`,
        { headers: getAuthHeaders() },
      );
      const raw =
        res.data?.data?.attendance || res.data?.data || res.data || [];
      const rows = Array.isArray(raw) ? raw : [];
      setAttendanceByEmp((prev) => ({
        ...prev,
        [emp.id]: mapEmpAttendance(emp, rows),
      }));
    } catch (err) {
      console.error(`Attendance fetch failed for emp ${emp.id}:`, err);
      showToast?.("Failed to load attendance for this employee");
      setAttendanceByEmp((prev) => ({ ...prev, [emp.id]: [] }));
    } finally {
      setEmpLoadingMap((prev) => ({ ...prev, [emp.id]: false }));
    }
  };

  const activeFilters = [
    selectedMonth,
    selectedDept !== "All Departments",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setMonth("");
    setDept("All Departments");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  // Filter employees by search / dept
  const filteredEmps = empList.filter((emp) => {
    const emp_no = String(emp.employee_code || emp.id);
    const name = (emp.full_name || "").toLowerCase();
    const dept = emp.department || "";
    const matchSearch =
      name.includes(search.toLowerCase()) || emp_no.includes(search);
    const matchDept =
      selectedDept !== "All Departments" ? dept === selectedDept : true;
    return matchSearch && matchDept;
  });

  const totalRecords = filteredEmps.reduce((acc, emp) => {
    const rows = (attendanceByEmp[emp.id] || []).filter((r) => {
      const matchMonth = selectedMonth
        ? r.date.startsWith(selectedMonth)
        : true;
      const matchFrom = dateFrom ? r.date >= dateFrom : true;
      const matchTo = dateTo ? r.date <= dateTo : true;
      return matchMonth && matchFrom && matchTo;
    });
    return acc + rows.length;
  }, 0);

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">Attendance</span>{" "}
          <span className="text-white font-bold">Records</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          {filteredEmps.length} employees · {totalRecords} records loaded
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card-base px-4 py-4">
        {/* Row 1: Label + Clear */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold uppercase tracking-widest">
            <Filter size={12} />
            Filters
            {activeFilters > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold leading-none">
                {activeFilters}
              </span>
            )}
          </div>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30 text-xs flex items-center gap-1"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Row 2: All filters in a responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Month */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setMonth(e.target.value)}
              className={`w-full bg-surface/70 border rounded-lg px-2 py-2 text-xs outline-none cursor-pointer transition-all
          ${selectedMonth ? "border-accent/50 text-slate-200" : "border-border text-slate-400"}`}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-card">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setDept(e.target.value)}
              className={`w-full bg-surface/70 border rounded-lg px-2 py-2 text-xs outline-none cursor-pointer transition-all
          ${selectedDept !== "All Departments" ? "border-accent/50 text-slate-200" : "border-border text-slate-400"}`}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d} className="bg-card">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`w-full bg-surface/70 border rounded-lg px-2 py-2 text-xs outline-none cursor-pointer transition-all hover:border-accent/60
          ${dateFrom ? "border-accent/50 text-slate-200" : "border-border text-slate-400"}`}
            />
          </div>

          {/* Date To */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`w-full bg-surface/70 border rounded-lg px-2 py-2 text-xs outline-none cursor-pointer transition-all hover:border-accent/60
          ${dateTo ? "border-accent/50 text-slate-200" : "border-border text-slate-400"}`}
            />
          </div>

          {/* Search — full width on mobile, last col on desktop */}
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-3 lg:col-span-1">
            <label className="text-[10px] text-slate-600 font-semibold uppercase tracking-widest">
              Search
            </label>
            <div className="flex items-center gap-2 bg-surface/70 border border-border rounded-lg px-3 h-[34px] transition-all focus-within:border-accent/60 focus-within:shadow-[0_0_0_3px_rgba(224,77,51,0.08)]">
              <Search size={12} className="text-slate-500 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, emp no…"
                className="bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none flex-1 min-w-0"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-slate-600 hover:text-slate-400 shrink-0"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <TableWrapper title="All Attendance Records">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
            <svg
              className="animate-spin h-4 w-4 text-accent"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Loading employees…
          </div>
        ) : filteredEmps.length === 0 ? (
          <EmptyState message="No employees match your filters." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th w-8"></th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Emp No.
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Employee
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Department
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Records
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmps.map((emp, i) => {
                const emp_no = String(emp.employee_code || emp.id);
                const isOpen = !!expanded[emp_no];
                const isLoading = !!empLoadingMap[emp.id];

                // Filter loaded records by date filters
                const empRecords = (attendanceByEmp[emp.id] || []).filter(
                  (r) => {
                    const matchMonth = selectedMonth
                      ? r.date.startsWith(selectedMonth)
                      : true;
                    const matchFrom = dateFrom ? r.date >= dateFrom : true;
                    const matchTo = dateTo ? r.date <= dateTo : true;
                    return matchMonth && matchFrom && matchTo;
                  },
                );

                return (
                  <>
                    {/* Employee Row */}
                    <tr
                      key={emp_no}
                      className="table-row-hover cursor-pointer"
                      onClick={() => toggleExpand(emp)}
                    >
                      <td className="table-td w-8">
                        {isLoading ? (
                          <svg
                            className="animate-spin h-3.5 w-3.5 text-accent"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                        ) : isOpen ? (
                          <ChevronDown size={14} className="text-accent" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-500" />
                        )}
                      </td>
                      <td className="table-td">
                        <span className="font-mono text-xs text-slate-400 bg-surface/70 px-2 py-0.5 rounded border border-border whitespace-nowrap">
                          {emp_no}
                        </span>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            name={emp.full_name || "—"}
                            index={i}
                            size="sm"
                          />
                          <span className="font-medium text-slate-200 text-[13px] whitespace-nowrap">
                            {emp.full_name || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="table-td text-slate-400 text-xs whitespace-nowrap">
                        {emp.department || "—"}
                      </td>
                      <td className="table-td">
                        {attendanceByEmp[emp.id] !== undefined ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                            {empRecords.length} records
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 italic">
                            click to load
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Records */}
                    {isOpen && (
                      <tr key={`${emp_no}-exp`}>
                        <td colSpan={5} className="px-4 pb-3 pt-0">
                          <div className="ml-8 rounded-lg border border-border overflow-x-auto">
                            {isLoading ? (
                              <div className="flex items-center justify-center py-8 text-slate-500 text-xs gap-2">
                                <svg
                                  className="animate-spin h-3.5 w-3.5 text-accent"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8z"
                                  />
                                </svg>
                                Loading attendance…
                              </div>
                            ) : empRecords.length === 0 ? (
                              <div className="py-8 text-center text-slate-600 text-xs">
                                No records found
                              </div>
                            ) : (
                              <table className="w-full min-w-[900px]">
                                <thead>
                                  <tr className="bg-surface/50">
                                    {[
                                      "Date",
                                      "Timetable",
                                      "On Duty",
                                      "Off Duty",
                                      "Check In",
                                      "Check Out",
                                      "Late minutes",
                                      "Early minutes",
                                      "Status",
                                      "OT Time",
                                      "Work hour",
                                    ].map((h) => (
                                      <th
                                        key={h}
                                        className="table-th text-[11px] text-slate-500 whitespace-nowrap"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {empRecords.map((row) => (
                                    <tr
                                      key={row.id}
                                      className="border-t border-border/50 hover:bg-card-hover transition-colors"
                                    >
                                      <td className="table-td text-slate-400 text-xs whitespace-nowrap">
                                        {row.date}
                                      </td>
                                      <td className="table-td">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 whitespace-nowrap">
                                          {row.timetable}
                                        </span>
                                      </td>
                                      <td className="table-td text-slate-400 text-xs font-mono whitespace-nowrap">
                                        {row.on_duty || "—"}
                                      </td>
                                      <td className="table-td text-slate-400 text-xs font-mono whitespace-nowrap">
                                        {row.off_duty || "—"}
                                      </td>
                                      <td className="table-td text-slate-300 text-xs font-mono whitespace-nowrap">
                                        {row.clock_in || "—"}
                                      </td>
                                      <td className="table-td text-slate-300 text-xs font-mono whitespace-nowrap">
                                        {row.clock_out || "—"}
                                      </td>
                                      <td className="table-td text-xs font-mono whitespace-nowrap">
                                        {row.late ? (
                                          <span className="text-red-400 font-semibold bg-red-500/10 px-1.5 py-0.5 rounded">
                                            {row.late}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600">
                                            —
                                          </span>
                                        )}
                                      </td>
                                      <td className="table-td text-xs font-mono whitespace-nowrap">
                                        {row.early ? (
                                          <span className="text-green-400 font-semibold bg-green-500/10 px-1.5 py-0.5 rounded">
                                            {row.early}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600">
                                            —
                                          </span>
                                        )}
                                      </td>
                                      <td className="table-td text-xs text-center whitespace-nowrap">
                                        {(() => {
                                          const s = getStatus(row);
                                          if (s === "Absent")
                                            return (
                                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                                Absent
                                              </span>
                                            );
                                          if (s === "Late")
                                            return (
                                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                                Late
                                              </span>
                                            );
                                          return (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                              Present
                                            </span>
                                          );
                                        })()}
                                      </td>
                                      <td className="table-td text-xs font-mono whitespace-nowrap">
                                        {row.ot_time ? (
                                          <span className="text-blue-400 font-semibold">
                                            {row.ot_time}
                                          </span>
                                        ) : (
                                          <span className="text-slate-600">
                                            —
                                          </span>
                                        )}
                                      </td>
                                      <td className="table-td text-xs font-mono text-slate-300 font-semibold whitespace-nowrap">
                                        {minsToHours(row.work_time) || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
};

export default AttendanceRecords;
