import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  UserPlus,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../layouts/DashboardLayout";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_BASE_URL, getAuthHeaders } from "../api/config";

const INITIAL_FORM = {
  full_name: "",
  email: "",
  password: "",
  role: "EMPLOYEE",
  department_id: "",
  shift_id: "",
  designation: "",
  designation_id: "",
  grade_id: "",
  employment_type_id: "",
  joining_date: "",
  confirmation_date: "",
  employee_code: "",
};

// ─── Reusable ComboSelect ───────────────────────────────────────────────────
const ComboSelect = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  labelKey = "label",
  valueKey = "value",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o[labelKey]?.toLowerCase().includes(query.toLowerCase()),
  );

  const displayValue = () => {
    if (query !== "") return query;
    const found = options.find((o) => String(o[valueKey]) === String(value));
    return found ? found[labelKey] : value || "";
  };

  return (
    <div ref={ref} className="relative">
      <input
        className="form-input-base w-full"
        placeholder={disabled ? "Loading..." : placeholder}
        disabled={disabled}
        value={displayValue()}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        autoComplete="off"
      />
      {open && !disabled && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#1a1a1a] border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500">
              No match — your typed value will be used
            </div>
          ) : (
            filtered.map((o) => (
              <div
                key={o[valueKey]}
                onClick={() => {
                  onChange(o[valueKey]);
                  setQuery("");
                  setOpen(false);
                }}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors
                  ${String(o[valueKey]) === String(value)
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-slate-300 hover:bg-white/5"
                  }`}
              >
                {o[labelKey]}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
// ───────────────────────────────────────────────────────────────────────────


// ─── File Parser Helper (CSV + Excel) ──────────────────────────
const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
};

const FIELD_MAP = {
  // email
  email: "email",
  // password
  password: "password",
  // full name
  full_name: "full_name", name: "full_name", "full name": "full_name",
  // employee code
  employee_code: "employee_code", "employee code": "employee_code", code: "employee_code",
  // department
  department_name: "department_name", department: "department_name",
  // designation
  designation_title: "designation_title", designation: "designation_title",
  // shift
  shift_name: "shift_name", shift: "shift_name",
  // employment type
  employment_type: "employment_type", "employment type": "employment_type",
  // joining date
  joining_date: "joining_date", "joining date": "joining_date",
  // confirmation date
  confirmation_date: "confirmation_date", "confirmation date": "confirmation_date",
  // grade
  grade_name: "grade_name", grade: "grade_name",
  // role
  role: "role",
};

const normalizeRow = (raw) => {
  const out = {};
  Object.entries(raw).forEach(([key, val]) => {
    const normalized = key.trim().toLowerCase();
    const mapped = FIELD_MAP[normalized];
    if (mapped) out[mapped] = val !== undefined && val !== null ? String(val).trim() : "";
  });
  return out;
};

const parseExcel = (buffer) => {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];

  const all = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, all.length); i++) {
    const nonEmpty = all[i].filter((c) => c !== "" && c !== null && c !== undefined);
    if (nonEmpty.length > 3) { headerRowIdx = i; break; }
  }

  const headers = all[headerRowIdx].map((h) => (h !== null && h !== undefined ? String(h).trim() : ""));
  const dataRows = all.slice(headerRowIdx + 1).filter((row) =>
    row.some((c) => c !== "" && c !== null && c !== undefined)
  );

  const HEADER_MAP = {
    "employee name": "full_name",
    "name": "full_name",
    "full name": "full_name",
    "full_name": "full_name",
    "email": "email",
    "email address": "email",
    "password": "password",
    "id no.": "employee_code",
    "employee code": "employee_code",
    "employee_code": "employee_code",
    "code": "employee_code",
    "department": "department",
    "department_name": "department",
    "designation": "designation",
    "designation_title": "designation",
    "shift timings": "shift",
    "shift": "shift",
    "shift_name": "shift",
    "status": "employment_type",
    "employment type": "employment_type",
    "employment_type": "employment_type",
    "date of joining": "joining_date",
    "joining date": "joining_date",
    "joining_date": "joining_date",
    "grade": "grade",
  };

  const rows = dataRows.map((row) => {
    const obj = { password: "ConceptRecall@123" };
    headers.forEach((h, i) => {
      const key = HEADER_MAP[h.toLowerCase()];
      if (key) {
        let val = row[i];
        // Format dates
        if (val instanceof Date) {
          val = val.toISOString().split("T")[0];
        } else {
          val = val !== null && val !== undefined ? String(val).trim() : "";
        }
        obj[key] = val;
      }
    });
    return obj;
  });

  // console.log("📋 Extracted employees array:", JSON.stringify({ employees: rows }, null, 2));
  return rows;
};
// ───────────────────────────────────────────────────────────────────────────


// ─── Bulk Upload Modal ──────────────────────────────────────────────────────
const BulkUploadModal = ({ onClose, departments, shifts, designations, setDesignations, employmentTypes, setEmploymentTypes, grades, onSuccess, showToast }) => {
  const [step, setStep] = useState("upload"); // upload | preview | uploading | done
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  const CSV_TEMPLATE = ""; // kept for reference, unused

  // const downloadTemplate = () => {
  //   const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "employee_bulk_upload_template.csv";
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    const isExcel = f.name.endsWith(".xlsx") || f.name.endsWith(".xls");
    const reader = new FileReader();
    if (isExcel) {
      reader.onload = (e) => {
        const parsed = parseExcel(new Uint8Array(e.target.result));
        setRows(parsed);
        setStep("preview");
      };
      reader.readAsArrayBuffer(f);
    } else {
      reader.onload = (e) => {
        const parsed = parseCSV(e.target.result);
        // console.log("📋 Extracted employees array:", JSON.stringify({ employees: parsed }, null, 2));
        setRows(parsed);
        setStep("preview");
      };
      reader.readAsText(f);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    const name = f?.name || "";
    if (f && (name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".txt"))) {
      handleFile(f);
    } else {
      showToast("Please upload a CSV or Excel file");
    }
  };

  const resolveDepartmentId = (name) => {
    const found = departments.find(
      (d) => d.department_name?.toLowerCase() === name?.toLowerCase()
    );
    return found?.id || null;
  };

  const resolveShiftId = (name) => {
    const found = shifts.find(
      (s) => s.title?.toLowerCase() === name?.toLowerCase()
    );
    return found?.id || null;
  };

  const startUpload = async () => {
    setStep("uploading");
    setProgress(30);

    // Build employees array matching the bulk API body
    const employees = rows.map((row) => ({
      email: row.email || "test@gmail.com",
      password: row.password || "ConceptRecall@123",
      full_name: row.full_name || "",
      employee_code: row.employee_code || "",
      department: row.department || "",
      designation: row.designation || "",
      shift: row.shift || "",
      employment_type: row.employment_type || "",
      joining_date: row.joining_date || "",
    }));

    console.log(" Bulk upload payload:", JSON.stringify({ employees }, null, 2));

    try {
      setProgress(60);
      const res = await axios.post(
        `${API_BASE_URL}/hr/employees/bulk`,
        { employees },
        { headers: getAuthHeaders() }
      );

      setProgress(100);

      // Build results from response if available, else mark all success
      const responseData = res.data?.data?.results || res.data?.results || [];
      let res_arr;
      if (responseData.length > 0) {
        res_arr = responseData.map((r, i) => ({
          name: r.full_name || r.email || employees[i]?.full_name || `Row ${i + 1}`,
          status: r.success || r.status === "success" ? "success" : "error",
          message: r.message || (r.success ? "Added successfully" : "Failed to add"),
        }));
      } else {
        res_arr = employees.map((emp) => ({
          name: emp.full_name || emp.email,
          status: "success",
          message: "Added successfully",
        }));
      }

      setResults(res_arr);
      setStep("done");
      onSuccess();
    } catch (err) {
      setProgress(100);
      // Mark all as failed
      const res_arr = employees.map((emp) => ({
        name: emp.full_name || emp.email,
        status: "error",
        message: err.response?.data?.message || "Bulk upload failed",
      }));
      setResults(res_arr);
      setStep("done");
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 top-[60px] backdrop-blur-sm"
        onClick={step !== "uploading" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-slide">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.07]">
          <p className="text-sm font-bold text-white tracking-wide">
            Upload Employee File
          </p>
          {step !== "uploading" && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">

          {/* ── STEP: upload ── */}
          {step === "upload" && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-4 py-14 px-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                  ${dragOver
                    ? "border-accent/70 bg-accent/[0.06]"
                    : "border-white/10 hover:border-accent/40 hover:bg-white/[0.02] bg-transparent"
                  }`}
              >
                {/* Cloud upload icon */}
                <div className={`transition-transform duration-200 ${dragOver ? "scale-110" : ""}`}>
                  <svg
                    width="52" height="52" viewBox="0 0 52 52" fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`transition-colors ${dragOver ? "text-accent" : "text-slate-500"}`}
                  >
                    <path
                      d="M34 34L26 26L18 34"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M26 26V44"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M43.16 39.16C45.1 38.0083 46.6132 36.2427 47.4622 34.1394C48.3112 32.036 48.4488 29.7117 47.8532 27.5217C47.2576 25.3317 45.9625 23.3985 44.1686 22.0266C42.3748 20.6547 40.1836 19.9194 37.93 19.92H35.38C34.7453 17.5064 33.5765 15.268 31.9594 13.3694C30.3423 11.4709 28.3195 9.96044 26.0448 8.9535C23.7702 7.94657 21.3026 7.46812 18.8212 7.55387C16.3397 7.63962 13.9116 8.28736 11.7118 9.44916C9.51196 10.611 7.59781 12.2566 6.11846 14.2605C4.6391 16.2644 3.63256 18.5748 3.17355 21.0244C2.71454 23.474 2.81542 25.9974 3.46858 28.4025C4.12174 30.8077 5.30952 33.0308 6.94 34.9"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M34 34L26 26L18 34"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Text */}
                <p className="text-sm font-medium text-slate-300 text-center">
                  {dragOver
                    ? "Drop your file here!"
                    : <>Drag &amp; drop your file here, or{" "}
                      <span className="text-accent font-semibold">browse</span>
                    </>
                  }
                </p>
                <p className="text-xs text-slate-600 -mt-2">Supports: CSV (.csv) · Excel (.xlsx, .xls)</p>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {/* Bottom row: columns hint + download template */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {["full_name", "email", "password", "employee_code", "department", "joining_date"].map((col) => (
                    <span key={col} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-500">
                      {col}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-slate-600">+more</span>
                </div>
                {/* <button
                  onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/25 bg-accent/5 text-accent text-xs font-semibold hover:bg-accent/15 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download size={11} />
                  Template
                </button> */}
              </div>
            </>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {/* File pill */}
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10">
                <FileSpreadsheet size={14} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{file?.name}</p>
                  <p className="text-[11px] text-slate-500">{rows.length} employees detected</p>
                </div>
                <button onClick={() => { setFile(null); setRows([]); setStep("upload"); }} className="text-slate-600 hover:text-slate-300 transition-colors">
                  <X size={13} />
                </button>
              </div>

              {/* Preview table */}
              <div className="rounded-lg border border-white/[0.07] overflow-hidden">
                <div className="overflow-x-auto max-h-52 overflow-y-auto">
                  <table className="w-full text-[11px]">
                    <thead className="sticky top-0 bg-[#161b22] border-b border-white/[0.07]">
                      <tr>
                        {["#", "Name", "Email", "Code", "Department"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                          <td className="px-3 py-2 text-slate-600">{i + 1}</td>
                          <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{row.full_name || "—"}</td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.email || "—"}</td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.employee_code || "—"}</td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.department_name || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={startUpload} className="btn-primary flex-1">
                  <Upload size={13} />
                  Upload {rows.length} Employees
                </button>
                <button onClick={onClose} className="btn-outline">Cancel</button>
              </div>
            </div>
          )}

          {/* ── STEP: uploading ── */}
          {step === "uploading" && (
            <div className="py-8 space-y-6 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Loader2 size={26} className="text-accent animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white">Uploading Employees...</p>
                <p className="text-xs text-slate-500">Please do not close this window</p>
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-accent font-bold">{progress}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: done ── */}
          {step === "done" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/[0.08] border border-green-500/20">
                  <CheckCircle size={18} className="text-green-400 shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-green-400">{successCount}</p>
                    <p className="text-[11px] text-slate-500">Successful</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-danger/[0.08] border border-danger/20">
                  <AlertCircle size={18} className="text-danger shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-danger">{errorCount}</p>
                    <p className="text-[11px] text-slate-500">Failed</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/[0.07] overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02]">
                      {r.status === "success"
                        ? <CheckCircle size={12} className="text-green-400 shrink-0" />
                        : <AlertCircle size={12} className="text-danger shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-300 truncate">{r.name}</p>
                        <p className={`text-[11px] truncate ${r.status === "success" ? "text-green-500/60" : "text-danger/60"}`}>
                          {r.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={onClose} className="btn-primary w-full">
                <CheckCircle size={13} />
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
// ───────────────────────────────────────────────────────────────────────────


const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { setEmployees, showToast } = useApp();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showPreCheckModal, setShowPreCheckModal] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [designations, setDesignations] = useState([]);
  const [designationsLoading, setDesignationsLoading] = useState(true);
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [employmentTypesLoading, setEmploymentTypesLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() })
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => showToast("Failed to fetch departments"))
      .finally(() => setDepartmentsLoading(false));

    axios
      .get(`${API_BASE_URL}/shifts`, { headers: getAuthHeaders() })
      .then((res) => setShifts(res.data?.data || res.data || []))
      .catch(() => showToast("Failed to fetch shifts"))
      .finally(() => setShiftsLoading(false));

    axios
      .get(`${API_BASE_URL}/designations`, { headers: getAuthHeaders() })
      .then((res) => setDesignations(res.data.data || res.data || []))
      .catch(() => showToast("Failed to fetch designations"))
      .finally(() => setDesignationsLoading(false));

    axios
      .get(`${API_BASE_URL}/grades`, { headers: getAuthHeaders() })
      .then((res) => setGrades(res.data.data || res.data || []))
      .catch(() => showToast("Failed to fetch grades"))
      .finally(() => setGradesLoading(false));

    axios
      .get(`${API_BASE_URL}/employment-types`, { headers: getAuthHeaders() })
      .then((res) => setEmploymentTypes(res.data.data || res.data || []))
      .catch(() => showToast("Failed to fetch employment types"))
      .finally(() => setEmploymentTypesLoading(false));
  }, []);

  useEffect(() => {
    if (isEdit) {
      axios
        .get(`${API_BASE_URL}/hr/employees/${id}`, {
          headers: getAuthHeaders(),
        })
        .then((res) => {
          const emp = res.data.data.employee;
          setForm({
            full_name: emp.full_name || "",
            email: emp.User?.email || "",
            password: "",
            role: emp.User?.role || "EMPLOYEE",
            department_id: emp.department_id || "",
            shift_id: emp.shift_id || "",
            designation: emp.designation || "",
            designation_id: emp.designation_id || "",
            grade_id: emp.grade_id || "",
            employment_type_id: emp.employment_type_id || "",
            joining_date: emp.joining_date
              ? emp.joining_date.split("T")[0]
              : "",
            confirmation_date: emp.confirmation_date
              ? emp.confirmation_date.split("T")[0]
              : "",
            employee_code: emp.employee_code || "",
          });
        })
        .catch(() => showToast("Failed to fetch employee details"));
    }
  }, [id]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Full name is required";
    if (!form.email.trim() || !form.email.includes("@"))
      e.email = "A valid email is required";
    if (!isEdit && (!form.password.trim() || form.password.length < 6))
      e.password = "Password must be at least 6 characters";
    if (!form.department_id) e.department_id = "Please select a department";
    if (!form.designation_id) e.designation_id = "Please select a designation";
    if (!form.joining_date) e.joining_date = "Joining date is required";
    if (!form.confirmation_date)
      e.confirmation_date = "Confirmation date is required";
    if (!form.shift_id) e.shift_id = "Please select a shift";
    if (!form.employee_code.trim())
      e.employee_code = "Employee code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      let resolvedDesignationId = form.designation_id;
      const isDesignationId = designations.some(
        (d) => String(d.id) === String(form.designation_id),
      );
      if (!isDesignationId && form.designation_id) {
        const res = await axios.post(
          `${API_BASE_URL}/designations`,
          { title: form.designation_id },
          { headers: getAuthHeaders() },
        );
        resolvedDesignationId =
          res.data.data?.id || res.data.id || res.data?.designation?.id;
        setDesignations((prev) => [
          ...prev,
          { id: resolvedDesignationId, title: form.designation_id },
        ]);
      }

      let resolvedEmploymentTypeId = form.employment_type_id;
      const isEmploymentTypeId = employmentTypes.some(
        (t) => String(t.id) === String(form.employment_type_id),
      );
      if (!isEmploymentTypeId && form.employment_type_id) {
        const res = await axios.post(
          `${API_BASE_URL}/employment-types`,
          { type_name: form.employment_type_id },
          { headers: getAuthHeaders() },
        );
        resolvedEmploymentTypeId =
          res.data.data?.id || res.data.id || res.data?.employmentType?.id;
        setEmploymentTypes((prev) => [
          ...prev,
          { id: resolvedEmploymentTypeId, type_name: form.employment_type_id },
        ]);
      }

      const selectedDept = departments.find(
        (d) => d.id === parseInt(form.department_id),
      );
      const selectedDesignation = designations.find(
        (d) => String(d.id) === String(resolvedDesignationId),
      );
      const payload = {
        ...form,
        designation_id: resolvedDesignationId,
        employment_type_id: resolvedEmploymentTypeId,
        department: selectedDept?.department_name || "",
        designation: selectedDesignation?.title || form.designation_id || "",
      };

      if (isEdit) {
        if (!payload.password) delete payload.password;
        await axios.put(`${API_BASE_URL}/hr/employees/${id}`, payload, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.post(`${API_BASE_URL}/auth/register`, payload, {
          headers: getAuthHeaders(),
        });
      }

      const res = await axios.get(`${API_BASE_URL}/hr/employees`, {
        headers: getAuthHeaders(),
      });
      setEmployees(res.data.data.employees);

      showToast(
        `${form.full_name} has been ${isEdit ? "updated" : "added"} successfully!`,
      );
      navigate("/employees");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        `Failed to ${isEdit ? "update" : "add"} employee`;
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSuccess = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/hr/employees`, {
        headers: getAuthHeaders(),
      });
      setEmployees(res.data.data.employees);
    } catch {
    }
  };

  const inputClass = (key) =>
    `form-input-base ${errors[key] ? "!border-danger focus:!ring-danger/10" : ""}`;

  return (
    <div className="animate-fade-slide">
      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <BulkUploadModal
          onClose={() => setShowBulkModal(false)}
          departments={departments}
          shifts={shifts}
          designations={designations}
          setDesignations={setDesignations}
          employmentTypes={employmentTypes}
          setEmploymentTypes={setEmploymentTypes}
          grades={grades}
          onSuccess={handleBulkSuccess}
          showToast={showToast}
        />
      )}

      {/* Pre-Check Warning Modal */}
      {showPreCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 top-[60px] backdrop-blur-sm"
            onClick={() => setShowPreCheckModal(false)}
          />
          <div className="relative w-full max-w-md bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-slide">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={14} className="text-amber-400" />
                </div>
                <p className="text-sm font-bold text-white">Setup Required</p>
              </div>
              <button
                onClick={() => setShowPreCheckModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-5 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Please complete the setup for all the above items, then come back to proceed with the Employment bulk upload.
              </p>

              {/* Missing items list */}
              <div className="space-y-2">
                {showPreCheckModal.map((item) => (
                  <div
                    key={item.path}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.15]"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertCircle size={13} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-semibold text-amber-300">{item.label}</span>
                      <span className="text-[10px] text-amber-500/60">— not set up yet</span>
                    </div>
                    <button
                      onClick={() => { setShowPreCheckModal(false); navigate(item.path); }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent/80 transition-colors whitespace-nowrap shrink-0"
                    >
                      Go setup
                      <ArrowRight size={11} />
                    </button>
                  </div>
                ))}
              </div>

              {/* <p className="text-[11px] text-slate-600 leading-relaxed">
                Please complete the setup for all the above items, then come back to proceed with the bulk upload.
              </p> */}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 pb-5 flex gap-3">
              <button
                onClick={() => setShowPreCheckModal(false)}
                className="btn-outline flex-1 justify-center"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowPreCheckModal(false); setShowBulkModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-400 text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Upload Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-6">
        {/* Left: back + title */}
        <div className="flex items-baseline gap-3 flex-1 min-w-0">
          <button onClick={() => navigate("/employees")} className="btn-ghost shrink-0">
            <ArrowLeft size={14} />
          </button>
          <div className="min-w-0">
            <h2 className="page-title">
              <span className="text-accent font-bold">
                {isEdit ? "Edit" : "Add"}
              </span>{" "}
              <span className="text-white font-bold">
                {isEdit ? "Employee" : "New Employee"}
              </span>
            </h2>
            <p className="page-subtitle mt-0.5 font-semibold text-[rgb(173,173,173)]">
              {isEdit
                ? "Update employee details."
                : "Fill in the details to register a new team member."}
            </p>
          </div>
        </div>

        {!isEdit && (
          <button
            type="button"
            onClick={() => {
              const missing = [];
              if (departments.length === 0) missing.push({ label: "Departments", path: "/departments" });
              if (designations.length === 0) missing.push({ label: "Designations", path: "/designations" });
              if (grades.length === 0) missing.push({ label: "Grades", path: "/grades" });
              if (employmentTypes.length === 0) missing.push({ label: "Employment Types", path: "/employment-types" });
              if (shifts.length === 0) missing.push({ label: "Shifts", path: "/shifts" });
              if (missing.length > 0) {
                setShowPreCheckModal(missing);
              } else {
                setShowBulkModal(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/30 bg-accent/5 text-accent text-xs font-semibold hover:bg-accent/15 hover:border-accent/50 transition-all whitespace-nowrap self-start sm:mt-1"
          >
            <Upload size={13} />
            Employee Bulk Upload
          </button>
        )}
      </div>

      {/* Form Card */}
      <div className="max-w-2xl w-full">
        <div className="card-base p-4 sm:p-6">
          <h3 className="section-title mb-5">Employee Information</h3>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("full_name")}
                  placeholder="Enter full name"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                />
                {errors.full_name && (
                  <p className="text-xs text-danger">{errors.full_name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className={inputClass("email")}
                  placeholder="Enter email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
                {errors.email && (
                  <p className="text-xs text-danger">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              {!isEdit && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                    Password <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={inputClass("password")}
                      placeholder="Enter password"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-danger">{errors.password}</p>
                  )}
                </div>
              )}

              {/* Employee Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Employee Code <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("employee_code")}
                  placeholder="Enter employee code"
                  value={form.employee_code}
                  onChange={(e) => set("employee_code", e.target.value)}
                />
                {errors.employee_code && (
                  <p className="text-xs text-danger">{errors.employee_code}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Department <span className="text-danger">*</span>
                </label>
                <select
                  className={`${inputClass("department_id")} cursor-pointer`}
                  value={form.department_id}
                  onChange={(e) => set("department_id", e.target.value)}
                  disabled={departmentsLoading}
                >
                  <option value="">
                    {departmentsLoading ? "Loading..." : "Select department"}
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="bg-card">
                      {d.department_name}
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="text-xs text-danger">{errors.department_id}</p>
                )}
              </div>

              {/* Designation */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Designation <span className="text-danger">*</span>
                </label>
                <ComboSelect
                  options={designations.map((d) => ({
                    label: d.title,
                    value: d.id,
                  }))}
                  value={form.designation_id}
                  onChange={(val) => set("designation_id", val)}
                  placeholder="Select or type designation"
                  disabled={designationsLoading}
                />
                {errors.designation_id && (
                  <p className="text-xs text-danger">{errors.designation_id}</p>
                )}
              </div>

              {/* Shift */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Shift <span className="text-danger">*</span>
                </label>
                <select
                  className={`${inputClass("shift_id")} cursor-pointer`}
                  value={form.shift_id}
                  onChange={(e) => set("shift_id", e.target.value)}
                  disabled={shiftsLoading}
                >
                  <option value="">
                    {shiftsLoading ? "Loading..." : "Select shift"}
                  </option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id} className="bg-card">
                      {s.title}
                    </option>
                  ))}
                </select>
                {errors.shift_id && (
                  <p className="text-xs text-danger">{errors.shift_id}</p>
                )}
              </div>

              {/* Joining Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Joining Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={inputClass("joining_date")}
                  value={form.joining_date}
                  onChange={(e) => set("joining_date", e.target.value)}
                />
                {errors.joining_date && (
                  <p className="text-xs text-danger">{errors.joining_date}</p>
                )}
              </div>

              {/* Confirmation Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Confirmation Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={inputClass("confirmation_date")}
                  value={form.confirmation_date}
                  onChange={(e) => set("confirmation_date", e.target.value)}
                />
                {errors.confirmation_date && (
                  <p className="text-xs text-danger">
                    {errors.confirmation_date}
                  </p>
                )}
              </div>

              {/* Grade */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Employee Grade
                </label>
                <select
                  className={`${inputClass("grade_id")} cursor-pointer`}
                  value={form.grade_id}
                  onChange={(e) => set("grade_id", e.target.value)}
                  disabled={gradesLoading}
                >
                  <option value="">
                    {gradesLoading ? "Loading..." : "Select grade"}
                  </option>
                  {grades.map((g) => (
                    <option key={g.id} value={g.id} className="bg-card">
                      {g.grade_name} ({g.grade_code})
                    </option>
                  ))}
                </select>
                {errors.grade_id && (
                  <p className="text-xs text-danger">{errors.grade_id}</p>
                )}
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Employment Status
                </label>
                <ComboSelect
                  options={employmentTypes.map((t) => ({
                    label: t.type_name,
                    value: t.id,
                  }))}
                  value={form.employment_type_id}
                  onChange={(val) => set("employment_type_id", val)}
                  placeholder="Select or type status"
                  disabled={employmentTypesLoading}
                />
                {errors.employment_type_id && (
                  <p className="text-xs text-danger">
                    {errors.employment_type_id}
                  </p>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary" disabled={loading}>
                {isEdit ? <Save size={14} /> : <UserPlus size={14} />}
                {loading
                  ? isEdit
                    ? "Updating..."
                    : "Adding..."
                  : isEdit
                    ? "Update Employee"
                    : "Add Employee"}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate("/employees")}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployee;