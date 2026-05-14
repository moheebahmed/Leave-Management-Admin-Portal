import { Mail, Phone, Star } from 'lucide-react'

const ScorePill = ({ value }) => {
  if (value === null || value === undefined) return null
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const tone =
    v >= 80 ? 'bg-emerald/10 text-emerald border-emerald/20' : v >= 60 ? 'bg-amber/10 text-amber border-amber/20' : 'bg-danger/10 text-danger border-danger/20'
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tone}`}>
      <Star size={11} />
      {v}
    </span>
  )
}

const CandidateCard = ({ candidate, index = 0, draggable = true, onOpen }) => {
  const score = candidate?.screening?.autoScore ?? null

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', candidate.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDoubleClick={() => onOpen?.(candidate)}
      className="group card-base p-3 border border-border hover:border-border-bright transition-colors cursor-grab active:cursor-grabbing select-none"
      style={{ opacity: candidate?.status === 'REJECTED' ? 0.8 : 1 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate">{candidate.fullName}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">{candidate.position}</p>
        </div>
        <ScorePill value={score} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Mail size={12} className="text-slate-600" />
          <span className="truncate max-w-[160px]">{candidate.email}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Phone size={12} className="text-slate-600" />
          <span className="truncate max-w-[110px]">{candidate.phone}</span>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {(candidate.skills || []).slice(0, 4).map((s) => (
          <span
            key={s}
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-card/60 border border-border text-slate-400"
            title={s}
          >
            {s}
          </span>
        ))}
        {(candidate.skills || []).length > 4 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-card/60 border border-border text-slate-500">
            +{(candidate.skills || []).length - 4}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
        <span className="truncate">Source: {candidate.source || '—'}</span>
        <span className="shrink-0">{candidate.experienceYears ?? '—'}y</span>
      </div>
    </div>
  )
}

export default CandidateCard

