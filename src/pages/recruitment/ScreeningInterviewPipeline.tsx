import { useMemo, useState, type ReactNode } from "react";
import { Building2, CalendarClock, Loader2, Monitor, Phone, Search, SlidersHorizontal, Users, Video } from "lucide-react";
import { useApp } from "../../layouts/DashboardLayout";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandGroup, CommandInputWrap, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ats/SearchableSelect";

type ScreenTab = "screening" | "interview";
type ScreeningStatus = "Applied" | "Shortlisted" | "Rejected";
type InterviewStage = "First" | "Second" | "Third";
type InterviewRowStatus = "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
type InterviewType = "In-Person" | "Video Call" | "Phone Call" | "Technical Test" | "Panel Interview";

type ScreeningRow = {
  id: string;
  name: string;
  position: string;
  keywords: string[];
  score: number;
  status: ScreeningStatus;
};

type InterviewRow = {
  id: string;
  name: string;
  position: string;
  stage: InterviewStage;
  hrDate: string;
  interviewer: string;
  status: InterviewRowStatus;
  interviewType: InterviewType;
  comment: string;
};

const POSITIONS = [
  "All positions",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack",
  "Product Designer",
  "QA Engineer",
];

const INTERVIEWERS = ["Sarah Malik", "Omar Khan", "HR — Hafsah", "Tech Lead — Imran"];

const INTERVIEW_TYPE_OPTIONS: SearchableSelectOption[] = [
  { value: "In-Person", label: "In-Person", icon: <Building2 className="h-4 w-4 text-slate-400" /> },
  { value: "Video Call", label: "Video Call", icon: <Video className="h-4 w-4 text-slate-400" /> },
  { value: "Phone Call", label: "Phone Call", icon: <Phone className="h-4 w-4 text-slate-400" /> },
  { value: "Technical Test", label: "Technical Test", icon: <Monitor className="h-4 w-4 text-slate-400" /> },
  { value: "Panel Interview", label: "Panel Interview", icon: <Users className="h-4 w-4 text-slate-400" /> },
];

const MOCK_SCREENING: ScreeningRow[] = [
  { id: "S1", name: "Ayesha Khan", position: "Frontend Developer", keywords: ["React", "TypeScript"], score: 92, status: "Shortlisted" },
  { id: "S2", name: "John Doe", position: "Backend Developer", keywords: ["Node", "Postgres"], score: 88, status: "Applied" },
  { id: "S3", name: "Maria Ali", position: "Full Stack", keywords: ["React", "AWS"], score: 76, status: "Applied" },
  { id: "S4", name: "Bilal Raza", position: "QA Engineer", keywords: ["Cypress", "Jest"], score: 65, status: "Rejected" },
  { id: "S5", name: "Sana Iqbal", position: "Product Designer", keywords: ["Figma", "UX"], score: 84, status: "Shortlisted" },
];

const MOCK_INTERVIEWS: InterviewRow[] = [
  {
    id: "I1",
    name: "Ayesha Khan",
    position: "Frontend Developer",
    stage: "First",
    hrDate: "2026-05-14T10:00",
    interviewer: "Sarah Malik",
    status: "Scheduled",
    interviewType: "Video Call",
    comment: "Meet via Google Meet — link will be shared separately.",
  },
  {
    id: "I2",
    name: "John Doe",
    position: "Backend Developer",
    stage: "Second",
    hrDate: "2026-05-12T14:30",
    interviewer: "Tech Lead — Imran",
    status: "Completed",
    interviewType: "Technical Test",
    comment: "Bring laptop; system design whiteboard session.",
  },
  {
    id: "I3",
    name: "Sana Iqbal",
    position: "Product Designer",
    stage: "Third",
    hrDate: "2026-05-16T09:00",
    interviewer: "Omar Khan",
    status: "Scheduled",
    interviewType: "Panel Interview",
    comment: "Panel room 3B — portfolio walkthrough required.",
  },
];

const STAGE_OPTIONS: { value: InterviewStage; label: string }[] = [
  { value: "First", label: "First Interview" },
  { value: "Second", label: "Second Interview" },
  { value: "Third", label: "Third Interview" },
];

const STATUS_OPTIONS: InterviewRowStatus[] = ["Scheduled", "Completed", "Cancelled", "Rescheduled"];

function statusBadgeVariant(s: InterviewRowStatus): BadgeProps["variant"] {
  if (s === "Scheduled") return "blue";
  if (s === "Completed") return "green";
  if (s === "Cancelled") return "red";
  return "orange";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function InlineSearchablePopover<T extends string>({
  value,
  options,
  renderTrigger,
  onChange,
  searchPlaceholder = "Search…",
}: {
  value: T;
  options: { value: T; label: string }[];
  renderTrigger: () => ReactNode;
  onChange: (v: T) => void | Promise<void>;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q));
  }, [options, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
      <PopoverContent className="min-w-[220px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInputWrap>
            <CommandInput placeholder={searchPlaceholder} value={search} onValueChange={setSearch} />
          </CommandInputWrap>
          <CommandList>
            <CommandGroup>
              {filtered.map((o) => (
                <CommandItem
                  key={String(o.value)}
                  value={String(o.value)}
                  onSelect={async () => {
                    await onChange(o.value);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function ScreeningInterviewPipeline() {
  const { showToast } = useApp();
  const [mainTab, setMainTab] = useState<ScreenTab>("screening");

  const [position, setPosition] = useState("All positions");
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScreeningStatus | "All">("All");

  const [screeningRows, setScreeningRows] = useState<ScreeningRow[]>(MOCK_SCREENING);
  const [interviewRows, setInterviewRows] = useState<InterviewRow[]>(MOCK_INTERVIEWS);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleFor, setScheduleFor] = useState<ScreeningRow | null>(null);
  const [interviewStage, setInterviewStage] = useState<InterviewStage>("First");
  const [interviewer, setInterviewer] = useState(INTERVIEWERS[0]);
  const [slot, setSlot] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("Video Call");
  const [scheduleComment, setScheduleComment] = useState("");
  const [scheduleCommentError, setScheduleCommentError] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleRow, setRescheduleRow] = useState<InterviewRow | null>(null);
  const [newSlot, setNewSlot] = useState("");
  const [rescheduleInterviewer, setRescheduleInterviewer] = useState(INTERVIEWERS[0]);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduleType, setRescheduleType] = useState<InterviewType>("Video Call");
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const filteredScreening = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return [...screeningRows]
      .filter((r) => (position === "All positions" ? true : r.position === position))
      .filter((r) => r.score >= scoreMin && r.score <= scoreMax)
      .filter((r) => (statusFilter === "All" ? true : r.status === statusFilter))
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.position.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.score - a.score);
  }, [screeningRows, position, scoreMin, scoreMax, keyword, statusFilter]);

  const interviewerOptions: SearchableSelectOption[] = useMemo(
    () => INTERVIEWERS.map((x) => ({ value: x, label: x })),
    [],
  );

  const positionFilterOptions: SearchableSelectOption[] = useMemo(() => POSITIONS.map((p) => ({ value: p, label: p })), []);

  const screeningStatusOptions: SearchableSelectOption[] = useMemo(
    () => [
      { value: "All", label: "All" },
      { value: "Applied", label: "Applied" },
      { value: "Shortlisted", label: "Shortlisted" },
      { value: "Rejected", label: "Rejected" },
    ],
    [],
  );

  const confirmSchedule = async () => {
    if (!scheduleFor || !slot) {
      showToast?.("Pick a date & time", "error");
      return;
    }
    if (!scheduleComment.trim()) {
      setScheduleCommentError("Please add a comment for this interview stage");
      showToast?.("Please fix validation errors", "error");
      return;
    }
    setScheduleCommentError("");
    setScheduleSaving(true);
    await sleep(450);
    setInterviewRows((prev) => [
      {
        id: `I-${Date.now()}`,
        name: scheduleFor.name,
        position: scheduleFor.position,
        stage: interviewStage,
        hrDate: new Date(slot).toISOString(),
        interviewer,
        status: "Scheduled",
        interviewType,
        comment: scheduleComment.trim(),
      },
      ...prev,
    ]);
    setScreeningRows((prev) =>
      prev.map((r) => (r.id === scheduleFor.id ? { ...r, status: "Shortlisted" as const } : r)),
    );
    showToast?.(`Interview scheduled for ${scheduleFor.name}`);
    setScheduleSaving(false);
    setScheduleOpen(false);
    setScheduleFor(null);
    setSlot("");
    setScheduleComment("");
  };

  const openReschedule = (row: InterviewRow) => {
    setRescheduleRow(row);
    setNewSlot(row.hrDate.slice(0, 16));
    setRescheduleInterviewer(row.interviewer);
    setRescheduleType(row.interviewType);
    setRescheduleReason("");
    setRescheduleOpen(true);
  };

  const saveReschedule = async () => {
    if (!rescheduleRow || !newSlot) {
      showToast?.("Pick a date & time", "error");
      return;
    }
    if (!rescheduleReason.trim()) {
      showToast?.("Please add a reason for reschedule", "error");
      return;
    }
    setRescheduleSaving(true);
    await sleep(450);
    setInterviewRows((prev) =>
      prev.map((r) =>
        r.id === rescheduleRow.id
          ? {
              ...r,
              hrDate: new Date(newSlot).toISOString(),
              interviewer: rescheduleInterviewer,
              interviewType: rescheduleType,
              status: "Rescheduled",
              comment: r.comment ? `${r.comment}\n\n(Reschedule): ${rescheduleReason.trim()}` : rescheduleReason.trim(),
            }
          : r,
      ),
    );
    showToast?.("Interview rescheduled");
    setRescheduleSaving(false);
    setRescheduleOpen(false);
    setRescheduleRow(null);
  };

  const cancelInterview = async (row: InterviewRow) => {
    if (!window.confirm(`Cancel interview for ${row.name}?`)) return;
    setRowBusy(row.id);
    await sleep(350);
    setInterviewRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "Cancelled" } : r)));
    setRowBusy(null);
    showToast?.("Interview cancelled");
  };

  const updateDateInline = async (row: InterviewRow, iso: string) => {
    setRowBusy(row.id);
    await sleep(300);
    setInterviewRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, hrDate: new Date(iso).toISOString() } : r)));
    setRowBusy(null);
    showToast?.("Interview date updated");
  };

  const patchInterview = async (id: string, patch: Partial<InterviewRow>, toastMsg: string) => {
    setRowBusy(id);
    await sleep(300);
    setInterviewRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setRowBusy(null);
    showToast?.(toastMsg);
  };

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">Recruitment</span>{" "}
          <span className="text-white font-bold">Screening &amp; Interview</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">
          Screen candidates, schedule interviews, and track interview stages.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {(
          [
            { id: "screening" as const, label: "Screening" },
            { id: "interview" as const, label: "Interview" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMainTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              mainTab === t.id
                ? "bg-accent/15 text-accent border-accent/30"
                : "bg-surface/60 text-slate-400 border-border hover:bg-card-hover"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === "screening" && (
        <>
          <div className="card-base p-4 space-y-4">
            <div className="flex items-center gap-2 text-slate-200">
              <SlidersHorizontal size={14} className="text-slate-500" />
              <span className="text-sm font-semibold">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-500">Position</Label>
                <div className="mt-1">
                  <SearchableSelect value={position} onChange={setPosition} options={positionFilterOptions} placeholder="Position" />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-[11px] font-semibold text-slate-500">Score range</Label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreMin}
                    onChange={(e) => setScoreMin(Math.min(Number(e.target.value), scoreMax))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-xs text-slate-400 w-10">{scoreMin}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scoreMax}
                    onChange={(e) => setScoreMax(Math.max(Number(e.target.value), scoreMin))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-xs text-slate-400 w-10">{scoreMax}</span>
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-500">Keyword</Label>
                <div className="mt-1 flex items-center gap-2 bg-surface/70 border border-border rounded-lg px-3 py-2">
                  <Search size={14} className="text-slate-500 shrink-0" />
                  <input
                    className="bg-transparent text-xs text-slate-200 outline-none w-full placeholder:text-slate-600"
                    placeholder="Search keywords…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-500">Status</Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v as ScreeningStatus | "All")}
                    options={screeningStatusOptions}
                    placeholder="Status"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-surface">
                    <th className="table-th">Candidate Name</th>
                    <th className="table-th">Position Applied</th>
                    <th className="table-th">Keywords matched</th>
                    <th className="table-th">Score</th>
                    <th className="table-th">Status</th>
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScreening.map((r) => (
                    <tr key={r.id} className="table-row-hover">
                      <td className="table-td font-medium text-slate-200">{r.name}</td>
                      <td className="table-td text-slate-400 text-sm">{r.position}</td>
                      <td className="table-td">
                        <div className="flex flex-wrap gap-1">
                          {r.keywords.map((k) => (
                            <span key={k} className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-surface/70 text-cyan">
                              {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <span className="text-sm font-semibold text-slate-200 w-8">{r.score}</span>
                          <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${r.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                            r.status === "Shortlisted"
                              ? "bg-emerald/10 text-emerald border-emerald/20"
                              : r.status === "Rejected"
                                ? "bg-danger/10 text-danger border-danger/20"
                                : "bg-amber/10 text-amber border-amber/20"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <button
                          type="button"
                          className="btn-primary text-xs py-1.5 px-3"
                          onClick={() => {
                            setScheduleFor(r);
                            setInterviewStage("First");
                            setInterviewer(INTERVIEWERS[0]);
                            setInterviewType("Video Call");
                            setScheduleComment("");
                            setScheduleCommentError("");
                            setScheduleOpen(true);
                          }}
                          disabled={r.status === "Rejected"}
                        >
                          <CalendarClock size={12} />
                          Schedule Interview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {mainTab === "interview" && (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-surface">
                  <th className="table-th">Candidate Name</th>
                  <th className="table-th">Position</th>
                  <th className="table-th">Interview Stage</th>
                  <th className="table-th">HR Interview Date</th>
                  <th className="table-th">Interviewer</th>
                  <th className="table-th">Interview Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviewRows.map((r) => (
                  <tr key={r.id} className="table-row-hover">
                    <td className="table-td font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        {r.name}
                        {rowBusy === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" /> : null}
                      </div>
                    </td>
                    <td className="table-td text-slate-400 text-sm">{r.position}</td>
                    <td className="table-td">
                      <InlineSearchablePopover<InterviewStage>
                        value={r.stage}
                        options={STAGE_OPTIONS}
                        searchPlaceholder="Search stage…"
                        onChange={async (v) => patchInterview(r.id, { stage: v }, "Stage updated")}
                        renderTrigger={() => (
                          <button type="button" className="inline-flex">
                            <Badge variant="default" className="cursor-pointer border-accent/20 bg-accent/10 text-accent hover:bg-accent/15">
                              {r.stage}
                            </Badge>
                          </button>
                        )}
                      />
                    </td>
                    <td className="table-td">
                      <input
                        type="datetime-local"
                        className="input py-1.5 text-xs max-w-[200px]"
                        value={r.hrDate.slice(0, 16)}
                        disabled={rowBusy === r.id}
                        onChange={(e) => updateDateInline(r, e.target.value)}
                      />
                    </td>
                    <td className="table-td text-slate-300 text-sm">{r.interviewer}</td>
                    <td className="table-td">
                      <InlineSearchablePopover<InterviewRowStatus>
                        value={r.status}
                        options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                        searchPlaceholder="Search status…"
                        onChange={async (v) => patchInterview(r.id, { status: v }, "Status updated")}
                        renderTrigger={() => (
                          <button type="button" className="inline-flex">
                            <Badge variant={statusBadgeVariant(r.status)} className="cursor-pointer hover:opacity-90">
                              {r.status}
                            </Badge>
                          </button>
                        )}
                      />
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button type="button" className="btn-outline text-xs py-1 px-2" onClick={() => openReschedule(r)} disabled={rowBusy === r.id}>
                          Reschedule
                        </button>
                        <button
                          type="button"
                          className="btn-outline text-xs py-1 px-2 border-danger/30 text-danger hover:bg-danger/10"
                          onClick={() => cancelInterview(r)}
                          disabled={rowBusy === r.id}
                        >
                          Cancel
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

      <Dialog
        open={scheduleOpen}
        onOpenChange={(o) => {
          setScheduleOpen(o);
          if (!o) {
            setScheduleFor(null);
            setScheduleCommentError("");
          }
        }}
      >
        <DialogContent className="max-w-4xl w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            {scheduleFor ? (
              <p className="text-xs text-slate-500">
                {scheduleFor.name} · {scheduleFor.position}
              </p>
            ) : null}
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>
                  Interview Stage <span className="text-danger">*</span>
                </Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={interviewStage}
                    onChange={(v) => setInterviewStage(v as InterviewStage)}
                    options={STAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    placeholder="Interview stage"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Add stage-specific instructions in comments.</p>
              </div>
              <div>
                <Label>
                  Interviewer <span className="text-danger">*</span>
                </Label>
                <div className="mt-1">
                  <SearchableSelect value={interviewer} onChange={setInterviewer} options={interviewerOptions} placeholder="Select interviewer" />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>
                  Interview Type <span className="text-danger">*</span>
                </Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={interviewType}
                    onChange={(v) => setInterviewType(v as InterviewType)}
                    options={INTERVIEW_TYPE_OPTIONS}
                    placeholder="Select type"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>
                  Date &amp; time <span className="text-danger">*</span>
                </Label>
                <input type="datetime-local" className="input mt-1" value={slot} onChange={(e) => setSlot(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="sched-notes">
                  Interview Notes / Instructions <span className="text-danger">*</span>
                </Label>
                <Textarea
                  id="sched-notes"
                  className={cn("mt-1 min-h-[72px]", scheduleCommentError && "border-danger/50")}
                  placeholder="Add any instructions, meeting link, location details..."
                  value={scheduleComment}
                  onChange={(e) => {
                    setScheduleComment(e.target.value);
                    if (scheduleCommentError && e.target.value.trim()) setScheduleCommentError("");
                  }}
                  rows={3}
                />
                {scheduleCommentError ? <p className="mt-1 text-xs text-danger">{scheduleCommentError}</p> : null}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmSchedule} disabled={scheduleSaving}>
              {scheduleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-3xl w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Reschedule Interview</DialogTitle>
            {rescheduleRow ? (
              <p className="text-xs text-slate-500">
                {rescheduleRow.name} · {rescheduleRow.position}
              </p>
            ) : null}
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>
                  New Date &amp; Time <span className="text-danger">*</span>
                </Label>
                <input type="datetime-local" className="input mt-1" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>
                  Interviewer <span className="text-danger">*</span>
                </Label>
                <div className="mt-1">
                  <SearchableSelect value={rescheduleInterviewer} onChange={setRescheduleInterviewer} options={interviewerOptions} placeholder="Interviewer" />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>
                  Interview Type <span className="text-danger">*</span>
                </Label>
                <div className="mt-1">
                  <SearchableSelect
                    value={rescheduleType}
                    onChange={(v) => setRescheduleType(v as InterviewType)}
                    options={INTERVIEW_TYPE_OPTIONS}
                    placeholder="Interview type"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>
                  Reason for Reschedule <span className="text-danger">*</span>
                </Label>
                <Textarea className="mt-1 min-h-[88px]" placeholder="Explain why this interview is being rescheduled…" value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} rows={3} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveReschedule} disabled={rescheduleSaving}>
              {rescheduleSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
