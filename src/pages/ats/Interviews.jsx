import { useMemo, useState } from 'react'
import { CalendarClock, Plus, Star } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const rubricFields = [
  { key: 'communication', label: 'Communication' },
  { key: 'problemSolving', label: 'Problem solving' },
  { key: 'coding', label: 'Coding' },
  { key: 'culture', label: 'Culture fit' },
]

const Interviews = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const [candidateId, setCandidateId] = useState((atsCandidates?.[0]?.id) || '')
  const [stage, setStage] = useState('HR')
  const [scheduledAt, setScheduledAt] = useState('')
  const [scores, setScores] = useState({ communication: 3, problemSolving: 3, coding: 3, culture: 3 })
  const [summary, setSummary] = useState('')

  const actor = localStorage.getItem('userEmail') || 'admin'

  const candidatesInInterview = useMemo(() => (atsCandidates || []).filter((c) => c.status === 'INTERVIEW'), [atsCandidates])

  const schedule = (e) => {
    e.preventDefault()
    if (!candidateId) return
    const now = new Date().toISOString()
    const interview = {
      id: `I-${Date.now()}`,
      stage,
      panel: [],
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : now,
      feedback: {
        rubricVersion: 'v1',
        submitted: true,
        scores,
        summary: summary.trim(),
      },
    }

    setAtsCandidates((prev) =>
      (prev || []).map((c) =>
        c.id === candidateId
          ? {
              ...c,
              status: c.status === 'INTERVIEW' ? c.status : 'INTERVIEW',
              interviews: [interview, ...(c.interviews || [])],
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
        action: 'INTERVIEW_RECORDED',
        entityId: candidateId,
        details: { stage },
      },
      ...(prev || []),
    ])

    showToast?.('Interview saved')
    setSummary('')
  }

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Interview Management</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Multi-stage interviews + standardized scoring (no unstructured-only feedback).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-4 border border-border lg:col-span-1">
          <div className="flex items-center gap-2">
            <CalendarClock size={14} className="text-accent" />
            <p className="text-xs font-semibold text-slate-200">Record interview</p>
          </div>

          <form onSubmit={schedule} className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Candidate</label>
              <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="mt-1 w-full input">
                {(atsCandidates || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.position})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Stage</label>
                <select value={stage} onChange={(e) => setStage(e.target.value)} className="mt-1 w-full input">
                  <option value="HR">HR</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="MANAGERIAL">Managerial</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">When</label>
                <input value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1 w-full input" placeholder="2026-05-01 10:00" />
              </div>
            </div>

            <div className="rounded-xl border border-border p-3 bg-surface/40">
              <p className="text-[11px] font-semibold text-slate-400">Rubric scores (1–5)</p>
              <div className="mt-2 space-y-2">
                {rubricFields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-300">{f.label}</span>
                    <select
                      value={scores[f.key]}
                      onChange={(e) => setScores((p) => ({ ...p, [f.key]: Number(e.target.value) }))}
                      className="input py-1 px-2 text-xs w-20"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500">Summary (optional)</label>
              <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full input" placeholder="Key strengths/risks…" />
            </div>

            <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <Plus size={14} />
              Save interview
            </button>
          </form>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-200">Candidates in interview stage</p>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
              {candidatesInInterview.length}
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {candidatesInInterview.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-slate-600">
                No candidates currently in INTERVIEW.
              </div>
            ) : (
              candidatesInInterview.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-3 bg-surface/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{c.fullName}</p>
                      <p className="text-xs text-slate-600 truncate">{c.position}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan/10 text-cyan border border-cyan/20">
                      {c.interviews?.length || 0} interviews
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(c.interviews || []).slice(0, 4).map((i) => {
                      const s = i?.feedback?.scores || {}
                      const avg = rubricFields.reduce((sum, f) => sum + (Number(s[f.key]) || 0), 0) / rubricFields.length
                      return (
                        <div key={i.id} className="rounded-lg border border-border bg-card/50 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-300">{i.stage}</p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                              <Star size={11} />
                              {avg ? avg.toFixed(1) : '—'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{i?.feedback?.summary || '—'}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Interviews

