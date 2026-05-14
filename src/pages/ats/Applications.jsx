import { useEffect, useMemo, useState } from "react";
import { FileUp, Plus, Search, Sparkles, UserCheck, X } from "lucide-react";
import KanbanBoard from "../../components/ats/KanbanBoard";
import { useApp } from "../../layouts/DashboardLayout";
import { ATS_PIPELINE_STATUSES } from "../../data/atsInitialData";
import { useGlobalModal } from "../../components/GlobalModal";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  position: "",
  source: "LinkedIn",
  experienceYears: "",
  skillsCsv: "",
  resumeText: "",
};

const Applications = () => {
  const {
    atsCandidates,
    setAtsCandidates,
    atsAuditLogs,
    setAtsAuditLogs,
    showToast,
  } = useApp();
  const [filterText, setFilterText] = useState("");
  const [onlyQualified, setOnlyQualified] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [cvMeta, setCvMeta] = useState(null); // { name, type, size }
  const [parsing, setParsing] = useState(false);
  const { open: openModal, close: closeModal } = useGlobalModal();

  const actor = localStorage.getItem("userEmail") || "admin";

  const nextCandidateId = useMemo(() => {
    const nums = (atsCandidates || [])
      .map((c) => String(c?.id || ""))
      .map((id) => Number(id.replace(/[^\d]/g, "")))
      .filter((n) => Number.isFinite(n));
    const base = nums.length ? Math.max(...nums) + 1 : 1001;
    return `C-${base}`;
  }, [atsCandidates]);

  const addAudit = (entry) => {
    setAtsAuditLogs((prev) => [
      { ...entry, id: `AL-${Date.now()}` },
      ...(prev || []),
    ]);
  };

  const moveCandidate = (candidateId, toStatus) => {
    setAtsCandidates((prev) => {
      const list = [...(prev || [])];
      const idx = list.findIndex((c) => c.id === candidateId);
      if (idx === -1) return prev;
      const from = list[idx].status;
      if (from === toStatus) return prev;
      list[idx] = {
        ...list[idx],
        status: toStatus,
        lastUpdatedAt: new Date().toISOString(),
      };
      addAudit({
        at: new Date().toISOString(),
        actor,
        action: "CANDIDATE_STATUS_CHANGED",
        entityId: candidateId,
        details: { from, to: toStatus },
      });
      showToast?.(`Moved to ${toStatus}`);
      return list;
    });
  };

  const createCandidate = (e) => {
    e.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    if (!fullName || !email) {
      showToast?.("Full name and email are required");
      return;
    }

    const skills = form.skillsCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const now = new Date().toISOString();
    const newCandidate = {
      id: nextCandidateId,
      fullName,
      email,
      phone: form.phone.trim(),
      position: form.position.trim() || "—",
      source: form.source.trim() || "—",
      experienceYears:
        form.experienceYears === "" ? null : Number(form.experienceYears) || 0,
      skills,
      status: "APPLIED",
      appliedAt: now,
      lastUpdatedAt: now,
      resumeText: form.resumeText.trim(),
      screening: {
        autoScore: null,
        keywordsMatched: [],
        questionnaireScore: null,
        recruiterShortlisted: false,
      },
      interviews: [],
      offer: null,
      documents: [],
      notes: [],
    };

    setAtsCandidates((prev) => [newCandidate, ...(prev || [])]);
    addAudit({
      at: now,
      actor,
      action: "CANDIDATE_CREATED",
      entityId: newCandidate.id,
      details: { status: "APPLIED" },
    });
    showToast?.("Application created");
    setForm(emptyForm);
    setCvMeta(null);
    setShowNew(false);
  };

  const qualifiedCount = (atsCandidates || []).filter(
    (c) => c?.screening?.recruiterShortlisted,
  ).length;

  const parseResume = (text) => {
    const t = String(text || "").replace(/\r/g, "\n");
    const lines = t
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const top = lines.slice(0, 6).join("\n");

    const email =
      (t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || "";
    const phone =
      (t.match(/(\+?\d[\d\s\-().]{8,}\d)/) || [])[0]
        ?.replace(/\s+/g, " ")
        .trim() || "";

    const years = (() => {
      const m = t.match(/(\d{1,2})\s*\+?\s*(years|yrs)\b/i);
      if (!m) return "";
      return m[1];
    })();

    const position =
      (t.match(/(position|role|title)\s*[:\-]\s*(.+)/i) || [])[2]?.trim() ||
      (t.match(
        /\b(frontend|backend|full[-\s]?stack|designer|hr|accountant)\b/i,
      ) || [])[0] ||
      "";

    const knownSkills = [
      "react",
      "typescript",
      "javascript",
      "tailwind",
      "node",
      "node.js",
      "express",
      "postgres",
      "postgresql",
      "mysql",
      "figma",
      "ux",
      "ui",
      "recruitment",
      "onboarding",
      "hr ops",
    ];
    const skills = knownSkills
      .filter((s) => t.toLowerCase().includes(s))
      .map((s) => (s === "node.js" ? "Node.js" : s));
    const uniqSkills = [...new Set(skills.map((s) => s.toLowerCase()))].map(
      (s) => (s === "react" ? "React" : s),
    );

    const nameGuess = lines[0] && lines[0].length <= 40 ? lines[0] : "";

    return {
      email,
      phone,
      years,
      position,
      nameGuess,
      skillsCsv: uniqSkills.join(", "),
      resumeText: top,
    };
  };

  const handleCvUpload = async (file) => {
    if (!file) return;
    setCvMeta({ name: file.name, type: file.type, size: file.size });

    // Best-effort client parsing:
    // - If it's text, we parse content.
    // - For PDF/DOCX, show a hint (needs backend service) but keep file metadata.
    const isText =
      file.type?.startsWith("text/") ||
      file.name.toLowerCase().endsWith(".txt");
    if (!isText) {
      showToast?.(
        "CV uploaded. Auto-parse works for .txt here; PDF/DOCX parsing usually needs backend service.",
      );
      return;
    }

    setParsing(true);
    try {
      const content = await file.text();
      const parsed = parseResume(content);
      setForm((p) => ({
        ...p,
        fullName: p.fullName || parsed.nameGuess || p.fullName,
        email: p.email || parsed.email || p.email,
        phone: p.phone || parsed.phone || p.phone,
        position: p.position || parsed.position || p.position,
        experienceYears: p.experienceYears || parsed.years || p.experienceYears,
        skillsCsv: p.skillsCsv || parsed.skillsCsv || p.skillsCsv,
        resumeText: p.resumeText || content.slice(0, 4000),
      }));
      showToast?.("CV parsed and fields auto-populated");
    } catch {
      showToast?.("Could not parse CV text");
    } finally {
      setParsing(false);
    }
  };

  const newApplicationModal = (
    <div className="card-base w-full max-w-xl border border-border p-4 max-h-[85dvh] overflow-auto">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">New application</p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Creates candidate + sets status to APPLIED
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => setShowNew(false)}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={createCandidate} className="space-y-3">
        <div className="rounded-xl border border-border p-3 bg-surface/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileUp size={14} className="text-slate-500" />
              <p className="text-xs font-semibold text-slate-200">Upload CV</p>
              <span className="text-[11px] text-slate-600">
                (auto-populates best-effort)
              </span>
            </div>
            {parsing && (
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                <Sparkles size={12} />
                Parsing…
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleCvUpload(e.target.files?.[0])}
              className="input py-2"
            />
            {cvMeta?.name && (
              <div className="text-[11px] text-slate-600 truncate">
                {cvMeta.name} ({Math.round((cvMeta.size || 0) / 1024)} KB)
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Full name
            </label>
            <input
              value={form.fullName}
              onChange={(e) =>
                setForm((p) => ({ ...p, fullName: e.target.value }))
              }
              className="mt-1 w-full input"
              placeholder="e.g. Maria Ali"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 w-full input"
              placeholder="e.g. maria@gmail.com"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              className="mt-1 w-full input"
              placeholder="+92 ..."
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Position
            </label>
            <input
              value={form.position}
              onChange={(e) =>
                setForm((p) => ({ ...p, position: e.target.value }))
              }
              className="mt-1 w-full input"
              placeholder="Frontend Engineer"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Source
            </label>
            <select
              value={form.source}
              onChange={(e) =>
                setForm((p) => ({ ...p, source: e.target.value }))
              }
              className="mt-1 w-full input"
            >
              <option>LinkedIn</option>
              <option>Indeed</option>
              <option>Referral</option>
              <option>Career Page</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">
              Experience (years)
            </label>
            <input
              value={form.experienceYears}
              onChange={(e) =>
                setForm((p) => ({ ...p, experienceYears: e.target.value }))
              }
              className="mt-1 w-full input"
              placeholder="e.g. 3"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">
            Skills (comma separated)
          </label>
          <input
            value={form.skillsCsv}
            onChange={(e) =>
              setForm((p) => ({ ...p, skillsCsv: e.target.value }))
            }
            className="mt-1 w-full input"
            placeholder="React, TypeScript, Tailwind"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-500">
            Resume text (for parsing later)
          </label>
          <textarea
            rows={3}
            value={form.resumeText}
            onChange={(e) =>
              setForm((p) => ({ ...p, resumeText: e.target.value }))
            }
            className="mt-1 w-full input"
            placeholder="Paste resume text…"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn-ghost w-auto p-5"
            onClick={() => setShowNew(false)}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );

  useEffect(() => {
    if (!showNew) {
      closeModal();
      return;
    }
    openModal(newApplicationModal, { onClose: () => setShowNew(false) });
    return () => closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNew]);

  return (
    <div className="animate-fade-slide space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="page-title">
            <span className="text-accent font-bold">ATS</span>{" "}
            <span className="text-white font-bold">Applications</span>
          </h2>
          <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
            Pipeline visibility (Applied → Screening → Interview → Offer).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent text-black text-xs font-bold hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            New Application
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card-base p-3 flex items-center gap-2 border border-border">
          <Search size={14} className="text-slate-600 shrink-0" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search candidates, skills, position, source…"
            className="bg-transparent text-xs text-slate-300 placeholder-slate-500 outline-none flex-1 min-w-0"
          />
          {filterText && (
            <button
              className="btn-ghost"
              onClick={() => setFilterText("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setOnlyQualified((v) => !v)}
          className={`card-base p-3 flex items-center justify-between gap-3 border transition-colors ${
            onlyQualified ? "border-emerald/30 bg-emerald/5" : "border-border"
          }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck
              size={14}
              className={onlyQualified ? "text-emerald" : "text-slate-500"}
            />
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-200">
                Qualified only
              </p>
              <p className="text-[11px] text-slate-600">
                Recruiter shortlisted
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald/10 text-emerald border border-emerald/20">
            {qualifiedCount}
          </span>
        </button>

        <div className="card-base p-3 border border-border">
          <p className="text-xs font-semibold text-slate-200">Audit events</p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {atsAuditLogs?.length || 0} total (latest first)
          </p>
        </div>
      </div>

      <KanbanBoard
        candidates={atsCandidates}
        filterText={filterText}
        onlyQualified={onlyQualified}
        statuses={ATS_PIPELINE_STATUSES.filter((s) =>
          ["APPLIED", "SCREENING", "INTERVIEW", "OFFER"].includes(s.key),
        )}
        onMoveCandidate={moveCandidate}
        onOpenCandidate={(c) => showToast?.(`Open candidate: ${c.fullName}`)}
      />
    </div>
  );
};

export default Applications;
