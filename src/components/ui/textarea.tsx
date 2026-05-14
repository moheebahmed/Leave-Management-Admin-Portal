import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea className={cn("input min-h-[80px] resize-y", className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";

export { Textarea };
