import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserPlus, Save, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useApp } from "../layouts/DashboardLayout";
import axios from "axios";
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

const AddEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { setEmployees, showToast } = useApp();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      // ── Resolve designation_id ──────────────────────────────────────────
      // If the value is not a numeric ID (user typed a custom name), create it first
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
        // Refresh local designations list so it stays in sync
        setDesignations((prev) => [
          ...prev,
          { id: resolvedDesignationId, title: form.designation_id },
        ]);
      }

      // ── Resolve employment_type_id ──────────────────────────────────────
      // Same logic for employment type
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
        // Refresh local employment types list so it stays in sync
        setEmploymentTypes((prev) => [
          ...prev,
          { id: resolvedEmploymentTypeId, type_name: form.employment_type_id },
        ]);
      }

      // ── Build final payload ─────────────────────────────────────────────
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

  const inputClass = (key) =>
    `form-input-base ${errors[key] ? "!border-danger focus:!ring-danger/10" : ""}`;

  return (
    <div className="animate-fade-slide">
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-6">
        <button onClick={() => navigate("/employees")} className="btn-ghost">
          <ArrowLeft size={14} />
        </button>
        <div>
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

      {/* Form Card */}
      <div className="max-w-2xl w-full">
        <div className="card-base p-6">
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

              {/* Designation — ComboSelect */}
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

              {/* Employment Type — ComboSelect */}
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