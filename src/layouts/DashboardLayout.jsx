import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

// Context to share toast and data across pages
import { createContext, useContext } from 'react'
import { INITIAL_EMPLOYEES, INITIAL_LEAVE_BALANCES } from '../data/initialData'
import { INITIAL_ATS_AUDIT_LOGS, INITIAL_ATS_CANDIDATES } from '../data/atsInitialData'

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [leaveBalances, setLeaveBalances] = useState(INITIAL_LEAVE_BALANCES)
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [atsCandidates, setAtsCandidates] = useState(INITIAL_ATS_CANDIDATES)
  const [atsAuditLogs, setAtsAuditLogs] = useState(INITIAL_ATS_AUDIT_LOGS)
  const { toast, showToast, hideToast } = useToast()

  return (
    <AppContext.Provider
      value={{
        employees,
        setEmployees,
        leaveBalances,
        setLeaveBalances,
        attendanceRecords,
        setAttendanceRecords,
        atsCandidates,
        setAtsCandidates,
        atsAuditLogs,
        setAtsAuditLogs,
        showToast,
      }}
    >
      <div className="flex h-screen overflow-hidden app-bg" style={{ height: '100dvh' }}>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar — hidden on mobile unless mobileOpen */}
        <div className={`
          fixed inset-y-0 left-0 z-50 lg:static lg:z-auto lg:flex lg:shrink-0
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <Sidebar collapsed={window.innerWidth >= 1024 ? collapsed : false} onClose={() => setMobileOpen(false)} />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Navbar
            toggleSidebar={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen((o) => !o)
              } else {
                setCollapsed((c) => !c)
              }
            }}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent relative">
            <Outlet />
          </main>
        </div>

        <Toast toast={toast} onClose={hideToast} />
      </div>
    </AppContext.Provider>
  )
}

export default DashboardLayout
