import { useMemo, useState } from 'react'
import { FileUp, FolderOpen, Paperclip, X } from 'lucide-react'
import { useApp } from '../../layouts/DashboardLayout'

const Documents = () => {
  const { atsCandidates, setAtsCandidates, setAtsAuditLogs, showToast } = useApp()
  const actor = localStorage.getItem('userEmail') || 'admin'
  const [candidateId, setCandidateId] = useState(atsCandidates?.[0]?.id || '')
  const [docKey, setDocKey] = useState('CNIC')
  const [note, setNote] = useState('')
  const [fileMeta, setFileMeta] = useState(null) // { name, type, size }

  const docs = useMemo(() => {
    const out = []
    for (const c of atsCandidates || []) {
      for (const d of c.documents || []) {
        out.push({ candidateId: c.id, candidateName: c.fullName, position: c.position, ...d })
      }
    }
    return out
  }, [atsCandidates])

  const upload = (e) => {
    e.preventDefault()
    if (!candidateId || !fileMeta?.name) {
      showToast?.('Select candidate and choose a file')
      return
    }
    const now = new Date().toISOString()
    const entry = {
      id: `D-${Date.now()}`,
      key: docKey,
      fileName: fileMeta.name,
      fileType: fileMeta.type || '',
      size: fileMeta.size || 0,
      uploadedAt: now,
      note: note.trim(),
    }
    setAtsCandidates((prev) =>
      (prev || []).map((c) => (c.id === candidateId ? { ...c, documents: [entry, ...(c.documents || [])], lastUpdatedAt: now } : c))
    )
    setAtsAuditLogs((prev) => [
      { id: `AL-${Date.now()}`, at: now, actor, action: 'DOCUMENT_UPLOADED', entityId: candidateId, details: { docKey, fileName: fileMeta.name } },
      ...(prev || []),
    ])
    showToast?.('Document uploaded')
    setNote('')
    setFileMeta(null)
  }

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Document Management</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Centralize candidate documents (CNIC, certificates, background checks) with auditability.
        </p>
      </div>

      <div className="card-base p-4 border border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileUp size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-200">Upload document</p>
          </div>
          {fileMeta?.name && (
            <button
              className="btn-ghost"
              onClick={() => setFileMeta(null)}
              aria-label="Clear file"
              type="button"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <form onSubmit={upload} className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-1">
            <label className="text-[11px] font-semibold text-slate-500">Candidate</label>
            <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)} className="mt-1 w-full input">
              {(atsCandidates || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} — {c.position}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="text-[11px] font-semibold text-slate-500">Document type</label>
            <select value={docKey} onChange={(e) => setDocKey(e.target.value)} className="mt-1 w-full input">
              <option value="CNIC">CNIC</option>
              <option value="CERTS">Certificates</option>
              <option value="BGV">Background verification</option>
              <option value="OFFER_SIGNED">Signed offer</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="text-[11px] font-semibold text-slate-500">File</label>
            <input
              type="file"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setFileMeta({ name: f.name, type: f.type, size: f.size })
              }}
              className="mt-1 w-full input py-2"
            />
            {fileMeta?.name && (
              <p className="text-[11px] text-slate-600 mt-1 truncate">
                {fileMeta.name} ({Math.round((fileMeta.size || 0) / 1024)} KB)
              </p>
            )}
          </div>
          <div className="lg:col-span-1">
            <label className="text-[11px] font-semibold text-slate-500">Note</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full input" placeholder="Optional note…" />
          </div>

          <div className="lg:col-span-4 flex items-center justify-end">
            <button type="submit" className="btn-primary">
              Upload
            </button>
          </div>
        </form>
      </div>

      <div className="card-base p-4 border border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={14} className="text-slate-500" />
            <p className="text-xs font-semibold text-slate-200">Documents</p>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {docs.length}
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-max sm:min-w-full">
            <thead>
              <tr>
                <th className="table-th">Candidate</th>
                <th className="table-th">Document</th>
                <th className="table-th">Uploaded</th>
                <th className="table-th">Notes</th>
              </tr>
            </thead>
            <tbody>
              {docs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-td text-center text-slate-600 py-6">
                    No documents yet. Upload hooks can be wired to storage later.
                  </td>
                </tr>
              ) : (
                docs.map((d, idx) => (
                  <tr key={`${d.candidateId}-${d.key}-${idx}`} className="table-row-hover last:[&>td]:border-0">
                    <td className="table-td">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{d.candidateName}</p>
                        <p className="text-xs text-slate-600 truncate">{d.position}</p>
                      </div>
                    </td>
                    <td className="table-td">
                      <span className="inline-flex items-center gap-2 text-xs text-slate-300 font-semibold">
                        <Paperclip size={14} className="text-slate-600" />
                        {d.key}
                      </span>
                    </td>
                    <td className="table-td text-slate-500">{d.uploadedAt ? new Date(d.uploadedAt).toLocaleString() : '—'}</td>
                    <td className="table-td text-slate-600">{d.note || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Documents

