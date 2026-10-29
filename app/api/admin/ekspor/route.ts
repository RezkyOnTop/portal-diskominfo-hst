import { auth } from "@/lib/auth";
import { listSubscribers } from "@/lib/services/subscriber";
import { listReservations } from "@/lib/services/reservation";
import { listSurveys } from "@/lib/services/survey";
import { listStaffAdmin } from "@/lib/services/staff";
import { listPengaduan } from "@/lib/services/pengaduan";
import { listUsers } from "@/lib/services/user";
import { csvHeaders, namaBerkasCsv, toCsv } from "@/lib/utils/csv";
import { catatAuditSesi, type SesiAudit } from "@/lib/services/audit";
import { clientIp } from "@/lib/rate-limit";
import {
  IKM_UNSUR,
  LABEL_STATUS_PENGADUAN,
  LABEL_USER_ROLE,
  type StatusPengaduan,
  type UserRole,
} from "@/lib/validations/local.schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type JenisEkspor = "subscriber" | "survei" | "reservasi" | "pegawai" | "pengaduan" | "user";

function isJenis(v: string): v is JenisEkspor {
  return (
    v === "subscriber" ||
    v === "survei" ||
    v === "reservasi" ||
    v === "pegawai" ||
    v === "pengaduan" ||
    v === "user"
  );
}

/**
 * GET /api/admin/ekspor?jenis=subscriber|survei|reservasi|pegawai|pengaduan|user
 * Unduh data lokal sebagai CSV. HANYA untuk sesi admin (Auth.js).
 * `jenis=user` khusus Administrator (berisi daftar akun dashboard).
 */
/** Balas CSV sekaligus catat jejak audit unduhan (satu pintu, tidak terlewat). */
async function balasCsv(
  session: SesiAudit,
  request: Request,
  jenis: JenisEkspor,
  csv: string,
  nama: string,
): Promise<Response> {
  await catatAuditSesi(
    session,
    {
      aksi: "EKSPOR_CSV",
      target: "Ekspor",
      detail: `Unduh data "${jenis}" sebagai CSV`,
    },
    { ip: clientIp(request), userAgent: request.headers.get("user-agent") },
  );
  return new Response(csv, { headers: csvHeaders(namaBerkasCsv(nama)) });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Tidak diizinkan. Silakan masuk sebagai admin.", {
      status: 401,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const jenis = new URL(request.url).searchParams.get("jenis") ?? "";
  if (!isJenis(jenis)) {
    return new Response(
      "Parameter `jenis` harus subscriber, survei, reservasi, pegawai, pengaduan, atau user.",
      {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  if (jenis === "user") {
    // Daftar akun hanya untuk Administrator.
    if (session.user?.role !== "ADMIN") {
      await catatAuditSesi(
        session,
        {
          aksi: "EKSPOR_CSV",
          target: "Ekspor",
          detail: "Percobaan ekspor daftar user ditolak (bukan Administrator)",
        },
        { ip: clientIp(request), userAgent: request.headers.get("user-agent") },
      );
      return new Response("Hanya Administrator yang boleh mengunduh daftar user.", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const rows = await listUsers();
    const csv = toCsv(
      ["Nama", "Username", "Peran", "Status", "Dibuat", "Diperbarui"],
      rows.map((u) => [
        u.nama,
        u.username,
        LABEL_USER_ROLE[u.role as UserRole] ?? u.role,
        u.aktif ? "Aktif" : "Nonaktif",
        u.createdAt,
        u.updatedAt,
      ]),
    );
    return balasCsv(session, request, jenis, csv, "user");
  }

  if (jenis === "pengaduan") {
    const rows = await listPengaduan();
    const csv = toCsv(
      ["Kode", "Nama", "Kontak", "Kategori", "Isi", "Status", "Tanggapan", "Diajukan", "Diperbarui"],
      rows.map((p) => [
        p.kode,
        p.nama,
        p.kontak,
        p.kategori,
        p.isi,
        LABEL_STATUS_PENGADUAN[p.status as StatusPengaduan] ?? p.status,
        p.tanggapan ?? "",
        p.createdAt,
        p.updatedAt,
      ]),
    );
    return balasCsv(session, request, jenis, csv, "pengaduan");
  }

  if (jenis === "pegawai") {
    const rows = await listStaffAdmin();
    const csv = toCsv(
      ["Nama", "NIP", "Jabatan", "Unit", "Urutan", "Tampil", "Ada Foto"],
      rows.map((s) => [
        s.nama,
        s.nip ?? "",
        s.jabatan,
        s.unit,
        s.urutan,
        s.aktif ? "Ya" : "Tidak",
        s.fotoUrl ? "Ya" : "Tidak",
      ]),
    );
    return balasCsv(session, request, jenis, csv, "pegawai");
  }

  if (jenis === "subscriber") {
    const rows = await listSubscribers();
    const csv = toCsv(
      ["Nama", "Email", "Telepon", "Status", "Terdaftar"],
      rows.map((s) => [
        s.name,
        s.email,
        s.phone ?? "",
        s.isActive ? "Aktif" : "Nonaktif",
        s.subscribedAt,
      ]),
    );
    return balasCsv(session, request, jenis, csv, "subscriber");
  }

  if (jenis === "survei") {
    const rows = await listSurveys(10000);
    const csv = toCsv(
      [
        "Layanan",
        ...IKM_UNSUR.map((u) => u.label),
        "IKM",
        "Mutu",
        "Saran",
        "Nama",
        "Kontak",
        "Waktu",
      ],
      rows.map((s) => [
        s.layanan,
        s.u1,
        s.u2,
        s.u3,
        s.u4,
        s.u5,
        s.u6,
        s.u7,
        s.u8,
        s.u9,
        s.ikm,
        s.mutu,
        s.saran ?? "",
        s.nama ?? "",
        s.kontak ?? "",
        s.createdAt,
      ]),
    );
    return balasCsv(session, request, jenis, csv, "survei-ikm");
  }

  const rows = await listReservations();
  const csv = toCsv(
    [
      "Kode",
      "Nama",
      "Instansi",
      "Email",
      "Telepon",
      "Layanan",
      "Tanggal",
      "Mulai",
      "Selesai",
      "Peserta",
      "Keperluan",
      "Status",
      "Catatan Admin",
      "Diajukan",
    ],
    rows.map((r) => [
      r.kode,
      r.nama,
      r.instansi ?? "",
      r.email,
      r.telepon,
      r.layanan,
      r.tanggal,
      r.waktuMulai,
      r.waktuSelesai ?? "",
      r.jumlahPeserta,
      r.keperluan,
      r.status,
      r.catatanAdmin ?? "",
      r.createdAt,
    ]),
  );
  return balasCsv(session, request, jenis, csv, "reservasi");
}
