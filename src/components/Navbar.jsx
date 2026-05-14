import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, Bell, LogOut, ArrowRight, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { API_BASE_URL, getAuthHeaders } from '../api/config'

const PAGE_TITLES = {
  '/': 'Dashboard Overview',
  '/employees': 'Employee Directory',
  '/add-employee': 'Add New Employee',
  '/leave-balance': 'Leave Balance',
  '/add-leave': 'Add Leave Balance',
  '/ats/applications': 'ATS — Applications',
  '/ats/screening': 'ATS — Screening',
  '/ats/interviews': 'ATS — Interviews',
  '/ats/evaluation': 'ATS — Evaluation',
  '/ats/offers': 'ATS — Offers',
  '/ats/pre-onboarding': 'ATS — Pre‑Onboarding',
  '/ats/onboarding': 'ATS — Onboarding',
  '/ats/post-onboarding': 'ATS — Post‑Onboarding',
  '/ats/documents': 'ATS — Documents',
  '/ats/audit-logs': 'ATS — Audit Logs',
  '/ats/reports': 'ATS — Reports',
}

const Navbar = ({ toggleSidebar }) => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = PAGE_TITLES[pathname] || 'Dashboard'
  const [showLogoutMenu, setShowLogoutMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  const userEmail = localStorage.getItem('userEmail') || 'hr@conceptrecall.com'
  const logoutRef = useRef(null)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (showNotifications) {
      setNotificationsLoading(true)
      axios.get(`${API_BASE_URL}/employees/notifications`, { headers: getAuthHeaders() })
        .then(res => setNotifications((res.data.data.notifications || []).slice(0, 5)))
        .catch(() => { })
        .finally(() => setNotificationsLoading(false))
    }
  }, [showNotifications])

  // Close logout dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (logoutRef.current && !logoutRef.current.contains(e.target)) {
        setShowLogoutMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close everything on route change
  useEffect(() => {
    setShowNotifications(false)
    setShowLogoutMenu(false)
    setShowMobileSearch(false)
  }, [pathname])

  // Lock body scroll when mobile notification panel is open
  useEffect(() => {
    if (isMobile && showNotifications) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isMobile, showNotifications])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 172800) return 'Yesterday'
    return date.toLocaleDateString()
  }

  const handleLogout = () => {
    localStorage.clear()
    window.dispatchEvent(new Event('auth-change'))
    navigate('/login')
  }

  const userInitials = (userEmail?.slice(0, 2) || 'AD').toUpperCase()

  // ── Notification Panel (shared UI for both mobile & desktop) ──
  const NotificationPanel = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
        <div>
          <p className="text-sm font-semibold text-slate-100">Notifications</p>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <button
          onClick={() => setShowNotifications(false)}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-card-hover"
        >
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 divide-y divide-border">
        {notificationsLoading ? (
          <div className="flex items-center justify-center py-8 text-slate-600">
            <p className="text-xs">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-600">
            <p className="text-xs">No notifications</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`px-4 py-3 hover:bg-card/50 transition-colors cursor-pointer ${!n.is_read ? 'bg-accent/5' : ''}`}
            >
              <p className={`text-xs font-medium ${!n.is_read ? 'text-slate-100' : 'text-slate-400'}`}>
                {n.title}
              </p>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
              <p className="text-[11px] text-slate-600 mt-1.5">{formatTime(n.created_at)}</p>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <button
        onClick={() => {
          navigate('/notifications')
          setShowNotifications(false)
        }}
        className="px-4 py-2.5 border-t border-border text-xs text-accent hover:text-accent/80 transition-colors flex items-center justify-center gap-1.5 font-medium shrink-0"
      >
        View All Notifications
        <ArrowRight size={12} />
      </button>
    </div>
  )

  return (
    <>
      {/* ── Navbar ── */}
      <header className="h-14 flex items-center px-3 sm:px-5 gap-2 sm:gap-4 bg-surface/75 backdrop-blur border-b border-border shrink-0 relative z-[100]">

        {/* Sidebar toggle */}
        <button onClick={toggleSidebar} className="btn-ghost shrink-0" aria-label="Toggle sidebar">
          <Menu size={15} />
        </button>

        {/* Page title */}
        {!showMobileSearch && (
          <h1 className="font-syne font-semibold text-[13px] sm:text-[14px] text-slate-100 flex-1 truncate min-w-0">
            {title}
          </h1>
        )}

        {/* Mobile search expanded */}
        {showMobileSearch && (
          <div className="flex-1 flex items-center gap-2 bg-card/60 border border-border rounded-lg px-3 py-1.5 min-w-0">
            <Search size={12} className="text-slate-500 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Quick search…"
              className="bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none flex-1 min-w-0"
            />
            <button onClick={() => setShowMobileSearch(false)}>
              <X size={12} className="text-slate-500" />
            </button>
          </div>
        )}

   
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

 
          {/* <div className="hidden sm:flex items-center gap-2 bg-card/60 border border-border rounded-lg px-3 py-1.5 text-xs text-slate-500 cursor-pointer hover:border-border-bright transition-colors">
            <Search size={12} />
            <span className="hidden md:inline">Quick search…</span>
            <span className="ml-1 text-[10px] bg-border px-1.5 py-0.5 rounded text-slate-600">⌘K</span>
          </div> */}

          {/* Mobile search icon */}
          {!showMobileSearch && (
            <button onClick={() => setShowMobileSearch(true)} className="btn-ghost sm:hidden" aria-label="Search">
              <Search size={14} />
            </button>
          )}

          {/* Bell */}
          <button
            onClick={() => {
              setShowNotifications(prev => !prev)
              setShowLogoutMenu(false)
            }}
            className="btn-ghost relative"
            aria-label="Notifications"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent border-[1.5px] border-surface" />
            )}
          </button>

          {/* Desktop notification dropdown (sm and above) */}
          {showNotifications && !isMobile && (
            <>
              <div
                className="fixed inset-0 z-[999]"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-12 top-14 w-80 card-base shadow-2xl z-[1000] animate-fade-slide max-h-96 overflow-hidden flex flex-col border border-border">
                <NotificationPanel />
              </div>
            </>
          )}

          {/* Avatar + Logout */}
          <div className="relative" ref={logoutRef}>
            <button
              onClick={() => {
                setShowLogoutMenu(prev => !prev)
                setShowNotifications(false)
              }}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              aria-label="Account menu"
            >
              {userInitials}
            </button>

            {showLogoutMenu && (
              <>
                <div
                  className="fixed inset-0 z-[999]"
                  onClick={() => setShowLogoutMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 card-base p-2 shadow-xl z-[1000] animate-fade-slide">
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <p className="text-xs font-semibold text-slate-300">Login as</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{userEmail}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-card-hover rounded-lg transition-colors"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ── Mobile Notification Panel (full screen overlay) ── */}
      {showNotifications && isMobile && (
        <>
          {/* Dark backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-[1000]"
            onClick={() => setShowNotifications(false)}
          />
          {/* Panel slides in from top */}
          <div className="fixed top-14 left-0 right-0 z-[1001] mx-3 rounded-xl border border-border shadow-2xl overflow-hidden animate-fade-slide"
            style={{ backgroundColor: 'var(--color-surface, #1a1f2e)', maxHeight: 'calc(100vh - 80px)' }}
          >
            <NotificationPanel />
          </div>
        </>
      )}
    </>
  )
}

export default Navbar