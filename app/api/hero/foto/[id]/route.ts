import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { bacaFotoHero, hapusSemuaFotoHero, simpanFotoHero } from "@/lib/storage/foto-hero";
import { getHeroSlideById, setFotoHeroSlide } from "@/lib/services/hero";
import { catatAuditSesi } from "@/lib/services/audit";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hero/foto/[id] — sajikan foto slide hero dari penyimpanan lokal.
 * Publik (foto slide memang untuk ditampilkan). Bila berkas tidak ada,
 * membalas 404 sehingga UI memakai foto default bawaan.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const foto = await bacaFotoHero(id);
  if (!foto) {
    return new NextResponse("Foto tidak ditemukan.", { status: 404 });
  }
  return new NextResponse(new Uint8Array(foto.isi), {
    status: 200,
    headers: {
      "Content-Type": foto.mime,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * POST /api/hero/foto/[id] — unggah/ganti foto slide hero (HANYA admin).
 * Menerima multipart/form-data dengan field `foto`.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const slide = await getHeroSlideById(id);
  if (!slide) {
    return NextResponse.json({ ok: false, message: "Slide tidak ditemukan." }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, message: "Berkas tidak terbaca." }, { status: 400 });
  }

  const berkas = form.get("foto");
  if (!(berkas instanceof File)) {
    return NextResponse.json({ ok: false, message: "Pilih berkas foto terlebih dahulu." }, { status: 400 });
  }

  const simpan = await simpanFotoHero(id, berkas);
  if (!simpan.ok) {
    return NextResponse.json({ ok: false, message: simpan.message }, { status: 422 });
  }

  const tercatat = await setFotoHeroSlide(id, simpan.url);
  if (!tercatat) {
    return NextResponse.json({ ok: false, message: "Slide tidak ditemukan." }, { status: 404 });
  }

  revalidatePath("/");
  await catatAuditSesi(
    session,
    {
      aksi: "UNGGAH_FOTO_HERO",
      target: "HeroSlide",
      targetId: id,
      detail: `Unggah foto slide "${slide.label}" (${Math.max(1, Math.round(berkas.size / 1024))} KB, ${berkas.type})`,
    },
    { ip: clientIp(request), userAgent: request.headers.get("user-agent") },
  );

  return NextResponse.json({ ok: true, url: simpan.url }, { status: 201 });
}

/**
 * DELETE /api/hero/foto/[id] — hapus foto, slide dilewati di slideshow (HANYA admin).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Tidak diizinkan. Silakan masuk sebagai admin." },
      { status: 401 },
    );
  }

  const { id } = await params;
  const slide = await getHeroSlideById(id);
  if (!slide) {
    return NextResponse.json({ ok: false, message: "Slide tidak ditemukan." }, { status: 404 });
  }

  await hapusSemuaFotoHero(id);
  await setFotoHeroSlide(id, "");
  revalidatePath("/");

  await catatAuditSesi(
    session,
    {
      aksi: "HAPUS_FOTO_HERO",
      target: "HeroSlide",
      targetId: id,
      detail: `Hapus foto slide "${slide.label}"`,
    },
    { ip: clientIp(request), userAgent: request.headers.get("user-agent") },
  );

  return NextResponse.json({ ok: true });
}
