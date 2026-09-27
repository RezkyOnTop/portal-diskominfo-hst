import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-primary-600 text-white hover:bg-primary-700",
        secondary:
          "bg-secondary-600 text-white hover:bg-secondary-700",
        outline:
          "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
        ghost: "text-primary-700 hover:bg-primary-50",
        danger: "bg-danger-600 text-white hover:bg-danger-600/90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
