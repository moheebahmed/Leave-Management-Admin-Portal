import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Save, ArrowLeft } from "lucide-react";
import { useApp } from "../layouts/DashboardLayout";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";

const INITIAL_FORM = {
  department_name: "",
  lead_id: "",
  description: "",
};

const INITIAL_STATE = {
  employees: [],
  loadingEmployees: false,
};

const AddDepartment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showToast } = useApp();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(INITIAL_STATE);

  // Fetch employees for lead dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setState((prev) => ({ ...prev, loadingEmployees: true }));
        const res = await axios.get(`${API_BASE_URL}/hr/employees`, {
          headers: getAuthHeaders(),
        });
        setState((prev) => ({
          ...prev,
          employees: res.data.data.employees || [],
          loadingEmployees: false,
        }));
      } catch (error) {
        console.log("Error fetching employees:", error);
        setState((prev) => ({ ...prev, loadingEmployees: false }));
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isEdit) {
      axios
        .get(`${API_BASE_URL}/departments/${id}`, { headers: getAuthHeaders() })
        .then((res) => {
          const dept = res.data.data;
          setForm({
            department_name: dept.department_name || "",
            lead_id: dept.lead_id || "",
            description: dept.description || "",
          });
        })
        .catch(() => showToast("Failed to fetch department details"));
    }
  }, [id]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.department_name.trim())
      e.department_name = "Department name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${API_BASE_URL}/departments/${id}`, form, {
          headers: getAuthHeaders(),
        });
      } else {
        await axios.post(`${API_BASE_URL}/departments`, form, {
          headers: getAuthHeaders(),
        });
      }

      showToast(
        `${form.department_name} has been ${isEdit ? "updated" : "added"} successfully!`,
      );
      navigate("/departments");
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        `Failed to ${isEdit ? "update" : "add"} department`;
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
        <button onClick={() => navigate("/departments")} className="btn-ghost">
          <ArrowLeft size={14} />
        </button>
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">
              {isEdit ? "Edit" : "Add"}
            </span>{" "}
            <span className="text-white font-bold">
              {isEdit ? "Department" : "New Department"}
            </span>
          </h2>
          <p className="page-subtitle mt-0.5 font-semibold text-[rgb(173,173,173)]">
            {isEdit ? "Update department details." : "Create a new department."}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="max-w-2xl w-full">
        <div className="card-base p-6">
          <h3 className="section-title mb-5">Department Information</h3>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Department Name <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("department_name")}
                  placeholder="Enter department name"
                  value={form.department_name}
                  onChange={(e) => set("department_name", e.target.value)}
                />
                {errors.department_name && (
                  <p className="text-xs text-danger">
                    {errors.department_name}
                  </p>
                )}
              </div>

              {/* Lead ID */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Department Lead
                </label>
                <select
                  className={`${inputClass("lead_id")} cursor-pointer`}
                  value={form.lead_id}
                  onChange={(e) => set("lead_id", e.target.value)}
                  disabled={state.loadingEmployees}
                >
                  <option value="">Select lead (optional)</option>
                  {state.employees
                    .filter(
                      (emp) =>
                        emp.designation &&
                        String(emp.designation).toLowerCase().includes("lead"),
                    )
                    .map((emp) => (
                      <option key={emp.id} value={emp.id} className="bg-card">
                        {emp.full_name} ({emp.employee_code})
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Description
                </label>
                <textarea
                  className={inputClass("description")}
                  placeholder="Enter department description (optional)"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows="3"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary" disabled={loading}>
                {isEdit ? <Save size={14} /> : <Plus size={14} />}
                {loading
                  ? isEdit
                    ? "Updating..."
                    : "Adding..."
                  : isEdit
                    ? "Update Department"
                    : "Add Department"}
              </button>
              <button
                type="button"
                className=" btn-outline"
                onClick={() => navigate("/departments")}
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

export default AddDepartment;
