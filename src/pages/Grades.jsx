import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, BarChart2, X, Check } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { TableWrapper, EmptyState } from "../components/Table";
import { useApp } from "../layouts/DashboardLayout";
import ConfirmModal from "../components/ConfirmModal";

const INITIAL_FORM = { grade_name: "", grade_code: "", level: "" };

const Grades = () => {
  const { showToast } = useApp();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/grades`, {
        headers: getAuthHeaders(),
      });
      setGrades(res.data.data || res.data || []);
    } catch {
      showToast("Failed to fetch grades");
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
    if (!form.grade_name.trim()) e.grade_name = "Grade name is required";
    if (!form.grade_code.trim()) e.grade_code = "Grade code is required";
    if (form.level === "" || isNaN(form.level))
      e.level = "Level is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        grade_name: form.grade_name,
        grade_code: form.grade_code,
        level: Number(form.level),
      };
      if (editId) {
        await axios.put(`${API_BASE_URL}/grades/${editId}`, payload, {
          headers: getAuthHeaders(),
        });
        showToast("Grade updated!");
      } else {
        await axios.post(`${API_BASE_URL}/grades`, payload, {
          headers: getAuthHeaders(),
        });
        showToast("Grade added!");
      }
      await fetchGrades();
      setForm(INITIAL_FORM);
      setEditId(null);
      setShowForm(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (g) => {
    setForm({
      grade_name: g.grade_name,
      grade_code: g.grade_code,
      level: g.level,
    });
    setEditId(g.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    const { id } = deleteTarget;
    setDeleteTarget(null);
    try {
      await axios.delete(`${API_BASE_URL}/grades/${id}`, {
        headers: getAuthHeaders(),
      });
      setGrades((prev) => prev.filter((g) => g.id !== id));
      showToast("Grade deleted.");
    } catch {
      showToast("Failed to delete grade");
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
            <span className="text-accent font-bold">Employee</span>{" "}
            <span className="text-white font-bold">Grades</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {grades.length} grades configured
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-primary self-start sm:self-auto"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Add Grade
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-base p-4 sm:p-5 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              {editId ? "Edit Grade" : "New Grade"}
            </h3>
            <button
              onClick={handleCancel}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Grade Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Grade Name <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("grade_name")}
                  placeholder="e.g. Intern"
                  value={form.grade_name}
                  onChange={(e) => set("grade_name", e.target.value)}
                />
                {errors.grade_name && (
                  <p className="text-xs text-danger">{errors.grade_name}</p>
                )}
              </div>

              {/* Grade Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Grade Code <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("grade_code")}
                  placeholder="e.g. G1"
                  value={form.grade_code}
                  onChange={(e) =>
                    set("grade_code", e.target.value.toUpperCase())
                  }
                />
                {errors.grade_code && (
                  <p className="text-xs text-danger">{errors.grade_code}</p>
                )}
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Level <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  className={inputClass("level")}
                  placeholder="e.g. 1"
                  value={form.level}
                  onChange={(e) => set("level", e.target.value)}
                />
                {errors.level && (
                  <p className="text-xs text-danger">{errors.level}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Check size={14} />
                {saving ? "Saving..." : editId ? "Update" : "Save Grade"}
              </button>
              <button
                type="button"
                className=" btn-outline"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <TableWrapper title="All Grades">
        {loading ? (
          <EmptyState message="Loading grades..." />
        ) : grades.length === 0 ? (
          <EmptyState message="No grades yet. Add one to get started." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Grade Name
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Grade Code
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Level
                </th>
                <th className="table-th text-right font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr
                  key={g.id}
                  className="table-row-hover last:[&>td]:border-0"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <BarChart2 size={13} className="text-accent" />
                      <span className="font-medium text-slate-200 text-[13.5px]">
                        {g.grade_name}
                      </span>
                    </div>
                  </td>
                  <td className="table-td whitespace-nowrap">
                    <span className="font-mono text-xs text-slate-400 bg-surface/70 px-2 py-0.5 rounded border border-border">
                      {g.grade_code}
                    </span>
                  </td>
                  <td className="table-td whitespace-nowrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      Level {g.level}
                    </span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                        title="Edit"
                        onClick={() => handleEdit(g)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                        title="Delete"
                        onClick={() => handleDelete(g.id, g.grade_name)}
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

      <ConfirmModal
        target={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        entityLabel="Grade"
      />
    </div>
  );
};

export default Grades;
