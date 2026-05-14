import { useMemo } from 'react'
import { LineChart, Timer, TrendingDown, TrendingUp } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const daysBetween = (a, b) => {
  try {
    const x = new Date(a).getTime()
    const y = new Date(b).getTime()
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null
    return Math.max(0, Math.round((y - x) / (1000 * 60 * 60 * 24)))
  } catch {
    return null
  }
}

const Reports = () => {
  const { atsCandidates } = useApp()

  const metrics = useMemo(() => {
    const list = atsCandidates || []
    const total = list.length
    const bySource = list.reduce((acc, c) => {
      const k = c.source || 'Unknown'
      acc[k] = (acc[k] || 0) + 1
      return acc
    }, {})
    const dropOff = list.filter((c) => ['REJECTED'].includes(c.status)).length
    const hired = list.filter((c) => ['HIRED', 'POST_ONBOARDING', 'ONBOARDING', 'PRE_ONBOARDING'].includes(c.status)).length

    const timeToOffer = list
      .filter((c) => c.offer?.sentAt && c.appliedAt)
      .map((c) => daysBetween(c.appliedAt, c.offer.sentAt))
      .filter((d) => d !== null)
    const avgTimeToOffer = timeToOffer.length ? Math.round(timeToOffer.reduce((a, b) => a + b, 0) / timeToOffer.length) : null

    return { total, bySource, dropOff, hired, avgTimeToOffer }
  }, [atsCandidates])

  const sources = Object.entries(metrics.bySource).sort((a, b) => b[1] - a[1])

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Reporting</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Time-to-hire, drop-off rate, and source effectiveness (starter metrics).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-base p-4 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Total candidates</p>
            <LineChart size={16} className="text-slate-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{metrics.total}</p>
        </div>
        <div className="card-base p-4 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Hired / Active</p>
            <TrendingUp size={16} className="text-emerald" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{metrics.hired}</p>
        </div>
        <div className="card-base p-4 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Drop-offs</p>
            <TrendingDown size={16} className="text-danger" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{metrics.dropOff}</p>
        </div>
        <div className="card-base p-4 border border-border">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Avg time-to-offer</p>
            <Timer size={16} className="text-slate-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-100">{metrics.avgTimeToOffer === null ? '—' : `${metrics.avgTimeToOffer}d`}</p>
        </div>
      </div>

      <div className="card-base p-4 border border-border">
        <p className="text-xs font-semibold text-slate-200">Source effectiveness</p>
        <p className="text-[11px] text-slate-600 mt-0.5">Counts by source (wire conversion rates later).</p>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-slate-600">
              No data yet.
            </div>
          ) : (
            sources.map(([src, count]) => (
              <div key={src} className="rounded-xl border border-border p-3 bg-surface/40 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-200 truncate">{src}</p>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {count}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports

