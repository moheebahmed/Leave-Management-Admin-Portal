import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { useApp } from '../layouts/DashboardLayout'
import axios from 'axios'
import { API_BASE_URL, getAuthHeaders } from '../api/config'
import { 
  sendLeaveRequestNotification, 
  getLeaveBalance, 
  getLeaveTypes, 
  getCurrentUser 
} from '../api/leaveService'

const CreateLeaveRequest = () => {
  const navigate = useNavigate()
  const { showToast } = useApp()
  const [loading, setLoading] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState([])
  const [leaveBalance, setLeaveBalance] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
  })

  useEffect(() => {
    fetchCurrentUser()
    fetchLeaveTypes()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
      if (user?.employee_id) {
        const balance = await getLeaveBalance(user.employee_id)
        setLeaveBalance(balance)
      }
    } catch (error) {
      showToast('Failed to fetch user info')
    }
  }

  const fetchLeaveTypes = async () => {
    try {
      const types = await getLeaveTypes()
      setLeaveTypes(types)
    } catch (error) {
      showToast('Failed to fetch leave types')
    }
  }

  const calculateDays = (start, end) => {
    if (!start || !end) return 0
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate - startDate)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.leave_type_id) newErrors.leave_type_id = 'Please select a leave type'
    if (!formData.start_date) newErrors.start_date = 'Start date is required'
    if (!formData.end_date) newErrors.end_date = 'End date is required'
    if (formData.start_date && formData.end_date && new Date(formData.start_date) > new Date(formData.end_date)) {
      newErrors.end_date = 'End date must be after start date'
    }
    if (!formData.reason) newErrors.reason = 'Reason is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const totalDays = calculateDays(formData.start_date, formData.end_date)

      // Create leave request
      const res = await axios.post(
        `${API_BASE_URL}/employees/leave/requests`,
        {
          leave_type_id: Number(formData.leave_type_id),
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
          total_days: totalDays,
        },
        { headers: getAuthHeaders() }
      )

      const request = res.data.data.request

      // Send email notification to Lead and HR
      try {
        await sendLeaveRequestNotification(request, currentUser)
      } catch (emailError) {
        console.log('Email notification failed:', emailError)
        // Don't fail the request if email fails
      }

      showToast('Leave request submitted successfully!')
      navigate('/leave-requests')
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create leave request'
      showToast(msg)
    } finally {
      setLoading(false)
    }
  }

  const sendLeaveRequestNotification = async (request, employee) => {
    try {
      await sendLeaveRequestNotification(request, employee)
    } catch (error) {
      console.log('Error sending notification:', error)
      throw error
    }
  }

  const totalDays = calculateDays(formData.start_date, formData.end_date)
  const selectedLeaveType = leaveTypes.find((lt) => lt.id === Number(formData.leave_type_id))
  const selectedBalance = leaveBalance.find((lb) => lb.leave_type_id === Number(formData.leave_type_id))

  return (
    <div className="animate-fade-slide">
      {/* Header */}
      <div className="flex items-baseline gap-3 mb-6">
        <button onClick={() => navigate('/leave-requests')} className="btn-ghost">
          <ArrowLeft size={14} />
        </button>
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">Create</span>{' '}
            <span className="text-white font-bold">Leave Request</span>
          </h2>
          <p className="page-subtitle mt-0.5 font-semibold text-[rgb(173,173,173)]">
            Submit a new leave request for approval.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl w-full">
        {/* Form */}
        <div className="lg:col-span-2 card-base p-6">
          <h3 className="section-title mb-5">Leave Request Details</h3>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Leave Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                Leave Type <span className="text-danger">*</span>
              </label>
              <select
                name="leave_type_id"
                value={formData.leave_type_id}
                onChange={handleChange}
                className={`form-input-base cursor-pointer ${errors.leave_type_id ? '!border-danger' : ''}`}
              >
                <option value="">Select a leave type…</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id} className="bg-card">
                    {lt.name}
                  </option>
                ))}
              </select>
              {errors.leave_type_id && <p className="text-xs text-danger">{errors.leave_type_id}</p>}
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                Start Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`form-input-base ${errors.start_date ? '!border-danger' : ''}`}
              />
              {errors.start_date && <p className="text-xs text-danger">{errors.start_date}</p>}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                End Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`form-input-base ${errors.end_date ? '!border-danger' : ''}`}
              />
              {errors.end_date && <p className="text-xs text-danger">{errors.end_date}</p>}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 tracking-wide">
                Reason <span className="text-danger">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Enter reason for leave…"
                rows={3}
                className={`form-input-base resize-none ${errors.reason ? '!border-danger' : ''}`}
              />
              {errors.reason && <p className="text-xs text-danger">{errors.reason}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={loading}>
                <CheckCircle size={14} />
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" className="btn-outline" onClick={() => navigate('/leave-requests')}>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          {/* Summary Card */}
          <div className="card-base p-5">
            <h4 className="section-title text-[13px] mb-4">Summary</h4>

            <div className="space-y-3">
              {currentUser && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Employee
                  </div>
                  <div className="text-sm font-semibold text-slate-200">{currentUser.full_name}</div>
                </div>
              )}

              {selectedLeaveType && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Leave Type
                  </div>
                  <div className="text-sm font-semibold text-cyan">{selectedLeaveType.name}</div>
                </div>
              )}

              {formData.start_date && formData.end_date && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Duration
                  </div>
                  <div className="text-sm text-slate-300">
                    {new Date(formData.start_date).toLocaleDateString()} to{' '}
                    {new Date(formData.end_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Days Card */}
          <div className="card-base p-4 text-center">
            <div className="font-syne text-2xl font-bold text-accent">{totalDays}</div>
            <div className="text-xs text-slate-600 mt-0.5">Total Days</div>
          </div>

          {/* Balance Card */}
          {selectedBalance && (
            <div className="card-base p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Leave Balance
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Allowed</span>
                  <span className="text-white font-semibold">{selectedBalance.total_allowed}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Used</span>
                  <span className="text-yellow-400 font-semibold">{selectedBalance.used}</span>
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Available</span>
                  <span className={`font-semibold ${(selectedBalance.total_allowed - selectedBalance.used) >= totalDays ? 'text-emerald' : 'text-danger'}`}>
                    {selectedBalance.total_allowed - selectedBalance.used}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CreateLeaveRequest
