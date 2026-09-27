import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone = "neutral" | "primary" | "secondary" | "danger" | "warning" | "accent";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  primary: "bg-primary-50 text-primary-700",
  secondary: "bg-secondary-600/10 text-secondary-700",
  danger: "bg-danger-50 text-danger-600",
  warning: "bg-warning-50 text-warning-600",
  // accent-600 (#0284c7) hanya ~3,5:1 di atas latar badge terang/gelap ->
  // pakai shade lebih gelap di mode terang & lebih terang di mode gelap.
  accent: "bg-accent-500/15 text-accent-700 dark:text-accent-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
