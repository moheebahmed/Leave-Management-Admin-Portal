import { useCallback, useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInputWrap, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MAX_VISIBLE_CHIPS = 3;

export const PREDEFINED_SKILLS = [
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "AWS",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MongoDB",
  "GraphQL",
  "Tailwind CSS",
  "Next.js",
  "Vue.js",
  "Angular",
  "Figma",
  "Jest",
  "Cypress",
  "CI/CD",
  "System Design",
];

type SkillsMultiSelectProps = {
  value: string[];
  onChange: (next: string[]) => void;
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  error?: string;
};

export function SkillsMultiSelect({
  value,
  onChange,
  options = PREDEFINED_SKILLS,
  placeholder = "Search or add skills…",
  disabled,
  id,
  error,
}: SkillsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const mergedOptions = useMemo(() => {
    const set = new Set([...options, ...value]);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [options, value]);

  const toggle = useCallback(
    (skill: string) => {
      const s = skill.trim();
      if (!s) return;
      if (value.includes(s)) onChange(value.filter((x) => x !== s));
      else onChange([...value, s]);
    },
    [onChange, value],
  );

  const remove = useCallback(
    (skill: string) => {
      onChange(value.filter((x) => x !== skill));
    },
    [onChange, value],
  );

  const visible = value.slice(0, MAX_VISIBLE_CHIPS);
  const rest = value.length - visible.length;

  const addCustom = useCallback(() => {
    const q = search.trim();
    if (!q) return;
    if (!value.includes(q)) onChange([...value, q]);
    setSearch("");
  }, [onChange, search, value]);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("h-auto min-h-[42px] w-full justify-between py-2 text-left font-normal", error && "border-danger/50")}
          >
            <div className="flex flex-1 flex-wrap items-center gap-1.5 pr-2">
              {value.length === 0 ? (
                <span className="text-slate-500">{placeholder}</span>
              ) : (
                <>
                  {visible.map((s) => (
                    <Badge
                      key={s}
                      variant="default"
                      className="gap-1 pl-2 pr-1 text-[10px]"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      {s}
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded p-0.5 hover:bg-border"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          remove(s);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            remove(s);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </Badge>
                  ))}
                  {rest > 0 && (
                    <span className="text-[10px] font-semibold text-accent">+{rest} more</span>
                  )}
                </>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,420px)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInputWrap>
              <CommandInput
                placeholder="Search skills…"
                value={search}
                onValueChange={setSearch}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
              />
            </CommandInputWrap>
            <CommandList>
              <CommandEmpty>No match. Press Enter to add &quot;{search.trim() || "…"}&quot;</CommandEmpty>
              <CommandGroup heading="Skills">
                {mergedOptions
                  .filter((o) => !search.trim() || o.toLowerCase().includes(search.trim().toLowerCase()))
                  .map((o) => {
                    const selected = value.includes(o);
                    return (
                      <CommandItem key={o} value={o} onSelect={() => toggle(o)}>
                        <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                        {o}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
            <p className="border-t border-border px-3 py-2 text-[10px] text-slate-500">Type a custom skill and press Enter to add it.</p>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
