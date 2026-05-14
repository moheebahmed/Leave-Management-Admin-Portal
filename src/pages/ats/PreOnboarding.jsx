import { useMemo, useState } from 'react'
import { FileCheck2, Mail, ShieldCheck } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const requiredDocs = [
  { key: 'CNIC', label: 'CNIC' },
  { key: 'CERTS', label: 'Certificates' },
  { key: 'PHOTO', label: 'Passport photo' },
]

const PreOnboarding = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const actor = localStorage.getItem('userEmail') || 'admin'
  const [selectedId, setSelectedId] = useState((atsCandidates?.find((c) => c.status === 'PRE_ONBOARDING')?.id) || (atsCandidates?.[0]?.id || ''))

  const selected = (atsCandidates || []).find((c) => c.id === selectedId)
  const list = useMemo(() => (atsCandidates || []).filter((c) => c.status === 'PRE_ONBOARDING'), [atsCandidates])

  const toggleDoc = (docKey) => {
    const now = new Date().toISOString()
    setAtsCandidates((prev) =>
      (prev || []).map((c) => {
        if (c.id !== selectedId) return c
        const docs = new Set((c.documents || []).map((d) => d.key))
        const has = docs.has(docKey)
        const nextDocs = has
          ? (c.documents || []).filter((d) => d.key !== docKey)
          : [{ key: docKey, uploadedAt: now }, ...(c.documents || [])]
        return { ...c, documents: nextDocs, lastUpdatedAt: now }
      })
    )
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'DOC_TOGGLED', entityId: selectedId, details: { docKey } },
      ...(prev || []),
    ])
  }

  const moveToOnboarding = () => {
    const now = new Date().toISOString()
    setAtsCandidates((prev) => (prev || []).map((c) => (c.id === selectedId ? { ...c, status: 'ONBOARDING', lastUpdatedAt: now } : c)))
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'PRE_ONBOARDING_COMPLETED', entityId: selectedId, details: {} },
      ...(prev || []),
    ])
    showToast?.('Moved to ONBOARDING')
  }

  const hasDoc = (docKey) => !!(selected?.documents || []).find((d) => d.key === docKey)
  const docProgress = requiredDocs.filter((d) => hasDoc(d.key)).length

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Pre‑Onboarding</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          From offer acceptance to joining date: documents, verification, and proactive comms to reduce drop-offs.
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
          <button onClick={moveToOnboarding} className="mt-3 btn-primary w-full">
            Mark complete → Onboarding
          </button>
        </div>

        <div className="card-base p-4 border border-border lg:col-span-2">
          {!selected ? (
            <p className="text-xs text-slate-600">Select a candidate.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{selected.fullName}</p>
                  <p className="text-xs text-slate-600 truncate">{selected.position}</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue/10 text-blue border border-blue/20">
                  {docProgress}/{requiredDocs.length} docs
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border p-3 bg-surface/40">
                  <div className="flex items-center gap-2">
                    <FileCheck2 size={14} className="text-slate-500" />
                    <p className="text-xs font-semibold text-slate-200">Document collection</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {requiredDocs.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => toggleDoc(d.key)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-colors ${
                          hasDoc(d.key) ? 'border-emerald/30 bg-emerald/5 text-emerald' : 'border-border bg-card/40 text-slate-300 hover:bg-card/60'
                        }`}
                      >
                        <span className="text-xs font-semibold">{d.label}</span>
                        <span className="text-[11px] font-semibold">{hasDoc(d.key) ? 'Uploaded' : 'Missing'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border p-3 bg-surface/40 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-slate-500" />
                    <p className="text-xs font-semibold text-slate-200">Background verification</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    Hook point for integrations (e.g., vendor API). Store verification status & evidence in documents.
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Mail size={14} className="text-slate-600" />
                    <p className="text-xs text-slate-500">Communication emails: welcome, checklist, joining instructions.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PreOnboarding

