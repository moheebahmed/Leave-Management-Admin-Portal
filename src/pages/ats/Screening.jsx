import { useMemo, useState } from 'react'
import { Filter, Sparkles, UserPlus } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const Screening = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const [minScore, setMinScore] = useState(70)
  const [mustHave, setMustHave] = useState('react')

  const actor = localStorage.getItem('userEmail') || 'admin'

  const screened = useMemo(() => {
    const q = mustHave.trim().toLowerCase()
    return (atsCandidates || []).map((c) => {
      const resume = (c.resumeText || '').toLowerCase()
      const skills = (c.skills || []).join(' ').toLowerCase()
      const keywordsHit = q ? resume.includes(q) || skills.includes(q) : true
      const autoScore = c?.screening?.autoScore ?? 0
      const pass = keywordsHit && autoScore >= minScore
      return { candidate: c, keywordsHit, pass }
    })
  }, [atsCandidates, minScore, mustHave])

  const shortlist = (id) => {
    setAtsCandidates((prev) =>
      (prev || []).map((c) =>
        c.id === id
          ? {
              ...c,
              screening: { ...(c.screening || {}), recruiterShortlisted: true },
              lastUpdatedAt: new Date().toISOString(),
            }
          : c
      )
    )
    setAtsAuditLogs((prev) => [
      {
        id: `AL-${Date.now()}`,
        at: new Date().toISOString(),
        actor,
        action: 'CANDIDATE_SHORTLISTED',
        entityId: id,
        details: {},
      },
      ...(prev || []),
    ])
    showToast?.('Candidate shortlisted')
  }

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Screening & Shortlisting</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Automated filters + recruiter shortlisting + pre-screen questionnaire hooks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-4 border border-border">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-200">Filters</p>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Minimum auto score</label>
              <input
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value) || 0)}
                className="mt-1 w-full input"
                placeholder="e.g. 70"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500">Must-have keyword</label>
              <input
                value={mustHave}
                onChange={(e) => setMustHave(e.target.value)}
                className="mt-1 w-full input"
                placeholder="react"
              />
              <p className="text-[11px] text-slate-600 mt-1">
                This currently checks skills + pasted resume text (resume parsing can replace this later).
              </p>
            </div>
          </div>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <p className="text-xs font-semibold text-slate-200">Screening results</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              {screened.filter((x) => x.pass).length} qualified
            </span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-max sm:min-w-full">
              <thead>
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Auto score</th>
                  <th className="table-th">Keyword hit</th>
                  <th className="table-th">Qualified</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {screened.map(({ candidate, keywordsHit, pass }) => (
                  <tr key={candidate.id} className="table-row-hover last:[&>td]:border-0">
                    <td className="table-td">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{candidate.fullName}</p>
                        <p className="text-xs text-slate-600 truncate">{candidate.position}</p>
                      </div>
                    </td>
                    <td className="table-td text-slate-300 font-semibold">{candidate?.screening?.autoScore ?? '—'}</td>
                    <td className="table-td">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${keywordsHit ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-danger/10 text-danger border-danger/20'}`}>
                        {keywordsHit ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="table-td">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${pass ? 'bg-emerald/10 text-emerald border-emerald/20' : 'bg-amber/10 text-amber border-amber/20'}`}>
                        {pass ? 'Qualified' : 'Review'}
                      </span>
                    </td>
                    <td className="table-td text-right">
                      <button
                        disabled={candidate?.screening?.recruiterShortlisted}
                        onClick={() => shortlist(candidate.id)}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          candidate?.screening?.recruiterShortlisted
                            ? 'bg-border text-slate-600 cursor-not-allowed'
                            : 'bg-emerald/10 text-emerald hover:bg-emerald/20'
                        }`}
                      >
                        <UserPlus size={12} />
                        {candidate?.screening?.recruiterShortlisted ? 'Shortlisted' : 'Shortlist'}
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

export default Screening

