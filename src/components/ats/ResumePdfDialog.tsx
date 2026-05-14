import { useCallback, useMemo, useRef, useState } from "react";
import { Download, FileText, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ResumePdfDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  /** Blob or remote URL */
  url: string | null;
  fileName?: string;
  /** When user picks a file from empty state */
  onUpload?: (file: File) => void;
};

function mockPageCount(name: string) {
  if (!name.toLowerCase().endsWith(".pdf")) return null;
  const n = ((name.length % 7) + 3) as number;
  return n;
}

export function ResumePdfDialog({ open, onOpenChange, candidateName, url, fileName, onUpload }: ResumePdfDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const displayName = fileName || (url ? "Resume.pdf" : "");
  const pages = useMemo(() => (displayName ? mockPageCount(displayName) : null), [displayName]);

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const f = Array.from(e.dataTransfer.files || []).find((x) => /\.pdf$/i.test(x.name));
      if (f && onUpload) {
        setBusy(true);
        await new Promise((r) => setTimeout(r, 400));
        onUpload(f);
        setBusy(false);
      }
    },
    [onUpload],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} >
      <DialogContent className="max-w-4xl w-[calc(100vw-2rem)] p-0 top-0 left-auto right-0 !h-full !max-h-full translate-x-0 translate-y-0 rounded-none" hideClose >
        <DialogHeader className="pr-14">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-accent" />
                Resume / PDF
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                {candidateName ? <span className="text-slate-400 font-medium">{candidateName}</span> : null}
                {candidateName && displayName ? " · " : null}
                {displayName ? <span>{displayName}</span> : <span>No file</span>}
                {pages != null ? <span className="text-slate-500"> · {pages} pages</span> : null}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {url ? (
                <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
                  <a href={url} download={displayName || "resume.pdf"}>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <DialogBody className="p-0" style={{ height: "85vh" }}>
          {busy ? (
            <div className="flex h-full items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : url ? (
            <iframe title="PDF preview" src={url} className="h-full w-full border-0 bg-surface" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6">
              <label
                className={cn(
                  "flex w-full max-w-xl cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface/50 px-6 py-14 text-center transition-colors hover:border-accent/40 hover:bg-card-hover",
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
              >
                <Upload className="mb-3 h-10 w-10 text-slate-500" />
                <p className="text-sm font-semibold text-slate-200">Drag PDF here or click to browse</p>
                <p className="mt-1 text-xs text-slate-500">PDF only for preview</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUpload) onUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button type="button" className="mt-4" variant="outline" onClick={() => inputRef.current?.click()}>
                  Browse PDF
                </Button>
              </label>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
