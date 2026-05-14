import { useMemo, useState } from 'react'
import { Clock, ScrollText, Search, Tag } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const toneFor = (action) => {
  const a = String(action || '')
  if (a.includes('STATUS')) return 'bg-cyan/10 text-cyan border-cyan/20'
  if (a.includes('OFFER')) return 'bg-purple/10 text-purple border-purple/20'
  if (a.includes('DOC') || a.includes('DOCUMENT')) return 'bg-blue/10 text-blue border-blue/20'
  if (a.includes('SHORTLIST')) return 'bg-emerald/10 text-emerald border-emerald/20'
  if (a.includes('REJECT')) return 'bg-danger/10 text-danger border-danger/20'
  return 'bg-accent/10 text-accent border-accent/20'
}

const formatWhen = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

const AuditLogs = () => {
  const { atsAuditLogs } = useApp()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = atsAuditLogs || []
    if (!query) return list
    return list.filter((e) => JSON.stringify(e).toLowerCase().includes(query))
  }, [atsAuditLogs, q])

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Audit Logs</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Immutable event trail for HR compliance (status changes, approvals, document actions).
        </p>
      </div>

      <div className="card-base p-3 border border-border flex items-center gap-2">
        <Search size={14} className="text-slate-600 shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search audit logs…"
          className="bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none flex-1 min-w-0"
        />
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-card/60 border border-border text-slate-400 shrink-0">
          {filtered.length}
        </span>
      </div>

      <div className="card-base p-4 border border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ScrollText size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-200">Event timeline</p>
          </div>
          <p className="text-[11px] text-slate-600">Latest first</p>
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-slate-600">
              No events yet.
            </div>
          ) : (
            filtered.map((e) => (
              <div key={e.id} className="rounded-xl border border-border bg-surface/30 p-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${toneFor(e.action)}`}>
                        {e.action}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Tag size={12} className="text-slate-600" />
                        {e.entityId || '—'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Actor: <span className="text-slate-400 font-semibold">{e.actor || '—'}</span>
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
                    <Clock size={12} className="text-slate-600" />
                    {formatWhen(e.at)}
                  </div>
                </div>

                {e.details && (
                  <pre className="mt-2 text-[11px] text-slate-500 bg-card/40 border border-border rounded-lg p-2 overflow-x-auto">
{JSON.stringify(e.details, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditLogs

