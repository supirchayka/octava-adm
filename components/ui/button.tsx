import * as React from "react"
import { cn } from "@/lib/utils"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline"
  size?: "sm" | "md" | "lg"
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-black text-white hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground",
  ghost: "bg-transparent hover:bg-secondary",
  destructive: "bg-red-600 text-white hover:opacity-90",
  outline: "border border-border"
}

const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4",
  lg: "h-12 px-5 text-lg"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size="md", ...props }, ref) => (
    <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md transition-colors", variants[variant], sizes[size], className)} {...props} />
  )
)
Button.displayName = "Button"
