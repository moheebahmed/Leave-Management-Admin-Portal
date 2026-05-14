import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Pencil } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { TableWrapper, EmptyState } from "../components/Table";
import { useApp } from "../layouts/DashboardLayout";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY_FORM = { title: "", start_time: "", end_time: "", grace_time: "" };

const Shifts = () => {
  const { showToast } = useApp();
  const [shifts, setShifts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/shifts`, {
        headers: getAuthHeaders(),
      });
      setShifts(res.data?.data || res.data || []);
    } catch (err) {
      showToast("Failed to fetch shifts");
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Shift title required";
    if (!form.start_time) e.start_time = "Start time required";
    if (!form.end_time) e.end_time = "End time required";
    if (!form.grace_time) e.grace_time = "Grace time required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/shifts/${editId}`, form, {
          headers: getAuthHeaders(),
        });
        showToast("Shift updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/shifts`, form, {
          headers: getAuthHeaders(),
        });
        showToast("Shift created successfully");
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditId(null);
      setErrors({});
      fetchShifts();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save shift");
    }
  };

  const handleEdit = (shift) => {
    setForm({
      title: shift.title,
      start_time: shift.start_time?.slice(0, 5) || "",
      end_time: shift.end_time?.slice(0, 5) || "",
      grace_time: shift.grace_time?.slice(0, 5) || "",
    });
    setEditId(shift.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (id, title) => {
    setDeleteTarget({ id, name: title });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    try {
      await axios.delete(`${API_BASE_URL}/shifts/${id}`, {
        headers: getAuthHeaders(),
      });
      showToast(`"${name}" deleted`);
      fetchShifts();
    } catch (err) {
      showToast("Failed to delete shift");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setErrors({});
  };

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Shift</span>{" "}
            <span className="text-white font-bold">Management</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {shifts.length} shifts configured
          </p>
        </div>
        <button
          className="btn-primary self-start sm:self-auto"
          onClick={() => {
            setShowForm((p) => !p);
            setEditId(null);
            setForm(EMPTY_FORM);
          }}
        >
          <Plus size={14} />
          Add Shift
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-base p-5 space-y-4">
          <h3 className="section-title">
            {editId ? "Edit Shift" : "New Shift"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Shift Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Morning Shift"
                className="form-input-base"
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Start Time
              </label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="form-input-base"
              />
              {errors.start_time && (
                <p className="text-xs text-danger">{errors.start_time}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                End Time
              </label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="form-input-base"
              />
              {errors.end_time && (
                <p className="text-xs text-danger">{errors.end_time}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Grace Time
              </label>
              <input
                type="time"
                value={form.grace_time}
                onChange={(e) => setForm({ ...form, grace_time: e.target.value })}
                className="form-input-base"
              />
              {errors.grace_time && (
                <p className="text-xs text-danger">{errors.grace_time}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button className=" btn-outline" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Plus size={13} /> {editId ? "Update Shift" : "Save Shift"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <TableWrapper title="All Shifts">
        {loading ? (
          <div className="text-center text-slate-500 py-8 text-sm">Loading...</div>
        ) : shifts.length === 0 ? (
          <EmptyState message="No shifts configured yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-[#000000]">
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Shift Title</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Start Time</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">End Time</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Grace Time</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((s) => (
                  <tr key={s.id} className="table-row-hover last:[&>td]:border-0">
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                          <Clock size={13} className="text-accent" />
                        </div>
                        <span className="font-medium text-slate-200 text-[13px] whitespace-nowrap">{s.title}</span>
                      </div>
                    </td>
                    <td className="table-td font-mono text-slate-300 text-xs whitespace-nowrap">{s.start_time?.slice(0, 5)}</td>
                    <td className="table-td font-mono text-slate-300 text-xs whitespace-nowrap">{s.end_time?.slice(0, 5)}</td>
                    <td className="table-td whitespace-nowrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20">
                        {s.grace_time?.slice(0, 5)}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(s)} className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(s.id, s.title)} className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableWrapper>

      <ConfirmModal
        target={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        entityLabel="Shift"
      />
    </div>
  );
};

export default Shifts;
