import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { bacaFotoPegawai, simpanFotoPegawai } from "@/lib/storage/foto";
import { getStaffById, setFotoStaff } from "@/lib/services/staff";
import { catatAuditSesi } from "@/lib/services/audit";
import { clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pegawai/foto/[id] — sajikan foto pegawai dari penyimpanan lokal.
 * Publik (foto pegawai memang untuk ditampilkan). Bila berkas tidak ada,
 * membalas 404 sehingga UI memakai avatar inisial (gambar default).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const foto = await bacaFotoPegawai(id);
  if (!foto) {
    return new NextResponse("Foto tidak ditemukan.", { status: 404 });
  }

  // ETag dari isi berkas: admin yang baru mengganti foto langsung melihat
  // gambar baru setelah reload, sementara pengunjung lain tetap dapat 304
  // murah. Tanpa ini, `max-age=3600` membuat foto lama bertahan sejam penuh
  // sehingga unggahan terasa "tidak berfungsi".
  const etag = `"${createHash("sha1").update(foto.isi).digest("hex").slice(0, 20)}"`;
  const ifNoneMatch = _request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch.split(",").some((v) => v.trim() === etag)) {
    return new NextResponse(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "public, no-cache" },
    });
  }

  return new NextResponse(new Uint8Array(foto.isi), {
    status: 200,
    headers: {
      "Content-Type": foto.mime,
      ETag: etag,
      // `no-cache` = boleh disimpan, tetapi WAJIB revalidasi (murah: 304).
      "Cache-Control": "public, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * POST /api/pegawai/foto/[id] — unggah/ganti foto pegawai (HANYA admin).
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
  const pegawai = await getStaffById(id);
  if (!pegawai) {
    return NextResponse.json({ ok: false, message: "Pegawai tidak ditemukan." }, { status: 404 });
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

  const simpan = await simpanFotoPegawai(id, berkas);
  if (!simpan.ok) {
    return NextResponse.json({ ok: false, message: simpan.message }, { status: 422 });
  }

  const tercatat = await setFotoStaff(id, simpan.url);
  if (!tercatat) {
    return NextResponse.json({ ok: false, message: "Pegawai tidak ditemukan." }, { status: 404 });
  }

  await catatAuditSesi(
    session,
    {
      aksi: "UNGGAH_FOTO_PEGAWAI",
      target: "Staff",
      targetId: id,
      detail: `Unggah foto pegawai "${pegawai.nama}" (${Math.max(1, Math.round(berkas.size / 1024))} KB, ${berkas.type})`,
    },
    { ip: clientIp(request), userAgent: request.headers.get("user-agent") },
  );

  return NextResponse.json({ ok: true, url: simpan.url }, { status: 201 });
}

/**
 * DELETE /api/pegawai/foto/[id] — hapus foto, kembali ke avatar default (HANYA admin).
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
  const pegawai = await getStaffById(id);
  if (!pegawai) {
    return NextResponse.json({ ok: false, message: "Pegawai tidak ditemukan." }, { status: 404 });
  }

  const { hapusSemuaFoto } = await import("@/lib/storage/foto");
  await hapusSemuaFoto(id);
  await setFotoStaff(id, "");

  await catatAuditSesi(
    session,
    {
      aksi: "HAPUS_FOTO_PEGAWAI",
      target: "Staff",
      targetId: id,
      detail: `Hapus foto pegawai "${pegawai.nama}"`,
    },
    { ip: clientIp(request), userAgent: request.headers.get("user-agent") },
  );

  return NextResponse.json({ ok: true });
}
