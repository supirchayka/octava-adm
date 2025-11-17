import * as React from "react"
import { cn } from "@/lib/utils"
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(( { className, ...props }, ref) => (
  <textarea ref={ref} className={cn("min-h-[120px] w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2", className)} {...props} />
))
Textarea.displayName = "Textarea"
