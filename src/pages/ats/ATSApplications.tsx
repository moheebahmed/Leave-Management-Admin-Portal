import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  Eye,
  FileText,
  LayoutGrid,
  LayoutList,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { useApp } from "../../layouts/DashboardLayout";
import { ResumePdfDialog } from "@/components/ats/ResumePdfDialog";
import { SkillsMultiSelect } from "@/components/ats/SkillsMultiSelect";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface Application {
  id: string;
  position: string;
  jobDescription: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  source: "LinkedIn" | "Indeed" | "Referral" | "Job Board" | "Other";
  skills: string[];
  resumeText: string;
  coverLetter?: string;
  notes?: string;
  resumeUrl: string;
  resumeFile?: File;
  appliedDate: string;
  status: "New" | "Reviewed" | "Interview" | "Hired" | "Rejected";
}

type ViewMode = "grid" | "table" | "group";
type DateRange = { from: Date | null; to: Date | null };
type Step1Form = { position: string; jobDescription: string };

type CvRow = {
  tempId: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  source: Application["source"];
  skills: string[];
  resumeText: string;
  coverLetter?: string;
  notes?: string;
  resumeUrl: string;
  resumeFile?: File;
};

const POSITIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack",
  "Designer",
  "DevOps",
  "QA Engineer",
  "Product Manager",
];

const SOURCES: Application["source"][] = ["LinkedIn", "Indeed", "Referral", "Job Board", "Other"];
const STATUS: Application["status"][] = ["New", "Reviewed", "Interview", "Hired", "Rejected"];

const statusClass: Record<Application["status"], string> = {
  New: "bg-cyan/10 text-cyan border-cyan/20",
  Reviewed: "bg-amber/10 text-amber border-amber/20",
  Interview: "bg-purple/10 text-purple border-purple/20",
  Hired: "bg-emerald/10 text-emerald border-emerald/20",
  Rejected: "bg-danger/10 text-danger border-danger/20",
};

const mockData: Application[] = [
  {
    id: "APP-1001",
    position: "Frontend Developer",
    jobDescription: "Own dashboard UX and component quality.",
    name: "Ayesha Khan",
    email: "ayesha.khan@email.com",
    phone: "+92 300 123 4567",
    experience: "3 years",
    source: "LinkedIn",
    skills: ["React", "TypeScript", "Tailwind", "Jest"],
    resumeText: "Frontend engineer with strong React and design system experience.",
    resumeUrl: "",
    appliedDate: new Date().toISOString(),
    status: "New",
  },
  {
    id: "APP-1002",
    position: "Frontend Developer",
    jobDescription: "Own dashboard UX and component quality.",
    name: "Maria Ali",
    email: "maria.ali@email.com",
    phone: "+92 333 987 1111",
    experience: "4 years",
    source: "Referral",
    skills: ["React", "Node.js", "TypeScript"],
    resumeText: "Full-stack leaning frontend engineer.",
    resumeUrl: "",
    appliedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: "Interview",
  },
  {
    id: "APP-1003",
    position: "Backend Developer",
    jobDescription: "Build secure APIs and optimize DB performance.",
    name: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 202 555 0181",
    experience: "5 years",
    source: "Indeed",
    skills: ["Node.js", "Express", "Postgres", "Docker"],
    resumeText: "Backend engineer focused on APIs and scalable systems.",
    resumeUrl: "",
    appliedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: "Reviewed",
  },
  {
    id: "APP-1004",
    position: "Designer",
    jobDescription: "Design product UX flows and UI components.",
    name: "Sana Iqbal",
    email: "sana.iqbal@email.com",
    phone: "+92 312 000 2222",
    experience: "2 years",
    source: "Job Board",
    skills: ["Figma", "UI", "UX"],
    resumeText: "Product designer with UX and visual design focus.",
    resumeUrl: "",
    appliedDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "Hired",
  },
  {
    id: "APP-1005",
    position: "DevOps",
    jobDescription: "CI/CD pipelines and cloud infrastructure.",
    name: "Bilal Ahmed",
    email: "bilal.ahmed@email.com",
    phone: "+92 301 111 2222",
    experience: "6 years",
    source: "Other",
    skills: ["Docker", "Kubernetes", "AWS"],
    resumeText: "DevOps engineer focused on reliability and scale.",
    resumeUrl: "",
    appliedDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: "Rejected",
  },
  {
    id: "APP-1006",
    position: "QA Engineer",
    jobDescription: "Lead quality automation and release confidence.",
    name: "Hassan Raza",
    email: "hassan.raza@email.com",
    phone: "+92 345 555 3333",
    experience: "3 years",
    source: "LinkedIn",
    skills: ["Testing", "Cypress", "Jest"],
    resumeText: "QA specialist with automation-first approach.",
    resumeUrl: "",
    appliedDate: new Date(Date.now() - 86400000).toISOString(),
    status: "New",
  },
];

const cn = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(" ");
const fmtDate = (value: string) => (value ? new Date(value).toLocaleDateString() : "—");
const lower = (v: unknown) => String(v ?? "").toLowerCase();

const extractFromFile = async (file: File): Promise<CvRow> => {
  const resumeUrl = URL.createObjectURL(file);
  const text = file.type.startsWith("text/") ? await file.text() : "";
  const base = file.name.replace(/\.[^.]+$/, "");
  const [f = "", l = ""] = base.split(/[-_ ]+/);
  const nameGuess = `${f} ${l}`.trim();
  const email = (text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || "";
  const phone = (text.match(/(\+?\d[\d\s\-().]{8,}\d)/) || [])[0] || "";
  const skillSet = ["React", "TypeScript", "JavaScript", "Tailwind", "Node.js", "Express", "Figma", "Docker"].filter((s) =>
    lower(text).includes(lower(s)),
  );
  return {
    tempId: `cv-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: nameGuess || "—",
    email: email || "—",
    phone: phone || "—",
    experience: "—",
    source: "LinkedIn",
    skills: skillSet,
    resumeText: text.slice(0, 1500) || "—",
    resumeUrl,
    resumeFile: file,
  };
};

const CandidateCard = ({
  app,
  totalForPosition,
  indexForPosition,
  showApplicantMeta,
  onOpen,
  onOpenPdf,
}: {
  app: Application;
  totalForPosition: number;
  indexForPosition: number;
  showApplicantMeta: boolean;
  onOpen: () => void;
  onOpenPdf: () => void;
}) => (
  <div className="card-base p-4 hover:bg-card-hover transition-colors">
    <button className="w-full text-left" onClick={onOpen}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-100 text-[15px] truncate">{app.position}</h3>
          {showApplicantMeta && (
            <p className="text-xs text-slate-500 mt-0.5">
              Applicant {indexForPosition} of {totalForPosition} for this position
            </p>
          )}
          <p className="text-sm text-slate-200 mt-1 truncate">{app.name || "—"}</p>
          <p className="text-xs text-slate-500 truncate">{app.email || "—"}</p>
          <p className="text-xs text-slate-500 truncate">{app.phone || "—"}</p>
        </div>
        <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-semibold", statusClass[app.status])}>
          {app.status}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">
          {app.experience || "—"}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">
          {app.source}
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">
          {fmtDate(app.appliedDate)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {app.skills.slice(0, 3).map((s) => (
          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">
            {s}
          </span>
        ))}
        {app.skills.length > 3 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">
            +{app.skills.length - 3} more
          </span>
        )}
      </div>
    </button>
    <div className="pt-3 mt-3 border-t border-border flex justify-end">
      <button
        className="inline-flex items-center mt-3 gap-1 text-xs px-2 py-1 rounded-lg border border-border hover:bg-card-hover text-slate-300"
        onClick={onOpenPdf}
      >
        <FileText size={12} />
        View PDF
      </button>
    </div>
  </div>
);

export default function ATSApplications() {
  const { showToast } = useApp();
  const [applications, setApplications] = useState<Application[]>(mockData);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterDateRange, setFilterDateRange] = useState<DateRange>({ from: null, to: null });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1Form>({ position: "", jobDescription: "" });
  const [uploadedCVs, setUploadedCVs] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [step2Rows, setStep2Rows] = useState<CvRow[]>([]);
  const [step1Errors, setStep1Errors] = useState<{ position?: string; jobDescription?: string }>({});
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>({});
  const [pdfDialog, setPdfDialog] = useState<{
    open: boolean;
    url: string | null;
    candidateName: string;
    fileName?: string;
    onUpload?: (file: File) => void;
  }>({ open: false, url: null, candidateName: "" });
  const urlsRef = useRef<string[]>([]);
  const step1 = useForm<Step1Form>({ defaultValues: { position: "", jobDescription: "" } });

  const openPdfDialog = (
    url: string | null,
    name: string,
    opts?: { fileName?: string; onUpload?: (file: File) => void },
  ) =>
    setPdfDialog({
      open: true,
      url: url && url.trim() ? url : null,
      candidateName: name,
      fileName: opts?.fileName,
      onUpload: opts?.onUpload,
    });
  const closePdfDialog = () => setPdfDialog({ open: false, url: null, candidateName: "", fileName: undefined, onUpload: undefined });

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    setUploadedCVs(
      step2Rows.map((r) => ({
        id: r.tempId,
        position: step1Data.position,
        jobDescription: step1Data.jobDescription,
        name: r.name === "—" ? "" : r.name,
        email: r.email === "—" ? "" : r.email,
        phone: r.phone === "—" ? "" : r.phone,
        experience: r.experience === "—" ? "" : r.experience,
        source: r.source,
        skills: r.skills,
        resumeText: r.resumeText === "—" ? "" : r.resumeText,
        resumeUrl: r.resumeUrl,
        resumeFile: r.resumeFile,
        appliedDate: "",
        status: "New",
      })),
    );
  }, [step2Rows, step1Data]);

  const countsByPosition = useMemo(() => {
    return applications.reduce<Record<string, number>>((acc, app) => {
      acc[app.position] = (acc[app.position] || 0) + 1;
      return acc;
    }, {});
  }, [applications]);

  const positionOptions = useMemo(
    () => ["", ...Array.from(new Set([...POSITIONS, ...applications.map((a) => a.position)]))],
    [applications],
  );

  const filtered = useMemo(() => {
    const q = lower(searchQuery);
    const from = filterDateRange.from ? new Date(filterDateRange.from).getTime() : null;
    const to = filterDateRange.to
      ? new Date(filterDateRange.to.getFullYear(), filterDateRange.to.getMonth(), filterDateRange.to.getDate(), 23, 59, 59, 999).getTime()
      : null;
    return applications.filter((a) => {
      const hitsSearch = !q || [a.name, a.email, a.position].some((x) => lower(x).includes(q));
      const hitsPosition = !filterPosition || a.position === filterPosition;
      const t = new Date(a.appliedDate).getTime();
      const hitsFrom = from === null || t >= from;
      const hitsTo = to === null || t <= to;
      return hitsSearch && hitsPosition && hitsFrom && hitsTo;
    });
  }, [applications, filterDateRange, filterPosition, searchQuery]);

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, Application[]>>((acc, app) => {
      (acc[app.position] ||= []).push(app);
      return acc;
    }, {});
  }, [filtered]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    Object.keys(grouped).forEach((k) => {
      next[k] = groupExpanded[k] ?? true;
    });
    setGroupExpanded(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.length]);

  const hasFilters = !!searchQuery || !!filterPosition || !!filterDateRange.from || !!filterDateRange.to;

  const resetAddModal = () => {
    setAddStep(1);
    setStep1Data({ position: "", jobDescription: "" });
    setStep1Errors({});
    step1.reset({ position: "", jobDescription: "" });
    setUploadedCVs([]);
    setStep2Rows([]);
    setEditingRowId(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    closePdfDialog();
    resetAddModal();
  };

  const validateStep1 = () => {
    const values = step1.getValues();
    const errors: { position?: string; jobDescription?: string } = {};
    if (!values.position?.trim()) errors.position = "Position is required";
    if (!values.jobDescription?.trim()) errors.jobDescription = "Job Description is required";
    setStep1Errors(errors);
    if (Object.keys(errors).length) return false;
    setStep1Data(values);
    return true;
  };

  const handleSaveApplications = () => {
    if (uploadedCVs.length === 0) {
      showToast("Upload at least one CV before saving.");
      return;
    }
    const newApplications: Application[] = uploadedCVs.map((cv) => ({
      ...cv,
      id: crypto.randomUUID(),
      position: step1Data.position,
      jobDescription: step1Data.jobDescription,
      appliedDate: new Date().toISOString(),
      status: "New" as const,
      resumeUrl: cv.resumeUrl || "",
    }));
    setApplications((prev) => [...prev, ...newApplications]);
    showToast(`${newApplications.length} application(s) saved.`);
    setShowAddModal(false);
    setAddStep(1);
    setStep1Data({ position: "", jobDescription: "" });
    setUploadedCVs([]);
    setStep2Rows([]);
    setEditingRowId(null);
    setStep1Errors({});
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this application?")) return;
    setApplications((prev) => prev.filter((a) => a.id !== id));
    if (selectedApplication?.id === id) setSelectedApplication(null);
    showToast("Application deleted.");
  };

  const handleStatusChange = (id: string, status: Application["status"]) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setSelectedApplication((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    showToast(`Status changed to ${status}.`);
  };

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">ATS</span>{' '}
          <span className="text-white font-bold">Applications Management</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Creates candidate + sets status to APPLIED
        </p>
      </div>
      <div className="card-base p-3">
        <div>
          <label className="text-[10px] text-slate-500 font-semibold  tracking-widest">
            Search
          </label>
          <div className="flex items-center gap-2 bg-surface/70 border border-border rounded-lg px-3 py-3">
            <Search size={14} className="text-slate-500" />
            <input
              className="bg-transparent text-md text-slate-200 placeholder-slate-600 outline-none w-full"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <label className="text-[10px] text-slate-500 font-semibold tracking-widest">
                Date From
              </label>
              {/* <Calendar size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /> */}
              <input
                type="date"
                className="input  p-3"
                value={filterDateRange.from ? filterDateRange.from.toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  setFilterDateRange((p) => ({ ...p, from: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null }))
                }
              />
            </div>
            <div className="relative">
              <label className="text-[10px] text-slate-500 font-semibold tracking-widest">
                Date To
              </label>              <input
                type="date"
                className="input  p-3"
                value={filterDateRange.to ? filterDateRange.to.toISOString().slice(0, 10) : ""}
                onChange={(e) =>
                  setFilterDateRange((p) => ({ ...p, to: e.target.value ? new Date(`${e.target.value}T00:00:00`) : null }))
                }
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold tracking-widest">
                Position
              </label>
              <select className="input p-3" value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
                <option value="">All Positions ({applications.length})</option>
                {positionOptions
                  .filter(Boolean)
                  .map((p) => (
                    <option key={p} value={p}>
                      {p} ({countsByPosition[p] || 0})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">

              <button className="btn-primary flex-1 py-3 text-center justify-center" onClick={() => setShowAddModal(true)}>
                <Plus size={14} />
                Add Application
              </button>
              <button
                className={cn("btn-ghost !w-9 !h-9", viewMode === "grid" && "hover:!bg-accent/10 !text-accent !border-accent/30")}
                onClick={() => setViewMode("grid")}
                title="Grid"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                className={cn("btn-ghost !w-9 !h-9", viewMode === "table" && "hover:!bg-accent/10 !text-accent !border-accent/30")}
                onClick={() => setViewMode("table")}
                title="Table"
              >
                <LayoutList size={14} />
              </button>
              <button
                className={cn("btn-ghost !w-9 !h-9", viewMode === "group" && "hover:!bg-accent/10 !text-accent !border-accent/30")}
                onClick={() => setViewMode("group")}
                title="Group"
              >
                <Layers3 size={14} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing {filtered.length} of {applications.length} applications</p>
          {hasFilters && (
            <button
              className="text-xs text-accent hover:text-accent/80 underline"
              onClick={() => {
                setSearchQuery("");
                setFilterPosition("");
                setFilterDateRange({ from: null, to: null });
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-base p-12 text-center">
          <Search className="mx-auto text-slate-500" size={34} />
          <p className="mt-3 text-slate-300 font-semibold">No applications found</p>
          <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
          <button
            className="btn-outline mt-4"
            onClick={() => {
              setSearchQuery("");
              setFilterPosition("");
              setFilterDateRange({ from: null, to: null });
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-3">
          {filtered.map((app) => {
            const allSame = filtered.filter((a) => a.position === app.position);
            const idx = allSame.findIndex((a) => a.id === app.id) + 1;
            return (
              <CandidateCard
                key={app.id}
                app={app}
                totalForPosition={allSame.length}
                indexForPosition={idx}
                showApplicantMeta={!!filterPosition}
                onOpen={() => setSelectedApplication(app)}
                onOpenPdf={() =>
                  openPdfDialog(app.resumeUrl || null, app.name, {
                    fileName: app.resumeFile?.name,
                    onUpload: (file) => {
                      const resumeUrl = URL.createObjectURL(file);
                      urlsRef.current.push(resumeUrl);
                      setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, resumeUrl, resumeFile: file } : a)));
                      setPdfDialog((prev) => ({ ...prev, url: resumeUrl, fileName: file.name }));
                      showToast("Resume uploaded");
                    },
                  })
                }
              />
            );
          })}
        </div>
      ) : viewMode === "group" ? (
        <div className="space-y-3">
          {Object.entries(grouped).map(([position, list]) => {
            const open = groupExpanded[position] ?? true;
            return (
              <div key={position} className="card-base overflow-hidden">
                <button
                  className="w-full px-4 py-3 border-b border-border flex items-center justify-between"
                  onClick={() => setGroupExpanded((p) => ({ ...p, [position]: !open }))}
                >
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-accent" />
                    <span className="font-semibold text-slate-100">{position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-accent/30 text-accent bg-accent/10">
                      {list.length} applicants
                    </span>
                    <ChevronDown size={14} className={cn("transition-transform duration-200", open && "rotate-180")} />
                  </div>
                </button>
                {open && (
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {list.map((app, i) => (
                      <CandidateCard
                        key={app.id}
                        app={app}
                        totalForPosition={list.length}
                        indexForPosition={i + 1}
                        showApplicantMeta={true}
                        onOpen={() => setSelectedApplication(app)}
                        onOpenPdf={() =>
                          openPdfDialog(app.resumeUrl || null, app.name, {
                            fileName: app.resumeFile?.name,
                            onUpload: (file) => {
                              const resumeUrl = URL.createObjectURL(file);
                              urlsRef.current.push(resumeUrl);
                              setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, resumeUrl, resumeFile: file } : a)));
                              setPdfDialog((prev) => ({ ...prev, url: resumeUrl, fileName: file.name }));
                              showToast("Resume uploaded");
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="w-full min-w-[1120px]">
              <thead className="sticky top-0 z-20">
                <tr className="bg-surface">
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Position</th>
                  <th className="table-th">Experience</th>
                  <th className="table-th">Source</th>
                  <th className="table-th">Skills</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Applied Date</th>
                  <th className="table-th sticky right-0 bg-surface text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="table-row-hover">
                    <td className="table-td font-medium">{app.name || <span className="text-slate-500">—</span>}</td>
                    <td className="table-td">{app.email || <span className="text-slate-500">—</span>}</td>
                    <td className="table-td">{app.phone || <span className="text-slate-500">—</span>}</td>
                    <td className="table-td">{app.position || <span className="text-slate-500">—</span>}</td>
                    <td className="table-td">{app.experience || <span className="text-slate-500">—</span>}</td>
                    <td className="table-td">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface/70">{app.source}</span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-1 items-center">
                        {app.skills.slice(0, 2).map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70">
                            {s}
                          </span>
                        ))}
                        {app.skills.length > 2 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70">
                            +{app.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={cn("text-[11px] px-2 py-0.5 rounded-full border", statusClass[app.status])}>{app.status}</span>
                    </td>
                    <td className="table-td">{fmtDate(app.appliedDate)}</td>
                    <td className="table-td sticky right-0 bg-card/95">
                      <div className="flex justify-end gap-2">
                        <button className="btn-ghost" onClick={() => setSelectedApplication(app)} title="View">
                          <Eye size={13} />
                        </button>
                        <button className="btn-ghost" onClick={() => setSelectedApplication(app)} title="Edit">
                          <Pencil size={13} />
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() =>
                            openPdfDialog(app.resumeUrl || null, app.name, {
                              fileName: app.resumeFile?.name,
                              onUpload: (file) => {
                                const resumeUrl = URL.createObjectURL(file);
                                urlsRef.current.push(resumeUrl);
                                setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, resumeUrl, resumeFile: file } : a)));
                                setPdfDialog((prev) => ({ ...prev, url: resumeUrl, fileName: file.name }));
                                showToast("Resume uploaded");
                              },
                            })
                          }
                          title="PDF"
                        >
                          <FileText size={13} />
                        </button>
                        <button className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30" onClick={() => handleDelete(app.id)} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={(o) => !o && closeAddModal()}>
        <DialogContent className="max-w-6xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col p-0">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">{addStep === 1 ? "Step 1 of 2 — Job Details" : "Step 2 of 2 — Upload CVs"}</p>
          </DialogHeader>
          <DialogBody className="p-5">              {addStep === 1 ? (
            <form
              onSubmit={step1.handleSubmit(() => {
                if (validateStep1()) setAddStep(2);
              })}
              className="space-y-4"
            >
              <div>
                <Label className="text-xs text-slate-400">Position</Label>
                <select className="input mt-1" {...step1.register("position")}>
                  <option value="">Select position</option>
                  {positionOptions.filter(Boolean).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                {step1Errors.position && <p className="text-xs text-danger mt-1">{step1Errors.position}</p>}
              </div>

              <div>
                <Label className="text-xs text-slate-400">Job Description</Label>
                <textarea className="input mt-1 min-h-[112px]" {...step1.register("jobDescription")} />
                {step1Errors.jobDescription && <p className="text-xs text-danger mt-1">{step1Errors.jobDescription}</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-outline" onClick={closeAddModal}>
                  Cancel
                </button>
                <button className="btn-primary" type="submit">
                  Next →
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-xl border border-dashed border-border bg-surface/60 p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []).filter((f) => /\.(pdf|doc|docx)$/i.test(f.name));
                  if (!files.length) return;
                  const rows = await Promise.all(files.map(extractFromFile));
                  rows.forEach((r) => urlsRef.current.push(r.resumeUrl));
                  setStep2Rows((p) => [...p, ...rows]);
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-slate-200 font-semibold flex items-center gap-2">
                      <Upload size={14} className="text-accent" />
                      Upload CVs
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Drag & drop PDF/DOC/DOCX files, or click to upload.</p>
                  </div>
                  <label className="btn-outline cursor-pointer">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []).filter((f) => /\.(pdf|doc|docx)$/i.test(f.name));
                        const rows = await Promise.all(files.map(extractFromFile));
                        rows.forEach((r) => urlsRef.current.push(r.resumeUrl));
                        setStep2Rows((p) => [...p, ...rows]);
                        e.target.value = "";
                      }}
                    />
                    <Plus size={13} />
                    Choose files
                  </label>
                </div>
              </div>

              <div className="card-base overflow-hidden">
                <div className="overflow-auto">
                  <table className="w-full min-w-[1100px]">
                    <thead>
                      <tr className="bg-surface">
                        <th className="table-th">Name</th>
                        <th className="table-th">Email</th>
                        <th className="table-th">Phone</th>
                        <th className="table-th">Experience</th>
                        <th className="table-th">Source</th>
                        <th className="table-th">Skills</th>
                        <th className="table-th">Resume Text</th>
                        <th className="table-th text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step2Rows.length === 0 ? (
                        <tr>
                          <td className="table-td text-center text-slate-500" colSpan={8}>
                            Upload files to create rows.
                          </td>
                        </tr>
                      ) : (
                        step2Rows.map((row) => {
                          const editing = editingRowId === row.tempId;
                          return (
                            <React.Fragment key={row.tempId}>
                              <tr className="table-row-hover">
                                <td className="table-td">
                                  {editing ? (
                                    <input className="input py-2" value={row.name === "—" ? "" : row.name} onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, name: e.target.value || "—" } : x)))} />
                                  ) : (
                                    <span className={row.name === "—" ? "text-slate-500" : ""}>{row.name}</span>
                                  )}
                                </td>
                                <td className="table-td">
                                  {editing ? (
                                    <input className="input py-2" value={row.email === "—" ? "" : row.email} onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, email: e.target.value || "—" } : x)))} />
                                  ) : (
                                    <span className={row.email === "—" ? "text-slate-500" : ""}>{row.email}</span>
                                  )}
                                </td>
                                <td className="table-td">
                                  {editing ? (
                                    <input className="input py-2" value={row.phone === "—" ? "" : row.phone} onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, phone: e.target.value || "—" } : x)))} />
                                  ) : (
                                    <span className={row.phone === "—" ? "text-slate-500" : ""}>{row.phone}</span>
                                  )}
                                </td>
                                <td className="table-td">
                                  {editing ? (
                                    <input className="input py-2" value={row.experience === "—" ? "" : row.experience} onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, experience: e.target.value || "—" } : x)))} />
                                  ) : (
                                    <span className={row.experience === "—" ? "text-slate-500" : ""}>{row.experience}</span>
                                  )}
                                </td>
                                <td className="table-td">
                                  {editing ? (
                                    <select className="input py-2" value={row.source} onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, source: e.target.value as Application["source"] } : x)))}>
                                      {SOURCES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface/70">{row.source}</span>
                                  )}
                                </td>
                                <td className="table-td min-w-[300px]">
                                  {editing ? (
                                    <SkillsMultiSelect
                                      value={row.skills}
                                      onChange={(skills) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, skills } : x)))}
                                    />
                                  ) : (
                                    <div className="flex flex-wrap gap-1">
                                      {row.skills.length ? row.skills.slice(0, 3).map((s) => (
                                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70">{s}</span>
                                      )) : <span className="text-slate-500">—</span>}
                                    </div>
                                  )}
                                </td>
                                <td className="table-td">
                                  {editing ? (
                                    <textarea className="input min-h-[70px]" value={row.resumeText === "—" ? "" : row.resumeText} onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, resumeText: e.target.value || "—" } : x)))} />
                                  ) : (
                                    <div className="max-w-[280px] truncate text-slate-400 text-xs">{row.resumeText || "—"}</div>
                                  )}
                                </td>
                                <td className="table-td">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      className="btn-ghost"
                                      onClick={() =>
                                        openPdfDialog(row.resumeUrl || null, row.name, {
                                          fileName: row.resumeFile?.name,
                                          onUpload: (file) => {
                                            const resumeUrl = URL.createObjectURL(file);
                                            urlsRef.current.push(resumeUrl);
                                            setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, resumeUrl, resumeFile: file } : x)));
                                            setPdfDialog((prev) => ({ ...prev, url: resumeUrl, fileName: file.name }));
                                            showToast("Resume attached");
                                          },
                                        })
                                      }
                                      title="PDF"
                                    >
                                      <FileText size={13} />
                                    </button>
                                    <button className="btn-ghost" onClick={() => setEditingRowId((p) => (p === row.tempId ? null : row.tempId))} title="Edit">
                                      <Pencil size={13} />
                                    </button>
                                    <button className="btn-ghost hover:!bg-danger/10 hover:!text-danger hover:!border-danger/30" onClick={() => setStep2Rows((p) => p.filter((x) => x.tempId !== row.tempId))} title="Delete">
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {/* {editing ? (
                                <tr key={`${row.tempId}-meta`} className="bg-surface/40">
                                  <td colSpan={8} className="table-td space-y-3">
                                    <div>
                                      <Label>Cover Letter</Label>
                                      <Textarea
                                        className="mt-1 min-h-[88px]"
                                        placeholder="Paste or write the candidate cover letter…"
                                        value={row.coverLetter ?? ""}
                                        onChange={(e) =>
                                          setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, coverLetter: e.target.value } : x)))
                                        }
                                        rows={3}
                                      />
                                    </div>
                                    <div>
                                      <Label>Notes</Label>
                                      <Textarea
                                        className="mt-1 min-h-[72px]"
                                        placeholder="Internal notes about this application…"
                                        value={row.notes ?? ""}
                                        onChange={(e) => setStep2Rows((p) => p.map((x) => (x.tempId === row.tempId ? { ...x, notes: e.target.value } : x)))}
                                        rows={2}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ) : null} */}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button className="btn-outline" onClick={() => setAddStep(1)}>← Back</button>
                <div className="flex gap-2">
                  <button className="btn-outline" onClick={closeAddModal}>Cancel</button>
                  <button
                    className="btn-primary"
                    onClick={handleSaveApplications}
                    disabled={!step1Data.position || !step1Data.jobDescription}
                  >
                    Save Applications
                  </button>
                </div>
              </div>
            </div>
          )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {selectedApplication && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedApplication(null)}>
          <div className="card-base w-full max-w-3xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-lg">{selectedApplication.position}</h3>
                <p className="text-xs text-slate-500">Application Details</p>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedApplication(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                <tbody>
                  {[
                    ["Name", selectedApplication.name || "—"],
                    ["Email", selectedApplication.email || "—"],
                    ["Phone", selectedApplication.phone || "—"],
                    ["Experience", selectedApplication.experience || "—"],
                    ["Source", selectedApplication.source],
                    ["Applied Date", fmtDate(selectedApplication.appliedDate)],
                  ].map(([label, value], i) => (
                    <tr key={String(label)} className={i % 2 ? "bg-surface/50" : ""}>
                      <td className="px-4 py-3 text-slate-500 text-sm w-[180px]">{label}</td>
                      <td className="px-4 py-3 text-slate-200 text-sm">{value}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-3 text-slate-500 text-sm">Skills</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {selectedApplication.skills.map((s) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">{s}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-500 text-sm">Cover Letter</td>
                    <td className="px-4 py-3">
                      <div className="max-h-24 overflow-auto bg-surface/50 border border-border rounded-lg p-3 text-slate-300 text-sm whitespace-pre-wrap">
                        {selectedApplication.coverLetter || "—"}
                      </div>
                    </td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="px-4 py-3 text-slate-500 text-sm">Notes</td>
                    <td className="px-4 py-3">
                      <div className="max-h-24 overflow-auto bg-surface/50 border border-border rounded-lg p-3 text-slate-300 text-sm whitespace-pre-wrap">
                        {selectedApplication.notes || "—"}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-slate-500 text-sm">Status</td>
                    <td className="px-4 py-3">
                      <select
                        className="input py-2 w-[180px]"
                        value={selectedApplication.status}
                        onChange={(e) => handleStatusChange(selectedApplication.id, e.target.value as Application["status"])}
                      >
                        {STATUS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr className="bg-surface/50">
                    <td className="px-4 py-3 text-slate-500 text-sm">Resume Text</td>
                    <td className="px-4 py-3">
                      <div className="max-h-32 overflow-auto bg-surface/50 border border-border rounded-lg p-3 text-slate-300 text-sm">
                        {selectedApplication.resumeText || "—"}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2">
              <button className="btn-outline">
                <Pencil size={13} />
                Edit
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  selectedApplication &&
                  openPdfDialog(selectedApplication.resumeUrl || null, selectedApplication.name, {
                    fileName: selectedApplication.resumeFile?.name,
                    onUpload: (file) => {
                      const resumeUrl = URL.createObjectURL(file);
                      urlsRef.current.push(resumeUrl);
                      const id = selectedApplication.id;
                      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, resumeUrl, resumeFile: file } : a)));
                      setSelectedApplication((prev) => (prev && prev.id === id ? { ...prev, resumeUrl, resumeFile: file } : prev));
                      setPdfDialog((prev) => ({ ...prev, url: resumeUrl, fileName: file.name }));
                      showToast("Resume uploaded");
                    },
                  })
                }
              >
                <FileText size={13} />
                View Resume PDF
              </button>
              <button className="btn-outline" onClick={() => setSelectedApplication(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ResumePdfDialog
        open={pdfDialog.open}
        onOpenChange={(o) => {
          if (!o) closePdfDialog();
        }}
        candidateName={pdfDialog.candidateName}
        url={pdfDialog.url}
        fileName={pdfDialog.fileName}
        onUpload={(f) => pdfDialog.onUpload?.(f)}
      />
    </div>
  );
}

