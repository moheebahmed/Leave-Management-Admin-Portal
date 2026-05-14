import { useMemo, useState } from "react";
import { Award, Filter, Quote } from "lucide-react";
import { useApp } from "../../layouts/DashboardLayout";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreLegend, ScoreRing } from "@/components/ats/ScoreRing";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ats/SearchableSelect";

type StageKey = "First" | "Second" | "Third";
type Decision = "pending" | "offer" | "reject" | "hold";

type StageScores = {
  communication: number;
  technical: number;
  culture: number;
  problemSolving: number;
};

type CompletedInterviewStage = {
  stage: StageKey;
  interviewer: string;
  interviewDate: string;
  interviewType: string;
  scheduleComment: string;
  scores: StageScores;
  evaluatorNotes: string;
};

type EvaluationCandidate = {
  id: string;
  name: string;
  role: string;
  completedStages: CompletedInterviewStage[];
  decision: Decision;
};

const MOCK: EvaluationCandidate[] = [
  {
    id: "C1",
    name: "Ayesha Khan",
    role: "Frontend Developer",
    decision: "pending",
    completedStages: [
      {
        stage: "First",
        interviewer: "Sarah Malik",
        interviewDate: "2026-05-10T10:00:00.000Z",
        interviewType: "Video Call",
        scheduleComment: "Google Meet — focus on React fundamentals and async patterns.",
        scores: { communication: 8, technical: 9, culture: 7, problemSolving: 8 },
        evaluatorNotes: "Excellent hooks knowledge; clear communicator.",
      },
      {
        stage: "Second",
        interviewer: "Tech Lead — Imran",
        interviewDate: "2026-05-12T14:30:00.000Z",
        interviewType: "Technical Test",
        scheduleComment: "Live coding exercise + short system design prompt.",
        scores: { communication: 7, technical: 8, culture: 8, problemSolving: 9 },
        evaluatorNotes: "Strong problem decomposition; minor gaps in edge-case testing.",
      },
    ],
  },
  {
    id: "C2",
    name: "John Doe",
    role: "Backend Developer",
    decision: "pending",
    completedStages: [
      {
        stage: "First",
        interviewer: "Omar Khan",
        interviewDate: "2026-05-09T11:00:00.000Z",
        interviewType: "Phone Call",
        scheduleComment: "Screening call — confirm experience with Postgres and queues.",
        scores: { communication: 6, technical: 8, culture: 6, problemSolving: 7 },
        evaluatorNotes: "Solid API design; communication a bit terse.",
      },
    ],
  },
  {
    id: "C3",
    name: "Sana Iqbal",
    role: "Product Designer",
    decision: "hold",
    completedStages: [
      {
        stage: "First",
        interviewer: "Sarah Malik",
        interviewDate: "2026-05-08T09:30:00.000Z",
        interviewType: "In-Person",
        scheduleComment: "Office design studio — bring printed portfolio (optional).",
        scores: { communication: 9, technical: 8, culture: 9, problemSolving: 8 },
        evaluatorNotes: "Outstanding storytelling; great collaboration signals.",
      },
      {
        stage: "Second",
        interviewer: "Omar Khan",
        interviewDate: "2026-05-11T15:00:00.000Z",
        interviewType: "Panel Interview",
        scheduleComment: "Panel interview — case study walkthrough + Q&A.",
        scores: { communication: 9, technical: 9, culture: 8, problemSolving: 9 },
        evaluatorNotes: "Very strong end-to-end thinking.",
      },
      {
        stage: "Third",
        interviewer: "HR — Hafsah",
        interviewDate: "2026-05-13T16:00:00.000Z",
        interviewType: "Video Call",
        scheduleComment: "Final culture & ways-of-working alignment.",
        scores: { communication: 10, technical: 8, culture: 9, problemSolving: 8 },
        evaluatorNotes: "Great culture fit; finalize comp discussion separately.",
      },
    ],
  },
];

function stageLabel(s: StageKey) {
  if (s === "First") return "First Interview";
  if (s === "Second") return "Second Interview";
  return "Third Interview";
}

function avg4(x: StageScores) {
  const v = (x.communication + x.technical + x.culture + x.problemSolving) / 4;
  return Math.round(v * 10) / 10;
}

function clamp10(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

export default function EvaluationPipeline() {
  const { showToast } = useApp();
  const [rows, setRows] = useState<EvaluationCandidate[]>(MOCK);
  const [evaluatorFilter, setEvaluatorFilter] = useState("All");

  const evaluators = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => r.completedStages.forEach((st) => s.add(st.interviewer)));
    return ["All", ...Array.from(s)];
  }, [rows]);

  const evaluatorOptions: SearchableSelectOption[] = useMemo(() => evaluators.map((e) => ({ value: e, label: e })), [evaluators]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (evaluatorFilter === "All") return true;
      return r.completedStages.some((st) => st.interviewer === evaluatorFilter);
    });
  }, [rows, evaluatorFilter]);

  const stats = useMemo(() => {
    const scores = rows.flatMap((r) => r.completedStages.map((st) => avg4(st.scores)));
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const passed = rows.filter((r) => r.decision === "offer").length;
    const failed = rows.filter((r) => r.decision === "reject").length;
    return { total: rows.length, avg, passed, failed };
  }, [rows]);

  const patchStage = (candidateId: string, stage: StageKey, patch: Partial<CompletedInterviewStage>) => {
    setRows((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        return {
          ...c,
          completedStages: c.completedStages.map((s) => (s.stage === stage ? { ...s, ...patch } : s)),
        };
      }),
    );
  };

  const applyDecision = (id: string, d: Exclude<Decision, "pending">) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, decision: d } : r)));
    const labels: Record<string, string> = {
      offer: "Moved to offer stage",
      reject: "Candidate rejected",
      hold: "Candidate on hold",
    };
    showToast?.(labels[d]);
  };

  return (
    <div className="animate-fade-slide space-y-5">
      <div>
        <h2 className="page-title">
          <span className="text-accent font-bold">Recruitment</span> <span className="text-white font-bold">Evaluation</span>
        </h2>
        <p className="page-subtitle font-semibold text-[rgb(173,173,173)]">Review completed interview stages, score consistently, and decide next steps.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-base p-4 border border-border">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Total Candidates</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{stats.total}</p>
        </div>
        <div className="card-base p-4 border border-border">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Avg Stage Score</p>
          <p className="mt-1 text-2xl font-bold text-accent">{stats.avg.toFixed(2)}</p>
        </div>
        <div className="card-base p-4 border border-border">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Passed (Offer)</p>
          <p className="mt-1 text-2xl font-bold text-emerald">{stats.passed}</p>
        </div>
        <div className="card-base p-4 border border-border">
          <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-danger">{stats.failed}</p>
        </div>
      </div>

      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-200">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Evaluator (any stage)</Label>
            <div className="mt-1">
              <SearchableSelect value={evaluatorFilter} onChange={setEvaluatorFilter} options={evaluatorOptions} placeholder="All evaluators" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((c) => {
          const stageAverages = c.completedStages.map((s) => avg4(s.scores));
          const overall = stageAverages.length ? stageAverages.reduce((a, b) => a + b, 0) / stageAverages.length : 0;
          const overallRounded = Math.round(overall * 10) / 10;

          return (
            <CandidateEvaluationCard
              key={c.id}
              candidate={c}
              overall={overallRounded}
              onPatchStage={(stage, patch) => patchStage(c.id, stage, patch)}
              onDecision={applyDecision}
            />
          );
        })}
      </div>
    </div>
  );
}

function CandidateEvaluationCard({
  candidate,
  overall,
  onPatchStage,
  onDecision,
}: {
  candidate: EvaluationCandidate;
  overall: number;
  onPatchStage: (stage: StageKey, patch: Partial<CompletedInterviewStage>) => void;
  onDecision: (id: string, d: Exclude<Decision, "pending">) => void;
}) {
  const [tab, setTab] = useState<StageKey>(() => candidate.completedStages[0]?.stage ?? "First");
  const active = candidate.completedStages.find((s) => s.stage === tab) ?? candidate.completedStages[0];

  if (!active) return null;

  const stageScore = avg4(active.scores);

  return (
    <div className="card-base p-5 border border-border">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-syne font-bold text-slate-100 text-lg">{candidate.name}</h3>
          <p className="text-sm text-slate-400">{candidate.role}</p>
          <p className="text-[11px] text-slate-500 mt-2">
            Showing <span className="text-slate-300 font-semibold">completed</span> interview stages only.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 rounded-xl border border-border bg-surface/70 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
          <ScoreRing score={overall} />
          <div className="min-w-[200px]">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber" />
              <div>
                <p className="text-[10px] uppercase text-slate-500 font-semibold">Overall score</p>
                <p className="text-xs text-slate-400">Average of completed stage scores</p>
              </div>
            </div>
            <div className="mt-2">
              <ScoreLegend />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-56 shrink-0 space-y-1 rounded-xl border border-border bg-surface/40 p-2">
          {candidate.completedStages.map((s) => {
            const selected = tab === s.stage;
            return (
              <button
                key={s.stage}
                type="button"
                onClick={() => setTab(s.stage)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                  selected ? "bg-accent/15 text-accent" : "text-slate-300 hover:bg-card-hover",
                )}
              >
                {stageLabel(s.stage)}
              </button>
            );
          })}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Interviewer</p>
              <p className="mt-1 text-sm text-slate-200">{active.interviewer}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-[11px] font-semibold text-slate-500">Interview date</p>
              <p className="mt-1 text-sm text-slate-200">{new Date(active.interviewDate).toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface/50 p-3 md:col-span-2">
              <p className="text-[11px] font-semibold text-slate-500">Interview type</p>
              <p className="mt-1 text-sm text-slate-200">{active.interviewType}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Quote className="h-4 w-4 text-accent" />
              Scheduling notes (read-only)
            </div>
            <p className="mt-2 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{active.scheduleComment}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-200">Stage scores (0–10)</p>
                <span className="text-xs font-bold text-accent tabular-nums">Stage: {stageScore.toFixed(1)}</span>
              </div>

              <ScoreField
                label="Communication"
                value={active.scores.communication}
                onChange={(n) => onPatchStage(active.stage, { scores: { ...active.scores, communication: clamp10(n) } })}
              />
              <ScoreField
                label="Technical Skills"
                value={active.scores.technical}
                onChange={(n) => onPatchStage(active.stage, { scores: { ...active.scores, technical: clamp10(n) } })}
              />
              <ScoreField
                label="Culture Fit"
                value={active.scores.culture}
                onChange={(n) => onPatchStage(active.stage, { scores: { ...active.scores, culture: clamp10(n) } })}
              />
              <ScoreField
                label="Problem Solving"
                value={active.scores.problemSolving}
                onChange={(n) => onPatchStage(active.stage, { scores: { ...active.scores, problemSolving: clamp10(n) } })}
              />
            </div>

            <div>
              <Label>Evaluator additional notes</Label>
              <Textarea className="mt-1 min-h-[160px]" value={active.evaluatorNotes} onChange={(e) => onPatchStage(active.stage, { evaluatorNotes: e.target.value })} rows={6} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Button type="button" onClick={() => onDecision(candidate.id, "offer")}>
              Move to Offer
            </Button>
            <Button type="button" variant="destructive" onClick={() => onDecision(candidate.id, "reject")}>
              Reject
            </Button>
            <Button type="button" variant="outline" onClick={() => onDecision(candidate.id, "hold")}>
              Hold
            </Button>
            {candidate.decision !== "pending" && (
              <span className="text-xs text-slate-500 self-center ml-auto">
                Decision: <span className="text-slate-300 font-semibold capitalize">{candidate.decision}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      <Input
        type="number"
        min={0}
        max={10}
        step={0.5}
        className="h-9 w-24 text-right"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
