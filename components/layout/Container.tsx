import { cn } from "@/lib/utils/cn";

/** Container layout: max-width konsisten + padding tepi responsif. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-4", className)}>{children}</div>
  );
}
