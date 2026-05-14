import { useMemo } from 'react'
import { CheckCircle2, ClipboardCheck, GraduationCap, MessageSquareText } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const PostOnboarding = () => {
  const { atsCandidates } = useApp()

  const list = useMemo(() => (atsCandidates || []).filter((c) => ['POST_ONBOARDING', 'HIRED'].includes(c.status)), [atsCandidates])

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Post‑Onboarding (30–90 days)</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Probation tracking, manager check-ins, training modules, feedback surveys, and confirmation workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-4 border border-border">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-200">What this page enforces</p>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-slate-500">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Scheduled manager check-ins (no silent probation).
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Training module completion tracking.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Confirmation workflow with approvals + audit logs.
            </li>
          </ul>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-slate-200">Employees in post‑onboarding</p>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald border border-emerald/20">
              {list.length}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-slate-600 md:col-span-2">
                No candidates in POST_ONBOARDING yet.
              </div>
            ) : (
              list.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-3 bg-surface/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{c.fullName}</p>
                      <p className="text-xs text-slate-600 truncate">{c.position}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-card/60 border border-border text-slate-400">
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-card/50 p-2">
                      <div className="flex items-center gap-2">
                        <MessageSquareText size={14} className="text-slate-600" />
                        <p className="text-xs font-semibold text-slate-300">Check-ins</p>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Manager schedule hook</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card/50 p-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-slate-600" />
                        <p className="text-xs font-semibold text-slate-300">Training</p>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Modules + completion</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card/50 p-2 col-span-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-slate-600" />
                        <p className="text-xs font-semibold text-slate-300">Confirmation workflow</p>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">Approvals + outcome + audit trail</p>
                    </div>
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

export default PostOnboarding

