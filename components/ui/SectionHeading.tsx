import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  as?: "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SectionHeading({
  as: Tag = "h2",
  children,
  className,
  action,
}: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <Tag
        className={cn(
          "font-heading text-xl font-bold text-neutral-900 sm:text-2xl",
          className,
        )}
      >
        {children}
      </Tag>
      {action}
    </div>
  );
}
