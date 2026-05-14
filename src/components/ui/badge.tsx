import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-surface/70 text-slate-300",
        blue: "border-cyan/30 bg-cyan/10 text-cyan",
        green: "border-emerald/20 bg-emerald/10 text-emerald",
        red: "border-danger/20 bg-danger/10 text-danger",
        orange: "border-amber/30 bg-amber/10 text-amber",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
