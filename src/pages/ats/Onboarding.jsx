import { useMemo, useState } from 'react'
import { KeyRound, Laptop, ListChecks } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const Onboarding = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const actor = localStorage.getItem('userEmail') || 'admin'

  const list = useMemo(() => (atsCandidates || []).filter((c) => c.status === 'ONBOARDING'), [atsCandidates])
  const [selectedId, setSelectedId] = useState(list?.[0]?.id || (atsCandidates?.[0]?.id || ''))
  const selected = (atsCandidates || []).find((c) => c.id === selectedId)

  const complete = () => {
    const now = new Date().toISOString()
    setAtsCandidates((prev) => (prev || []).map((c) => (c.id === selectedId ? { ...c, status: 'POST_ONBOARDING', lastUpdatedAt: now } : c)))
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'ONBOARDING_COMPLETED', entityId: selectedId, details: {} },
      ...(prev || []),
    ])
    showToast?.('Moved to POST_ONBOARDING')
  }

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Onboarding</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Day 1 to first week: employee record creation, access provisioning, orientation, and equipment assignment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-4 border border-border">
          <p className="text-xs font-semibold text-slate-200">Candidates</p>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-3 w-full input">
            {(list.length ? list : atsCandidates || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} ({c.status})
              </option>
            ))}
          </select>
          <button onClick={complete} className="mt-3 btn-primary w-full">
            Complete onboarding → Post‑onboarding
          </button>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          {!selected ? (
            <p className="text-xs text-slate-600">Select a candidate.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{selected.fullName}</p>
                  <p className="text-xs text-slate-600 truncate">{selected.position}</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald border border-emerald/20">
                  {selected.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <div className="flex items-center gap-2">
                    <ListChecks size={14} className="text-slate-500" />
                    <p className="text-xs font-semibold text-slate-200">Employee record</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Hook point: create employee record in core HR module and link back to candidate ID.
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <div className="flex items-center gap-2">
                    <KeyRound size={14} className="text-slate-500" />
                    <p className="text-xs font-semibold text-slate-200">System access</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Provision email/tools and track completion + evidence (ticket links).
                  </p>
                </div>
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <div className="flex items-center gap-2">
                    <Laptop size={14} className="text-slate-500" />
                    <p className="text-xs font-semibold text-slate-200">Equipment</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Assign laptop/accessories and capture handover acknowledgment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Onboarding

