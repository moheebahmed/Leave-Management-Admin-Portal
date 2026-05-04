import { useState, useEffect } from "react";
import { Tag, Pencil, Trash2, Plus, X, Check } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { useApp } from "../layouts/DashboardLayout";
import { TableWrapper, EmptyState } from "../components/Table";

const INITIAL_FORM = {
  name: "",
  code: "",
  min_notice_days: "",
  allow_past_dates: "",
  max_allowed_leaves: "",
};

const LeaveTypes = () => {
  const { showToast } = useApp();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/employees/leave/types`, {
        headers: getAuthHeaders(),
      });
      setLeaveTypes(res.data.data.leave_types || []);
    } catch {
      showToast("Failed to fetch leave types");
    } finally {
      setLoading(false);
    }
  };

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.code.trim()) e.code = "Code is required";
    if (form.min_notice_days === "" || isNaN(form.min_notice_days))
      e.min_notice_days = "Required";
    if (form.allow_past_dates === "" || isNaN(form.allow_past_dates))
      e.allow_past_dates = "Required";
    if (form.max_allowed_leaves === "" || isNaN(form.max_allowed_leaves))
      e.max_allowed_leaves = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code,
        min_notice_days: Number(form.min_notice_days),
        allow_past_dates: Number(form.allow_past_dates),
        max_allowed_leaves: Number(form.max_allowed_leaves),
      };
      if (editId) {
        await axios.put(`${API_BASE_URL}/hr/leave/types/${editId}`, payload, {
          headers: getAuthHeaders(),
        });
        showToast("Leave type updated!");
      } else {
        await axios.post(`${API_BASE_URL}/hr/leave/types`, payload, {
          headers: getAuthHeaders(),
        });
        showToast("Leave type added!");
      }
      await fetchLeaveTypes();
      setForm(INITIAL_FORM);
      setEditId(null);
      setShowForm(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lt) => {
    setForm({
      name: lt.name,
      code: lt.code,
      min_notice_days: lt.min_notice_days,
      allow_past_dates: lt.allow_past_dates,
      max_allowed_leaves: lt.max_allowed_leaves,
    });
    setEditId(lt.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/hr/leave/types/${id}`, {
        headers: getAuthHeaders(),
      });
      setLeaveTypes((prev) => prev.filter((lt) => lt.id !== id));
      showToast("Leave type deleted.");
    } catch {
      showToast("Failed to delete leave type");
    }
  };

  const handleCancel = () => {
    setForm(INITIAL_FORM);
    setEditId(null);
    setErrors({});
    setShowForm(false);
  };

  const inputClass = (key) =>
    `form-input-base ${errors[key] ? "!border-danger focus:!ring-danger/10" : ""}`;

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Leave</span>{" "}
            <span className="text-white font-bold">Types</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {leaveTypes.length} types configured
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-primary self-start sm:self-auto"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Add Leave Type
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-base p-5 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              {editId ? "Edit Leave Type" : "New Leave Type"}
            </h3>
            <button
              onClick={handleCancel}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("name")}
                  placeholder="e.g. Annual Leave"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
                {errors.name && (
                  <p className="text-xs text-danger">{errors.name}</p>
                )}
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Code <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("code")}
                  placeholder="e.g. AL"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value.toUpperCase())}
                />
                {errors.code && (
                  <p className="text-xs text-danger">{errors.code}</p>
                )}
              </div>

              {/* Min Notice Days */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Min Notice Days <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass("min_notice_days")}
                  placeholder="e.g. 2"
                  value={form.min_notice_days}
                  onChange={(e) => set("min_notice_days", e.target.value)}
                />
                {errors.min_notice_days && (
                  <p className="text-xs text-danger">
                    {errors.min_notice_days}
                  </p>
                )}
              </div>

              {/* Max Leaves Limit */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Maximum Leaves Limit <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass("max_allowed_leaves")}
                  placeholder="e.g. 20"
                  value={form.max_allowed_leaves}
                  onChange={(e) => set("max_allowed_leaves", e.target.value)}
                />
                {errors.max_allowed_leaves && (
                  <p className="text-xs text-danger">
                    {errors.max_allowed_leaves}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Check size={14} />
                {saving ? "Saving..." : editId ? "Update" : "Save Leave Type"}
              </button>

              <button
                type="button"
                className="btn-outline"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <TableWrapper title="All Leave Types">
        {loading ? (
          <EmptyState message="Loading leave types..." />
        ) : leaveTypes.length === 0 ? (
          <EmptyState message="No leave types yet. Add one to get started." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Name
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Code
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Min Notice Days
                </th>

                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Max Leaves Limit
                </th>
                <th className="table-th text-right font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((lt) => (
                <tr
                  key={lt.id}
                  className="table-row-hover last:[&>td]:border-0"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Tag size={13} className="text-accent" />
                      <span className="font-medium text-slate-200 text-[13.5px]">
                        {lt.name}
                      </span>
                    </div>
                  </td>
                  <td className="table-td whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-400 bg-surface/70 px-2 py-0.5 rounded border border-border">
                      {lt.code}
                    </span>
                  </td>
                  <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                    {lt.min_notice_days} days
                  </td>

                  <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                    {lt.max_allowed_leaves}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                        title="Edit"
                        onClick={() => handleEdit(lt)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                        title="Delete"
                        onClick={() => handleDelete(lt.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableWrapper>
    </div>
  );
};

export default LeaveTypes;
