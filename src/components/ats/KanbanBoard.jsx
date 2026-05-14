import CandidateCard from './CandidateCard'
import { ATS_PIPELINE_STATUSES } from '../../data/atsInitialData'

const toneClass = (tone) => {
  switch (tone) {
    case 'emerald':
      return 'bg-emerald/10 text-emerald border-emerald/20'
    case 'amber':
      return 'bg-amber/10 text-amber border-amber/20'
    case 'cyan':
      return 'bg-cyan/10 text-cyan border-cyan/20'
    case 'purple':
      return 'bg-purple/10 text-purple border-purple/20'
    case 'blue':
      return 'bg-blue/10 text-blue border-blue/20'
    case 'red':
      return 'bg-danger/10 text-danger border-danger/20'
    default:
      return 'bg-slate/10 text-slate-300 border-border'
  }
}

const defaultToneFor = (statusKey) => {
  switch (statusKey) {
    case 'APPLIED':
      return 'slate'
    case 'SCREENING':
      return 'amber'
    case 'INTERVIEW':
      return 'cyan'
    case 'OFFER':
      return 'purple'
    case 'PRE_ONBOARDING':
      return 'blue'
    case 'ONBOARDING':
      return 'emerald'
    case 'POST_ONBOARDING':
      return 'emerald'
    case 'HIRED':
      return 'emerald'
    case 'REJECTED':
      return 'red'
    default:
      return 'slate'
  }
}

const KanbanBoard = ({
  candidates,
  onMoveCandidate,
  onOpenCandidate,
  filterText = '',
  onlyQualified = false,
  statuses = ATS_PIPELINE_STATUSES,
}) => {
  const q = (filterText || '').trim().toLowerCase()

  const filtered = (candidates || []).filter((c) => {
    if (!c) return false
    if (onlyQualified && !c?.screening?.recruiterShortlisted) return false
    if (!q) return true
    const hay = [
      c.fullName,
      c.email,
      c.phone,
      c.position,
      c.source,
      ...(c.skills || []),
      c.resumeText,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })

  const grouped = statuses.reduce((acc, s) => {
    acc[s.key] = []
    return acc
  }, {})

  for (const c of filtered) {
    const k = c.status || 'APPLIED'
    if (!grouped[k]) grouped[k] = []
    grouped[k].push(c)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {statuses.map((col) => {
        const list = grouped[col.key] || []
        const tone = defaultToneFor(col.key)
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData('text/plain')
              if (!id) return
              onMoveCandidate?.(id, col.key)
            }}
            className="card-base p-3 border border-border min-h-[180px]"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{col.label}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">{list.length} candidate{list.length === 1 ? '' : 's'}</p>
              </div>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${toneClass(tone)}`}>
                {col.key}
              </span>
            </div>

            <div className="space-y-2">
              {list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-slate-600">
                  Drop candidates here
                </div>
              ) : (
                list.map((c, idx) => (
                  <CandidateCard key={c.id} candidate={c} index={idx} onOpen={onOpenCandidate} />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KanbanBoard

