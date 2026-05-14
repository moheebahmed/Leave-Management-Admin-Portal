import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInputWrap, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SearchableSelectOption = { value: string; label: string; icon?: ReactNode };

type SearchableSelectProps = {
  value: string;
  onChange: (v: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  error?: string;
  className?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled,
  id,
  error,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <div className={cn("space-y-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn("h-10 w-full justify-between font-normal", error && "border-danger/50")}
          >
            <span className="flex min-w-0 items-center gap-2 truncate text-left">
              {selected?.icon}
              <span className="truncate">{selected?.label ?? placeholder}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[var(--radix-popover-trigger-width,260px)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInputWrap>
              <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
            </CommandInputWrap>
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {filtered.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={() => {
                      onChange(o.value);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Check className={cn("h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                    <span className="flex items-center gap-2">
                      {o.icon}
                      {o.label}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
