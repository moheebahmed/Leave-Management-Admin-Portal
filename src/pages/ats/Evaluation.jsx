import { useMemo } from 'react'
import { BarChart3, CheckCircle2, Scale } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const rubricKeys = ['communication', 'problemSolving', 'coding', 'culture']

const avgScore = (candidate) => {
  const interviews = candidate?.interviews || []
  const scored = interviews
    .map((i) => i?.feedback?.scores)
    .filter(Boolean)
    .map((s) => rubricKeys.reduce((sum, k) => sum + (Number(s[k]) || 0), 0) / rubricKeys.length)
    .filter((n) => Number.isFinite(n) && n > 0)
  if (scored.length === 0) return null
  return scored.reduce((a, b) => a + b, 0) / scored.length
}

const Evaluation = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const actor = localStorage.getItem('userEmail') || 'admin'

  const ranked = useMemo(() => {
    const list = (atsCandidates || []).map((c) => ({ c, avg: avgScore(c) }))
    return list.sort((a, b) => (b.avg || 0) - (a.avg || 0))
  }, [atsCandidates])

  const selectFinal = (id) => {
    const now = new Date().toISOString()
    setAtsCandidates((prev) =>
      (prev || []).map((c) =>
        c.id === id
          ? {
              ...c,
              status: c.status === 'OFFER' ? c.status : 'OFFER',
              lastUpdatedAt: now,
            }
          : c
      )
    )
    setAtsAuditLogs((prev) => [
      {
        id: `AL-${Date.now()}`,
        at: now,
        actor,
        action: 'FINAL_SELECTED',
        entityId: id,
        details: {},
      },
      ...(prev || []),
    ])
    showToast?.('Selected for offer stage')
  }

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Evaluation & Decision</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Aggregate interview scores, compare candidates, and select finalists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-4 border border-border">
          <div className="flex items-center gap-2">
            <Scale size={14} className="text-accent" />
            <p className="text-xs font-semibold text-slate-200">Decision discipline</p>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              No “gut-only” approvals — every candidate needs a rubric score.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Panel feedback should be enforced (missing feedback is a blocker).
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Final selection moves the candidate to OFFER stage.
            </li>
          </ul>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-slate-500" />
              <p className="text-xs font-semibold text-slate-200">Ranked candidates</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {ranked.length}
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-max sm:min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Avg score</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ c, avg }) => (
                  <tr key={c.id} className="table-row-hover last:[&>td]:border-0">
                    <td className="table-td">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{c.fullName}</p>
                        <p className="text-xs text-slate-600 truncate">{c.position}</p>
                      </div>
                    </td>
                    <td className="table-td font-semibold text-slate-300">{avg ? avg.toFixed(2) : '—'}</td>
                    <td className="table-td">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-card/60 border border-border text-slate-400">
                        {c.status}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => selectFinal(c.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-purple/10 text-purple hover:bg-purple/20 transition-colors"
                      >
                        <CheckCircle2 size={12} />
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Evaluation

