import { useMemo, useState } from 'react'
import { Banknote, CheckCircle2, FileText, Send } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const Offers = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const actor = localStorage.getItem('userEmail') || 'admin'

  const offerCandidates = useMemo(() => (atsCandidates || []).filter((c) => c.status === 'OFFER'), [atsCandidates])

  const [selectedId, setSelectedId] = useState(offerCandidates?.[0]?.id || (atsCandidates?.[0]?.id || ''))
  const selected = (atsCandidates || []).find((c) => c.id === selectedId)

  const ensureOffer = () => {
    if (!selectedId) return
    const now = new Date().toISOString()
    setAtsCandidates((prev) =>
      (prev || []).map((c) =>
        c.id === selectedId
          ? {
              ...c,
              status: 'OFFER',
              offer:
                c.offer ||
                ({
                  id: `O-${Date.now()}`,
                  currency: 'PKR',
                  base: 0,
                  bonus: 0,
                  allowances: 0,
                  status: 'DRAFT',
                  approvals: [],
                  sentAt: null,
                  acceptedAt: null,
                  negotiationNotes: [],
                }),
              lastUpdatedAt: now,
            }
          : c
      )
    )
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'OFFER_DRAFTED', entityId: selectedId, details: {} },
      ...(prev || []),
    ])
    showToast?.('Offer draft created')
  }

  const updateOffer = (patch) => {
    if (!selectedId) return
    setAtsCandidates((prev) =>
      (prev || []).map((c) =>
        c.id === selectedId
          ? { ...c, offer: { ...(c.offer || {}), ...patch }, lastUpdatedAt: new Date().toISOString() }
          : c
      )
    )
  }

  const sendOffer = () => {
    if (!selectedId) return
    const now = new Date().toISOString()
    updateOffer({ status: 'SENT', sentAt: now })
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'OFFER_SENT', entityId: selectedId, details: {} },
      ...(prev || []),
    ])
    showToast?.('Offer sent')
  }

  const acceptOffer = () => {
    if (!selectedId) return
    const now = new Date().toISOString()
    updateOffer({ status: 'ACCEPTED', acceptedAt: now })
    setAtsCandidates((prev) =>
      (prev || []).map((c) => (c.id === selectedId ? { ...c, status: 'PRE_ONBOARDING', lastUpdatedAt: now } : c))
    )
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'OFFER_ACCEPTED', entityId: selectedId, details: {} },
      ...(prev || []),
    ])
    showToast?.('Offer accepted → moved to PRE_ONBOARDING')
  }

  const totalComp = (o) => (Number(o?.base) || 0) + (Number(o?.bonus) || 0) + (Number(o?.allowances) || 0)

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Offer Management</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Offer letter generation, approvals, negotiation tracking, and digital acceptance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-4 border border-border">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-200">Offer candidates</p>
          </div>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-3 w-full input">
            {(offerCandidates.length ? offerCandidates : atsCandidates || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} — {c.position} ({c.status})
              </option>
            ))}
          </select>

          <button onClick={ensureOffer} className="mt-3 btn-primary w-full">
            Create / Ensure draft
          </button>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          {!selected ? (
            <div className="text-xs text-slate-600">Select a candidate.</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{selected.fullName}</p>
                  <p className="text-xs text-slate-600 truncate">{selected.position}</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple/10 text-purple border border-purple/20">
                  {selected.offer?.status || 'NO_OFFER'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <label className="text-[11px] font-semibold text-slate-500">Base</label>
                  <input
                    value={selected.offer?.base ?? 0}
                    onChange={(e) => updateOffer({ base: Number(e.target.value) || 0 })}
                    className="mt-1 w-full input"
                  />
                </div>
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <label className="text-[11px] font-semibold text-slate-500">Bonus</label>
                  <input
                    value={selected.offer?.bonus ?? 0}
                    onChange={(e) => updateOffer({ bonus: Number(e.target.value) || 0 })}
                    className="mt-1 w-full input"
                  />
                </div>
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <label className="text-[11px] font-semibold text-slate-500">Allowances</label>
                  <input
                    value={selected.offer?.allowances ?? 0}
                    onChange={(e) => updateOffer({ allowances: Number(e.target.value) || 0 })}
                    className="mt-1 w-full input"
                  />
                </div>
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <Banknote size={14} className="text-slate-600" />
                  Total comp:{' '}
                  <span className="font-bold text-slate-200">{totalComp(selected.offer).toLocaleString()} {selected.offer?.currency || ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={sendOffer} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-colors text-xs font-bold">
                    <Send size={14} />
                    Send
                  </button>
                  <button onClick={acceptOffer} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald/10 text-emerald border border-emerald/20 hover:bg-emerald/15 transition-colors text-xs font-bold">
                    <CheckCircle2 size={14} />
                    Accept (digital)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Offers

