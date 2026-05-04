import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../api/config";
import { useApp } from "../layouts/DashboardLayout";
import { TableWrapper, EmptyState } from "../components/Table";

const Departments = () => {
  const navigate = useNavigate();
  const { showToast } = useApp();
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/departments`, {
        headers: getAuthHeaders(),
      });
      setDepartments(res.data.data || []);
    } catch (error) {
      console.log("Error fetching departments:", error);
      showToast("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const filtered = departments.filter((d) =>
    d.department_name?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/departments/${id}`, {
        headers: getAuthHeaders(),
      });
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      showToast(`${name} has been removed.`);
    } catch (error) {
      const msg =
        error.response?.data?.message || "Failed to delete department";
      showToast(msg);
    }
  };

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Department</span>{" "}
            <span className="text-white font-bold">Management</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            {departments.length} departments
          </p>
        </div>
        <button
          className="btn-primary self-start sm:self-auto"
          onClick={() => navigate("/add-department")}
        >
          <Plus size={14} />
          Add Department
        </button>
      </div>

      {/* Table */}
      <TableWrapper
        title="All Departments"
        action={
          <div className="flex items-center gap-2 bg-surface/70 border border-border rounded-lg px-3 py-1.5">
            <Search size={12} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments…"
              className="bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none w-40"
            />
          </div>
        }
      >
        {loading ? (
          <div className="text-center py-8 text-slate-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No departments found." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Department Name
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Lead Name
                </th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">
                  Description
                </th>
                <th className="table-th text-center font-semibold text-[rgb(173,173,173)] whitespace-nowrap mr-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((dept) => (
                <tr
                  key={dept.id}
                  className="table-row-hover last:[&>td]:border-0"
                >
                  <td className="table-td">
                    <span className="font-medium text-slate-200">
                      {dept.department_name}
                    </span>
                  </td>
                  <td className="table-td text-slate-400 text-[12.5px]">
                    {dept.lead_name || "—"}
                  </td>
                  <td className="table-td text-slate-400 text-[12.5px]">
                    {dept.description || "—"}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                        title="Edit"
                        onClick={() => navigate(`/edit-department/${dept.id}`)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                        title="Delete"
                        onClick={() =>
                          handleDelete(dept.id, dept.department_name)
                        }
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

export default Departments;
