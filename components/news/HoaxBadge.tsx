import { Badge } from "@/components/ui/Badge";

export type HoaxStatus = "HOAKS" | "KLARIFIKASI";

/**
 * HoaxBadge — label status klarifikasi. Warna TIDAK menjadi satu-satunya
 * penanda: teks tetap eksplisit (WCAG 1.4.1).
 */
export function HoaxBadge({ status }: { status: HoaxStatus }) {
  const isHoax = status === "HOAKS";
  return (
    <Badge tone={isHoax ? "danger" : "secondary"} role="status">
      {isHoax ? "Hoaks" : "Klarifikasi"}
    </Badge>
  );
}
