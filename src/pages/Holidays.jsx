import { useState, useEffect } from "react";
import { Plus, Trash2, CalendarDays, Pencil } from "lucide-react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { TableWrapper, EmptyState } from "../components/Table";
import { useApp } from "../layouts/DashboardLayout";
import ConfirmModal from "../components/ConfirmModal";

const EMPTY_FORM = { title: "", date: "", is_paid: true };

const Holidays = () => {
  const { showToast } = useApp();
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/holidays`, {
        headers: getAuthHeaders(),
      });
      setHolidays(res.data?.data || []);
    } catch {
      showToast("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Holiday name required";
    if (!form.date) e.date = "Date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/holidays/${editId}`, form, {
          headers: getAuthHeaders(),
        });
        showToast("Holiday updated successfully");
      } else {
        await axios.post(`${API_BASE_URL}/holidays`, form, {
          headers: getAuthHeaders(),
        });
        showToast("Holiday added successfully");
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setEditId(null);
      setErrors({});
      fetchHolidays();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save holiday");
    }
  };

  const handleEdit = (h) => {
    setForm({ title: h.title, date: h.date, is_paid: h.is_paid });
    setEditId(h.id);
    setShowForm(true);
    setErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setErrors({});
  };

  const handleDelete = (id, title) => {
    setDeleteTarget({ id, name: title });
  };

  const confirmDelete = async () => {
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    try {
      await axios.delete(`${API_BASE_URL}/holidays/${id}`, {
        headers: getAuthHeaders(),
      });
      showToast(`"${name}" deleted`);
      fetchHolidays();
    } catch {
      showToast("Failed to delete holiday");
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Holidays</span>{" "}
            <span className="text-white font-bold">Management</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {holidays.length} holidays configured
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
          Add Holiday
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card-base p-5 space-y-4">
          <h3 className="section-title">
            {editId ? "Edit Holiday" : "New Holiday"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Holiday Name
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Independence Day"
                className="form-input-base"
              />
              {errors.title && (
                <p className="text-xs text-danger">{errors.title}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="form-input-base"
              />
              {errors.date && (
                <p className="text-xs text-danger">{errors.date}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                Type
              </label>
              <select
                value={form.is_paid}
                onChange={(e) =>
                  setForm({ ...form, is_paid: e.target.value === "true" })
                }
                className="form-input-base cursor-pointer"
              >
                <option value="true" className="bg-card">Paid</option>
                <option value="false" className="bg-card">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button className=" btn-outline" onClick={handleCancel}>Cancel</button>
            <button className="btn-primary" onClick={handleAdd}>
              <Plus size={13} /> {editId ? "Update Holiday" : "Save Holiday"}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <TableWrapper title="All Holidays">
        {loading ? (
          <div className="text-center text-slate-500 py-8 text-sm">Loading...</div>
        ) : holidays.length === 0 ? (
          <EmptyState message="No holidays added yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="bg-[#000000]">
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">#</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Holiday Name</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Date</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap hidden sm:table-cell">Day</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Type</th>
                  <th className="table-th font-semibold text-[rgb(173,173,173)] text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((h, i) => (
                    <tr key={h.id} className="table-row-hover last:[&>td]:border-0">
                      <td className="table-td text-slate-500 text-xs">{i + 1}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center shrink-0">
                            <CalendarDays size={13} className="text-amber" />
                          </div>
                          <span className="font-medium text-slate-200 text-[13px] whitespace-nowrap">{h.title}</span>
                        </div>
                      </td>
                      <td className="table-td text-slate-300 text-xs whitespace-nowrap">{formatDate(h.date)}</td>
                      <td className="table-td hidden sm:table-cell">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20 whitespace-nowrap">
                          {new Date(h.date).toLocaleDateString("en-PK", { weekday: "long" })}
                        </span>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${h.is_paid ? "bg-emerald/10 text-emerald border-emerald/20" : "bg-slate-700/30 text-slate-400 border-slate-600/30"}`}>
                          {h.is_paid ? "Paid" : "Unpaid"}
                        </span>
                      </td>
                      <td className="table-td text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(h)} className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(h.id, h.title)} className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30">
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
        entityLabel="Holiday"
      />
    </div>
  );
};

export default Holidays;
