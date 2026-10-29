/**
 * Rate limiter in-memory sederhana (per-instance).
 *
 * CATATAN KEAMANAN — kenapa ada batas GLOBAL:
 * Aplikasi ini bisa diekspos langsung tanpa reverse proxy (mis. :3010). Dalam
 * kondisi itu `X-Forwarded-For` SEPENUHNYA dikendalikan klien, sehingga
 * penyerang bisa memutar header tersebut tiap permintaan dan tidak pernah
 * menyentuh batas per-IP. Karena itu setiap kunci juga dihitung pada ember
 * GLOBAL per-fitur (limit x10). Efeknya: pemalsuan header hanya membagi kuota,
 * bukan menghapusnya — banjir permintaan tetap terhenti.
 *
 * Bila nanti dipasang Nginx/Caddy di depan, set TRUSTED_PROXY_HOPS=1 agar IP
 * diambil dari entri XFF yang ditambahkan proxy terdekat (bukan yang dikirim
 * klien), dan batas per-IP kembali akurat. Lihat SECURITY.md.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Ambang pembersihan: cegah Map tumbuh tanpa batas (kebocoran memori). */
const AMBAT_BUCKET = 5000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Jumlah hop proxy tepercaya (0 = tanpa proxy, header dipalsukan = tidak dianggap). */
const TRUSTED_PROXY_HOPS = Math.max(
  0,
  Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "0", 10) || 0,
);

/** Buang ember yang sudah kedaluwarsa bila Map membesar. */
function bersihkanKedaluwarsa(now: number): void {
  if (buckets.size < AMBAT_BUCKET) return;
  for (const [k, b] of buckets) {
    if (now > b.resetAt) buckets.delete(k);
  }
}

function hit(key: string, limit: number, windowMs: number, now: number): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/**
 * Batasi laju per kunci. Kunci WAJIB berformat `fitur:identitas`
 * (mis. `chat:1.2.3.4`) — bagian sebelum `:` dipakai sebagai ember global.
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  bersihkanKedaluwarsa(now);

  // 1) Ember global per fitur — penjaga terhadap pemalsuan identitas.
  const fitur = key.includes(":") ? key.slice(0, key.indexOf(":")) : key;
  const global = hit(`\u0000global:${fitur}`, Math.max(50, limit * 10), windowMs, now);
  if (!global.ok) return global;

  // 2) Ember per identitas (akurat bila TRUSTED_PROXY_HOPS > 0).
  return hit(key, limit, windowMs, now);
}

/**
 * Identitas klien untuk kunci rate limit.
 *
 * Tanpa proxy tepercaya, `X-Forwarded-For` dapat dipalsukan klien — nilai itu
 * tetap dipakai demi keadilan antar pengunjung, tetapi ember global di
 * `rateLimit()` yang menahan penyalahgunaan.
 */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const bagian = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (bagian.length > 0) {
      if (TRUSTED_PROXY_HOPS > 0) {
        // Entri paling kanan ditambahkan proxy terdekat; ambil sesuai jumlah hop.
        const idx = bagian.length - TRUSTED_PROXY_HOPS;
        return bagian[idx >= 0 ? idx : 0]!;
      }
      // Tanpa proxy: XFF bisa dipalsukan. Dipakai demi keadilan per-pengunjung;
      // ember GLOBAL di rateLimit() yang menahan banjir permintaan.
      return bagian[0]!;
    }
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "tanpa-proxy";
}
