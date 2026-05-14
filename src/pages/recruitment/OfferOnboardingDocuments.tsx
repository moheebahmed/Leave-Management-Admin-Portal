import { useCallback, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Download,
  FileImage,
  FileText,
  FileType2,
  FolderOpen,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useApp } from "../../layouts/DashboardLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ats/SearchableSelect";

type MainSub = "offer" | "onboarding" | "documents";
type OfferStatus = "Pending" | "Sent" | "Accepted" | "Declined";
type TaskStatus = "Pending" | "Done";

type OfferEvent = { id: string; label: string; at: string; detail: string };
type OfferCard = {
  id: string;
  name: string;
  role: string;
  salary: string;
  startDate: string;
  benefits: string[];
  status: OfferStatus;
  history: OfferEvent[];
};

type Task = {
  id: string;
  title: string;
  assignee: string;
  due: string;
  status: TaskStatus;
};

type OnboardProfile = {
  id: string;
  name: string;
  role: string;
  pre: Task[];
  onb: Task[];
};

export type DocumentTypeOption =
  | "CV"
  | "Offer Letter"
  | "NDA"
  | "Contract"
  | "ID Proof"
  | "Certificate"
  | "Other";

type DocItem = {
  id: string;
  name: string;
  docType: DocumentTypeOption;
  customLabel?: string;
  uploadedAt: string;
  by: string;
  sizeBytes: number;
  mime: string;
  objectUrl: string;
};

const DEFAULT_BENEFITS = ["Health Insurance", "Annual Bonus", "Remote Work", "Paid Leave"];

const MOCK_OFFERS: OfferCard[] = [
  {
    id: "O1",
    name: "Ayesha Khan",
    role: "Frontend Developer",
    salary: "PKR 450,000 / month",
    startDate: "2026-06-01",
    benefits: [...DEFAULT_BENEFITS],
    status: "Sent",
    history: [
      { id: "h1", label: "1st offer", at: "2026-05-01", detail: "Base + standard benefits" },
      { id: "h2", label: "Revision", at: "2026-05-03", detail: "Start date adjusted" },
    ],
  },
  {
    id: "O2",
    name: "John Doe",
    role: "Backend Developer",
    salary: "PKR 520,000 / month",
    startDate: "2026-06-15",
    benefits: ["Health Insurance", "Learning budget"],
    status: "Declined",
    history: [{ id: "h1", label: "1st offer", at: "2026-05-02", detail: "Initial terms" }],
  },
  {
    id: "O3",
    name: "Sana Iqbal",
    role: "Product Designer",
    salary: "PKR 380,000 / month",
    startDate: "2026-06-10",
    benefits: ["Health Insurance", "WFH allowance"],
    status: "Accepted",
    history: [{ id: "h1", label: "Accepted offer", at: "2026-05-08", detail: "Signed digitally" }],
  },
];

const MOCK_ONBOARD: OnboardProfile[] = [
  {
    id: "ON1",
    name: "Sana Iqbal",
    role: "Product Designer",
    pre: [
      { id: "t1", title: "Send welcome email", assignee: "HR", due: "2026-05-12", status: "Done" },
      { id: "t2", title: "IT setup request (laptop + accounts)", assignee: "IT", due: "2026-05-14", status: "Pending" },
      { id: "t3", title: "Access provisioning (Slack, Git)", assignee: "IT", due: "2026-05-15", status: "Pending" },
    ],
    onb: [
      { id: "t4", title: "Day 1 schedule", assignee: "Manager", due: "2026-06-10", status: "Pending" },
      { id: "t5", title: "Team introduction", assignee: "HR", due: "2026-06-10", status: "Pending" },
      { id: "t6", title: "Training plan — design system", assignee: "Lead", due: "2026-06-17", status: "Pending" },
    ],
  },
  {
    id: "ON2",
    name: "Ayesha Khan",
    role: "Frontend Developer",
    pre: [
      { id: "p1", title: "Send welcome email", assignee: "HR", due: "2026-05-11", status: "Pending" },
      { id: "p2", title: "IT setup request", assignee: "IT", due: "2026-05-13", status: "Pending" },
    ],
    onb: [{ id: "p3", title: "Day 1 schedule", assignee: "Manager", due: "2026-06-01", status: "Pending" }],
  },
];

function seedDoc(profileId: string): DocItem[] {
  if (profileId !== "ON1") return [];
  const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  return [
    {
      id: "d1",
      name: "Sana_Iqbal_CV.pdf",
      docType: "CV",
      uploadedAt: new Date("2026-04-10").toISOString(),
      by: "Candidate",
      sizeBytes: 245_760,
      mime: "application/pdf",
      objectUrl: pdfUrl,
    },
  ];
}

const MOCK_DOCS: Record<string, DocItem[]> = {
  ON1: seedDoc("ON1"),
  ON2: [],
};

const DOC_TYPE_OPTIONS: SearchableSelectOption[] = (
  ["CV", "Offer Letter", "NDA", "Contract", "ID Proof", "Certificate", "Other"] as DocumentTypeOption[]
).map((x) => ({ value: x, label: x }));

function progress(tasks: Task[]) {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "Done").length;
  return Math.round((done / tasks.length) * 100);
}

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeKind(m: string, name: string) {
  const lower = name.toLowerCase();
  if (m.includes("pdf") || lower.endsWith(".pdf")) return "pdf" as const;
  if (m.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(lower)) return "image" as const;
  if (/\.(doc|docx)$/i.test(lower) || m.includes("word")) return "doc" as const;
  return "other" as const;
}

export default function OfferOnboardingDocuments() {
  const { showToast } = useApp();
  const [sub, setSub] = useState<MainSub>("offer");
  const [offers, setOffers] = useState<OfferCard[]>(MOCK_OFFERS);
  const [onboard, setOnboard] = useState<OnboardProfile[]>(MOCK_ONBOARD);
  const [docs, setDocs] = useState<Record<string, DocItem[]>>(MOCK_DOCS);

  const [benefitsEditId, setBenefitsEditId] = useState<string | null>(null);

  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [offerTargetId, setOfferTargetId] = useState<string | null>(null);
  const [letterSalary, setLetterSalary] = useState("");
  const [letterStart, setLetterStart] = useState("");
  const [letterNotes, setLetterNotes] = useState("");

  const [uploadTargetProfile, setUploadTargetProfile] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<DocumentTypeOption>("CV");
  const [uploadCustom, setUploadCustom] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadBusy, setUploadBusy] = useState(false);

  const [preview, setPreview] = useState<DocItem | null>(null);

  const acceptedToOnboard = useMemo(() => offers.filter((o) => o.status === "Accepted").map((o) => o.name), [offers]);

  const openOfferForm = (id: string) => {
    const o = offers.find((x) => x.id === id);
    setOfferTargetId(id);
    setLetterSalary(o?.salary || "");
    setLetterStart(o?.startDate || "");
    setLetterNotes("");
    setOfferFormOpen(true);
  };

  const sendOffer = () => {
    if (!offerTargetId) return;
    setOffers((prev) =>
      prev.map((o) =>
        o.id === offerTargetId
          ? {
              ...o,
              status: "Sent",
              salary: letterSalary || o.salary,
              startDate: letterStart || o.startDate,
              history: [
                { id: `h-${Date.now()}`, label: "Offer sent", at: new Date().toISOString().slice(0, 10), detail: letterNotes || "Updated terms" },
                ...o.history,
              ],
            }
          : o,
      ),
    );
    showToast?.("Offer letter sent");
    setOfferFormOpen(false);
    setOfferTargetId(null);
  };

  const acceptOffer = (o: OfferCard) => {
    setOffers((prev) =>
      prev.map((x) =>
        x.id === o.id
          ? {
              ...x,
              status: "Accepted",
              history: [
                {
                  id: `h-${Date.now()}`,
                  label: "Offer accepted",
                  at: new Date().toISOString().slice(0, 10),
                  detail: "Candidate signed / confirmed",
                },
                ...x.history,
              ],
            }
          : x,
      ),
    );
    setOnboard((prev) => {
      if (prev.some((p) => p.name === o.name)) return prev;
      const newProfile: OnboardProfile = {
        id: `ON-${Date.now()}`,
        name: o.name,
        role: o.role,
        pre: [
          { id: `t-${Date.now()}-1`, title: "Send welcome email", assignee: "HR", due: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), status: "Pending" },
          { id: `t-${Date.now()}-2`, title: "IT setup request", assignee: "IT", due: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), status: "Pending" },
          { id: `t-${Date.now()}-3`, title: "Access provisioning", assignee: "IT", due: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10), status: "Pending" },
        ],
        onb: [
          { id: `t-${Date.now()}-4`, title: "Day 1 schedule", assignee: "Manager", due: o.startDate, status: "Pending" },
          { id: `t-${Date.now()}-5`, title: "Team intro", assignee: "HR", due: o.startDate, status: "Pending" },
          { id: `t-${Date.now()}-6`, title: "Training plan", assignee: "Lead", due: o.startDate, status: "Pending" },
        ],
      };
      setDocs((d) => ({ ...d, [newProfile.id]: [] }));
      return [...prev, newProfile];
    });
    showToast?.(`${o.name} moved to onboarding`);
  };

  const sendCounter = (id: string) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "Sent",
              history: [
                {
                  id: `h-${Date.now()}`,
                  label: "Counter offer",
                  at: new Date().toISOString().slice(0, 10),
                  detail: "Revised salary & benefits",
                },
                ...o.history,
              ],
            }
          : o,
      ),
    );
    showToast?.("Counter offer sent");
  };

  const toggleTask = (profileId: string, phase: "pre" | "onb", taskId: string) => {
    setOnboard((prev) =>
      prev.map((p) => {
        if (p.id !== profileId) return p;
        const key = phase;
        return {
          ...p,
          [key]: p[key].map((t) => (t.id === taskId ? { ...t, status: t.status === "Done" ? "Pending" : "Done" } : t)),
        };
      }),
    );
    showToast?.("Task updated");
  };

  const simulateUpload = useCallback(async (profileId: string, file: File, docType: DocumentTypeOption, customLabel?: string) => {
    if (docType === "Other" && !customLabel?.trim()) {
      showToast?.("Please enter a custom document label", "error");
      return;
    }
    setUploadTargetProfile(profileId);
    setUploadBusy(true);
    setUploadProgress(0);
    for (let p = 10; p <= 100; p += 10) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 120));
      setUploadProgress(p);
    }
    const objectUrl = URL.createObjectURL(file);
    const item: DocItem = {
      id: `doc-${Date.now()}`,
      name: file.name,
      docType,
      customLabel: docType === "Other" ? customLabel?.trim() : undefined,
      uploadedAt: new Date().toISOString(),
      by: "You",
      sizeBytes: file.size,
      mime: file.type || "application/octet-stream",
      objectUrl,
    };
    setDocs((prev) => ({ ...prev, [profileId]: [...(prev[profileId] || []), item] }));
    setUploadBusy(false);
    setUploadProgress(0);
    setUploadTargetProfile(null);
    showToast?.("Document uploaded");
  }, [showToast]);

  const removeDoc = (profileId: string, docId: string) => {
    setDocs((prev) => {
      const list = prev[profileId] || [];
      const found = list.find((d) => d.id === docId);
      if (found?.objectUrl?.startsWith("blob:")) URL.revokeObjectURL(found.objectUrl);
      return { ...prev, [profileId]: list.filter((d) => d.id !== docId) };
    });
    showToast?.("Document removed");
  };

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">Recruitment</span>{" "}
          <span className="text-white font-bold">Offer, Onboarding &amp; Documents</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">Manage offers, onboarding checklists, and candidate documents.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            { id: "offer" as const, label: "Offer", icon: Send },
            { id: "onboarding" as const, label: "Pre-Onboarding & Onboarding", icon: Users },
            { id: "documents" as const, label: "Documents", icon: FolderOpen },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSub(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                sub === t.id ? "bg-accent/15 text-accent border-accent/30" : "bg-surface/60 text-slate-400 border-border hover:bg-card-hover"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {sub === "offer" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offers.map((o) => {
            const editing = benefitsEditId === o.id;
            return (
              <div key={o.id} className="card-base p-5 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-100">{o.name}</h3>
                    <p className="text-sm text-slate-400">{o.role}</p>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${
                      o.status === "Accepted"
                        ? "bg-emerald/10 text-emerald border-emerald/20"
                        : o.status === "Declined"
                          ? "bg-danger/10 text-danger border-danger/20"
                          : o.status === "Sent"
                            ? "bg-cyan/10 text-cyan border-cyan/20"
                            : "bg-amber/10 text-amber border-amber/20"
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <p>
                    <span className="text-slate-500">Salary:</span> <span className="text-slate-200">{o.salary}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Start:</span> <span className="text-slate-200">{o.startDate}</span>
                  </p>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-surface/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-300">Benefits</p>
                    <button
                      type="button"
                      className="btn-ghost !h-8 !w-8"
                      title={editing ? "Done" : "Edit benefits"}
                      onClick={() => setBenefitsEditId(editing ? null : o.id)}
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {o.benefits.length === 0 ? <p className="text-xs text-slate-500">No benefits listed.</p> : null}
                    {o.benefits.map((b, idx) => (
                      <div key={`${o.id}-b-${idx}`} className="flex items-center gap-2">
                        {editing ? (
                          <>
                            <Input
                              className="h-9 flex-1"
                              value={b}
                              onChange={(e) => {
                                const v = e.target.value;
                                setOffers((prev) =>
                                  prev.map((x) => (x.id === o.id ? { ...x, benefits: x.benefits.map((bb, i) => (i === idx ? v : bb)) } : x)),
                                );
                              }}
                              onBlur={(e) => {
                                const v = e.target.value.trim();
                                setOffers((prev) => {
                                  const cur = prev.find((x) => x.id === o.id);
                                  if (!cur) return prev;
                                  const next = cur.benefits.map((bb, i) => (i === idx ? v : bb));
                                  return prev.map((x) => (x.id === o.id ? { ...x, benefits: next } : x));
                                });
                                showToast?.("Benefits saved");
                              }}
                            />
                            <button
                              type="button"
                              className="btn-ghost !h-9 !w-9 hover:!text-danger"
                              onClick={() => {
                                setOffers((prev) =>
                                  prev.map((x) => {
                                    if (x.id !== o.id) return x;
                                    const next = x.benefits.filter((_, i) => i !== idx);
                                    return { ...x, benefits: next };
                                  }),
                                );
                                showToast?.("Benefits saved");
                              }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-slate-200">• {b}</span>
                        )}
                      </div>
                    ))}
                    {editing ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setOffers((prev) => prev.map((x) => (x.id === o.id ? { ...x, benefits: [...x.benefits, ""] } : x)));
                        }}
                      >
                        <Plus size={14} />
                        Add Benefit
                      </Button>
                    ) : null}
                  </div>
                </div>

                {o.status === "Accepted" && <p className="mt-2 text-xs text-emerald">Candidate added to onboarding queue ({o.name}).</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary text-xs py-1.5" onClick={() => openOfferForm(o.id)}>
                    <Send size={12} />
                    Send Offer
                  </button>
                  {o.status === "Sent" && (
                    <button type="button" className="btn-outline text-xs py-1.5 border-emerald/30 text-emerald hover:bg-emerald/10" onClick={() => acceptOffer(o)}>
                      Mark accepted → Onboarding
                    </button>
                  )}
                  {o.status === "Declined" && (
                    <button type="button" className="btn-outline text-xs py-1.5" onClick={() => sendCounter(o.id)}>
                      Send Counter Offer
                    </button>
                  )}
                  {o.status === "Accepted" && <span className="text-xs text-slate-500 self-center">View progress in Onboarding tab →</span>}
                </div>
                <div className="mt-4 border-t border-border pt-3">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Offer history</p>
                  <ul className="space-y-2">
                    {o.history.map((h) => (
                      <li key={h.id} className="text-xs border-l-2 border-accent/40 pl-3 py-1">
                        <span className="text-slate-300 font-semibold">{h.label}</span>
                        <span className="text-slate-500"> · {h.at}</span>
                        <p className="text-slate-500">{h.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sub === "onboarding" && (
        <div className="space-y-4">
          {acceptedToOnboard.length > 0 && (
            <p className="text-xs text-slate-500">
              Candidates with accepted offers: <span className="text-slate-300">{acceptedToOnboard.join(", ")}</span>
            </p>
          )}
          {onboard.map((p) => {
            const all = [...p.pre, ...p.onb];
            const pct = progress(all);
            return (
              <div key={p.id} className="card-base p-5 border border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-100">{p.name}</h3>
                    <p className="text-sm text-slate-400">{p.role}</p>
                  </div>
                  <div className="w-full sm:max-w-xs">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Onboarding completion</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Pre-Onboarding</p>
                    <ul className="space-y-2">
                      {p.pre.map((t) => (
                        <li key={t.id} className="flex items-start gap-2 text-sm">
                          <button type="button" className="mt-0.5 text-slate-500 hover:text-accent" onClick={() => toggleTask(p.id, "pre", t.id)}>
                            {t.status === "Done" ? <CheckCircle2 size={16} className="text-emerald" /> : <Circle size={16} />}
                          </button>
                          <div className="flex-1">
                            <p className="text-slate-200">{t.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {t.assignee} · Due {t.due} · <span className="capitalize">{t.status}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase mb-2">Onboarding</p>
                    <ul className="space-y-2">
                      {p.onb.map((t) => (
                        <li key={t.id} className="flex items-start gap-2 text-sm">
                          <button type="button" className="mt-0.5 text-slate-500 hover:text-accent" onClick={() => toggleTask(p.id, "onb", t.id)}>
                            {t.status === "Done" ? <CheckCircle2 size={16} className="text-emerald" /> : <Circle size={16} />}
                          </button>
                          <div className="flex-1">
                            <p className="text-slate-200">{t.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {t.assignee} · Due {t.due} · <span className="capitalize">{t.status}</span>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sub === "documents" && (
        <div className="space-y-6">
          {onboard.map((p) => {
            const list = docs[p.id] || [];
            return (
              <div key={p.id} className="card-base p-5 border border-border">
                <h3 className="font-semibold text-slate-100 mb-1">{p.name}</h3>
                <p className="text-sm text-slate-400 mb-4">{p.role}</p>

                <div
                  className="rounded-xl border border-dashed border-border bg-surface/50 p-4"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = Array.from(e.dataTransfer.files || [])[0];
                    if (f) void simulateUpload(p.id, f, uploadType, uploadCustom);
                  }}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="flex-1">
                      <Label>Document type</Label>
                      <div className="mt-1">
                        <SearchableSelect value={uploadType} onChange={(v) => setUploadType(v as DocumentTypeOption)} options={DOC_TYPE_OPTIONS} placeholder="Select type" />
                      </div>
                      {uploadType === "Other" ? (
                        <div className="mt-2">
                          <Label>Custom label</Label>
                          <Input className="mt-1 h-9" value={uploadCustom} onChange={(e) => setUploadCustom(e.target.value)} placeholder="e.g. Background check" />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <Label>Upload</Label>
                      <label
                        className={cn(
                          "mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-surface/60 px-4 py-6 text-center hover:bg-card-hover",
                          uploadBusy && "pointer-events-none opacity-60",
                        )}
                      >
                        <Upload className="mb-2 h-6 w-6 text-slate-500" />
                        <p className="text-xs font-semibold text-slate-200">Drag &amp; drop files here</p>
                        <p className="mt-1 text-[11px] text-slate-500">PDF, DOC, DOCX, PNG, JPG</p>
                        <input
                          id={`file-upload-${p.id}`}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                          disabled={uploadBusy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void simulateUpload(p.id, f, uploadType, uploadCustom);
                            e.target.value = "";
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={uploadBusy} onClick={(e) => (e.currentTarget.previousElementSibling as HTMLInputElement | null)?.click()}>
                          Browse Files
                        </Button>
                      </label>
                      {uploadBusy && uploadTargetProfile === p.id ? (
                        <div className="mt-2">
                          <div className="h-2 overflow-hidden rounded-full bg-border">
                            <div className="h-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">Uploading… {uploadProgress}%</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-border bg-surface/30 px-6 py-14 text-center">
                    <FolderOpen className="h-12 w-12 text-slate-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-200">No documents uploaded yet</p>
                    <p className="mt-1 text-xs text-slate-500">Upload CVs, contracts, and proofs from the area above.</p>
                    <Button
                      type="button"
                      className="mt-5"
                      onClick={() => {
                        const el = document.getElementById(`file-upload-${p.id}`) as HTMLInputElement | null;
                        el?.click();
                      }}
                    >
                      <Upload size={14} />
                      Upload document
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[980px]">
                      <thead>
                        <tr className="bg-surface">
                          <th className="table-th">File</th>
                          <th className="table-th">Type</th>
                          <th className="table-th">Upload date</th>
                          <th className="table-th">Uploaded by</th>
                          <th className="table-th">Size</th>
                          <th className="table-th text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((d) => (
                          <tr key={d.id} className="table-row-hover">
                            <td className="table-td">
                              <button type="button" className="flex items-center gap-2 text-left text-accent hover:underline" onClick={() => setPreview(d)}>
                                {mimeKind(d.mime, d.name) === "pdf" ? (
                                  <FileText size={14} className="text-slate-500 shrink-0" />
                                ) : mimeKind(d.mime, d.name) === "image" ? (
                                  <FileImage size={14} className="text-slate-500 shrink-0" />
                                ) : (
                                  <FileType2 size={14} className="text-slate-500 shrink-0" />
                                )}
                                {d.name}
                              </button>
                            </td>
                            <td className="table-td">
                              <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-slate-300">
                                {d.docType === "Other" && d.customLabel ? d.customLabel : d.docType}
                              </span>
                            </td>
                            <td className="table-td text-slate-400 text-sm">{new Date(d.uploadedAt).toLocaleString()}</td>
                            <td className="table-td text-slate-400 text-sm">{d.by}</td>
                            <td className="table-td text-slate-400 text-sm">{fmtBytes(d.sizeBytes)}</td>
                            <td className="table-td text-right">
                              <div className="flex justify-end gap-2">
                                <button type="button" className="btn-ghost !w-8 !h-8" title="Preview" onClick={() => setPreview(d)}>
                                  <FileText size={13} />
                                </button>
                                <a className="btn-ghost !w-8 !h-8 inline-flex items-center justify-center" href={d.objectUrl} download={d.name} title="Download">
                                  <Download size={13} />
                                </a>
                                <button type="button" className="btn-ghost !w-8 !h-8 hover:!text-danger" title="Delete" onClick={() => removeDoc(p.id, d.id)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className={cn("max-w-5xl w-[calc(100vw-2rem)] p-0", mimeKind(preview?.mime || "", preview?.name || "") === "image" && "max-w-4xl")} hideClose>
          <DialogHeader className="pr-4 flex-row items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-base">{preview?.name}</DialogTitle>
              <p className="text-xs text-slate-500">{preview ? `${preview.docType}${preview.customLabel ? ` — ${preview.customLabel}` : ""}` : ""}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setPreview(null)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <DialogBody className="p-0" style={{ height: "85vh" }}>
            {!preview ? null : mimeKind(preview.mime, preview.name) === "pdf" ? (
              <iframe title="Preview" src={preview.objectUrl} className="h-full w-full border-0 bg-surface" />
            ) : mimeKind(preview.mime, preview.name) === "image" ? (
              <div className="flex h-full items-center justify-center bg-black/40 p-4">
                <img src={preview.objectUrl} alt={preview.name} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <FileType2 className="h-10 w-10 text-slate-500" />
                <p className="text-sm text-slate-200 font-semibold">Download to view</p>
                <p className="text-xs text-slate-500 max-w-md">Word documents can&apos;t be previewed in-browser here. Download the file to open it locally.</p>
                <Button asChild>
                  <a href={preview.objectUrl} download={preview.name}>
                    Download
                  </a>
                </Button>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPreview(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {offerFormOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOfferFormOpen(false)}>
          <div className="card-base w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="section-title mb-4">Offer letter</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Salary</label>
                <input className="input mt-1" value={letterSalary} onChange={(e) => setLetterSalary(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Start date</label>
                <input type="date" className="input mt-1" value={letterStart} onChange={(e) => setLetterStart(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500">Notes</label>
                <textarea className="input mt-1 min-h-[80px]" value={letterNotes} onChange={(e) => setLetterNotes(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button type="button" className="btn-outline" onClick={() => setOfferFormOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={sendOffer}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
