import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Briefcase, X, Check } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { TableWrapper, EmptyState } from "../components/Table";
import { useApp } from "../layouts/DashboardLayout";
import ConfirmModal from "../components/ConfirmModal";

const INITIAL_FORM = { title: "" };

const Designations = () => {
  const { showToast } = useApp();
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/designations`, {
        headers: getAuthHeaders(),
      });
      setDesignations(res.data.data || res.data || []);
    } catch {
      showToast("Failed to fetch designations");
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
    if (!form.title.trim()) e.title = "Title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/designations/${editId}`, form, {
          headers: getAuthHeaders(),
        });
        showToast("Designation updated!");
      } else {
        await axios.post(`${API_BASE_URL}/designations`, form, {
          headers: getAuthHeaders(),
        });
        showToast("Designation added!");
      }
      await fetchDesignations();
      setForm(INITIAL_FORM);
      setEditId(null);
      setShowForm(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to save designation");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (d) => {
    setForm({ title: d.title });
    setEditId(d.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (id, title) => {
    setDeleteTarget({ id, name: title });
  };

  const confirmDelete = async () => {
    const { id } = deleteTarget;
    setDeleteTarget(null);
    try {
      await axios.delete(`${API_BASE_URL}/designations/${id}`, {
        headers: getAuthHeaders(),
      });
      setDesignations((prev) => prev.filter((d) => d.id !== id));
      showToast("Designation deleted.");
    } catch {
      showToast("Failed to delete designation");
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
            <span className="text-white font-bold">Designations</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {designations.length} designations configured
          </p>
        </div>
        {!showForm && (
          <button
            className="btn-primary self-start sm:self-auto"
            onClick={() => setShowForm(true)}
          >
            <Plus size={14} />
            Add Designation
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-base p-4 sm:p-5 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">
              {editId ? "Edit Designation" : "New Designation"}
            </h3>
            <button
              onClick={handleCancel}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                  Designation Title <span className="text-danger">*</span>
                </label>
                <input
                  className={inputClass("title")}
                  placeholder="e.g. Sr. Software Engineer"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
                {errors.title && (
                  <p className="text-xs text-danger">{errors.title}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="submit" className="btn-primary" disabled={saving}>
                <Check size={14} />
                {saving ? "Saving..." : editId ? "Update" : "Save Designation"}
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
      <TableWrapper title="All Designations">
        {loading ? (
          <EmptyState message="Loading designations..." />
        ) : designations.length === 0 ? (
          <EmptyState message="No designations yet. Add one to get started." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  #
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Designation Title
                </th>
                <th className="table-th text-right font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {designations.map((d, i) => (
                <tr
                  key={d.id}
                  className="table-row-hover last:[&>td]:border-0"
                >
                  <td className="table-td text-slate-500 text-xs w-10">
                    {i + 1}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Briefcase size={13} className="text-accent" />
                      <span className="font-medium text-slate-200 text-[13.5px]">
                        {d.title}
                      </span>
                    </div>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                        title="Edit"
                        onClick={() => handleEdit(d)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                        title="Delete"
                        onClick={() => handleDelete(d.id, d.title)}
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
        entityLabel="Designation"
      />
    </div>
  );
};

export default Designations;
