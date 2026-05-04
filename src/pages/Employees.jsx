import { useNavigate } from 'react-router-dom'
import { UserPlus, Pencil, Trash2, Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE_URL, getAuthHeaders } from '../api/config'
import { useApp } from '../layouts/DashboardLayout'
import { TableWrapper, EmptyState } from '../components/Table'
import { DeptBadge } from '../components/Badge'
import Avatar from '../components/Avatar'

const Employees = () => {
  const navigate = useNavigate()
  const { employees, setEmployees, showToast } = useApp()
  const [search, setSearch] = useState('')
  const [departments, setDepartments] = useState([])

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/departments`, {
        headers: getAuthHeaders()
      })
      setDepartments(res.data.data || [])
    } catch (error) {
      console.log('Error fetching departments:', error)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/hr/employees`, {
        headers: getAuthHeaders()
      })
      setEmployees(res.data.data.employees)
    } catch (error) {
      console.log('Error fetching employees:', error)
      showToast('Failed to fetch employees')
    }
  }

  const getDepartmentName = (deptId) => {
    if (!deptId) return '—'
    const dept = departments.find(d => d.id === deptId)
    return dept?.department_name || '—'
  }

  const filtered = employees.filter((e) =>
    e.department?.toLowerCase().includes(search.toLowerCase()) ||
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.employee_code?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return
    try {
      await axios.delete(`${API_BASE_URL}/hr/employees/${id}`, {
        headers: getAuthHeaders()
      })
      setEmployees((prev) => prev.filter((e) => e.id !== id))
      showToast(`${name} has been removed.`)
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete employee'
      showToast(msg)
    }
  }

  return (
    <div className="animate-fade-slide space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Employee</span>{' '}
            <span className="text-white font-bold">Directory</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">{employees.length} employees registered</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={() => navigate('/add-employee')}>
          <UserPlus size={14} />
          Add Employees
        </button>
      </div>

      {/* Table */}
      <TableWrapper
        title="All Employees"
        action={
          <div className="flex items-center gap-2 bg-surface/70 border border-border rounded-lg px-3 py-1.5">
            <Search size={12} className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees…"
              className="bg-transparent text-xs text-slate-200 placeholder-slate-600 outline-none w-40"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState message="No employees match your search." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#000000]">
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Employee Code</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Employee</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Department</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Designation</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Shift</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Joining Date</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Confirmation</th>
                <th className="table-th font-semibold text-[rgb(173,173,173)] whitespace-nowrap">Role</th>
                <th className="table-th text-center font-semibold text-[rgb(173,173,173)] whitespace-nowrap mr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => (
                <tr key={emp.id} className="table-row-hover last:[&>td]:border-0">

                  {/* Employee Code */}
                  <td className="table-td">
                    <span className="font-mono text-xs text-slate-400 bg-surface/70 px-2 py-0.5 rounded border border-border whitespace-nowrap">
                      {emp.employee_code}
                    </span>
                  </td>

                  {/* Name + Email */}
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.full_name} index={emp.id} />
                      <div>
                        <div className="font-medium text-slate-200 text-[13.5px] whitespace-nowrap">{emp.full_name}</div>
                        <div className="text-xs text-slate-500 whitespace-nowrap">{emp.User?.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="table-td whitespace-nowrap">
                    <DeptBadge department={emp.department || getDepartmentName(emp.department_id)} />
                  </td>

                  {/* Designation */}
                  <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">{emp.designation}</td>

                  {/* Shift */}
                  <td className="table-td whitespace-nowrap">
                    {emp.shift?.title
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{emp.shift.title}</span>
                      : <span className="text-slate-600 text-xs">—</span>
                    }
                  </td>

                  {/* Joining Date */}
                  <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                    {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : '—'}
                  </td>

                  {/* Confirmation Date */}
                  <td className="table-td text-slate-400 text-[12.5px] whitespace-nowrap">
                    {emp.confirmation_date ? new Date(emp.confirmation_date).toLocaleDateString() : '—'}
                  </td>

                  {/* Role */}
                  <td className="table-td whitespace-nowrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      {emp.User?.role}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="table-td">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="btn-ghost hover:!bg-accent/10 hover:!text-accent hover:!border-accent/30"
                        title="Edit"
                        onClick={() => navigate(`/edit-employee/${emp.id}`)}
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30"
                        title="Delete"
                        onClick={() => handleDelete(emp.id, emp.full_name)}
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
  )
}

export default Employees