/**
 * Seed data pegawai dari publikasi resmi situs lama
 * (https://diskominfosp.hstkab.go.id/profil/data-pegawai, diambil 2026-09-28).
 *
 * Jalankan SEKALI dari folder proyek:
 *   npm run seed:pegawai
 *
 * Idempoten: bila tabel Staff sudah berisi data, skrip berhenti tanpa mengubah.
 * NIP dikosongkan karena situs lama memang belum mengisinya ("NIP. -") —
 * admin bisa mengisinya lewat /dashboard/pegawai.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DATA = [
  { nama: "Darkuni, S.Hut", jabatan: "Kepala Dinas", unit: "Kepala Dinas" },
  { nama: "H. Supriyanto, S.AP., M.M", jabatan: "Sekretaris Dinas", unit: "Sekretaris" },
  { nama: "Ardoko, S.PKP", jabatan: "Kepala Bidang Informatika dan Persandian", unit: "Kepala Bidang & Sub Bagian" },
  { nama: "Citra Hapsari Puspita Langen, SE", jabatan: "Kepala Bidang Data dan Statistik", unit: "Kepala Bidang & Sub Bagian" },
  { nama: "Imam Chudhori, S.Hut", jabatan: "Kepala Bidang Komunikasi dan Informasi Publik", unit: "Kepala Bidang & Sub Bagian" },
  { nama: "Muhammad Freddy Pratama Putra, S.Kom", jabatan: "Kepala Sub Bagian Umum dan Kepegawaian", unit: "Kepala Bidang & Sub Bagian" },
  { nama: "Noorina Shelpy, A.Md", jabatan: "Kepala Sub Bagian Keuangan", unit: "Kepala Bidang & Sub Bagian" },
  { nama: "Mahyu Ryles, S.Sos", jabatan: "Pranata Komputer Ahli Muda", unit: "Staf PNS" },
  { nama: "Erwan Renaldie, A.Md", jabatan: "Bendahara", unit: "Staf PNS" },
  { nama: "Gusti Nor Ihwan", jabatan: "Bendahara", unit: "Staf PNS" },
  { nama: "Yusof Zaky, S.Kom", jabatan: "Analis Sistem Informasi Jaringan", unit: "Staf PNS" },
  { nama: "Ahmad Hakim, S.Kom", jabatan: "Analis Statistik", unit: "Staf PNS" },
  { nama: "Bagus Yudha Purnama, A.Md", jabatan: "Pengelola Sistem dan Jaringan", unit: "Staf PNS" },
  { nama: "Shely Adlini, S.Mat", jabatan: "Sandiman Ahli Pertama", unit: "Staf PNS" },
  { nama: "Abid Rahmatullah, S.Akun", jabatan: "Perencana Ahli Pertama", unit: "Staf PNS" },
  { nama: "Steven Riyadh Akbar, S.Pd.", jabatan: "Pranata Hubungan Masyarakat Ahli Pertama", unit: "Staf PNS" },
  { nama: "Muhammad Amrullah, S.Kom", jabatan: "Pranata Komputer — Ahli Pertama", unit: "Staf PPPK" },
  { nama: "Aziza Dwilestari, A.Md.Kom", jabatan: "Pranata Komputer — Terampil", unit: "Staf PPPK" },
  { nama: "Zainal Arifin, A.Md", jabatan: "Pranata Komputer — Terampil", unit: "Staf PPPK" },
  { nama: "Fahmi Setiawan, S.Kom", jabatan: "Pranata Komputer — Ahli Pertama", unit: "Staf PPPK" },
  { nama: "Setiawan Randhy, S.Kom", jabatan: "Pranata Komputer — Ahli Pertama", unit: "Staf PPPK" },
  { nama: "Heru Dwi Sugiyono, A.Md.Kom", jabatan: "Pranata Komputer — Terampil", unit: "Staf PPPK" },
  { nama: "M. Adly Hidayat, S.Kom", jabatan: "Pranata Komputer — Ahli Pertama", unit: "Staf PPPK" },
  { nama: "Muhammad Fauzani, S.Kom", jabatan: "Pranata Komputer — Ahli Pertama", unit: "Staf PPPK" },
  { nama: "Muhammad Zaki Fuad, S.Kom", jabatan: "Penata Layanan Operasional", unit: "Staf PPPK" },
  { nama: "M. Rizal Fahniadi, S.Kom", jabatan: "Penata Layanan Operasional", unit: "Staf PPPK" },
  { nama: "Fazriatul Shahadatun Najmi, S.Kom", jabatan: "Penata Layanan Operasional", unit: "Staf PPPK" },
  { nama: "Nadiya Maulida, S.Pd", jabatan: "Operator Komputer", unit: "Staf PPPK" },
  { nama: "Ikhsan Surya", jabatan: "Pengadministrasi Perkantoran", unit: "Staf PPPK" },
  { nama: "Muhammadnoor Rijal, S.Kom", jabatan: "Tenaga Programmer", unit: "Tenaga Outsourcing" },
  { nama: "Muhammad Aldi Prasetyo, S.Kom", jabatan: "Teknis Peliputan & Publikasi (Fotografer & Videografer)", unit: "Tenaga Outsourcing" },
  { nama: "Muhammad Amien Ridho", jabatan: "Teknis Peliputan & Publikasi (Video Editor)", unit: "Tenaga Outsourcing" },
  { nama: "Muhammad Tajuddin Subqi", jabatan: "Tenaga Peliputan", unit: "Tenaga Outsourcing" },
  { nama: "Noor Anisa, S.Kom", jabatan: "Teknis Peliputan & Publikasi (Social Media Specialist)", unit: "Tenaga Outsourcing" },
  { nama: "Shalehah", jabatan: "Penyiar Radio", unit: "Tenaga Outsourcing" },
  { nama: "Khadijah", jabatan: "Penyiar Radio", unit: "Tenaga Outsourcing" },
  { nama: "Maulida Hasanah", jabatan: "Teknis Peliputan & Publikasi (Social Media Specialist)", unit: "Tenaga Outsourcing" },
  { nama: "Norbaiti Ariyani, A.Md.Kom.", jabatan: "Operator Monitoring Opini Publik", unit: "Tenaga Outsourcing" },
  { nama: "Dea Amanda Chintya Putri, A.Md.Kom.", jabatan: "Operator Satu Data HST", unit: "Tenaga Outsourcing" },
  { nama: "Muhammad Hidayat", jabatan: "Teknis Peliputan & Publikasi (Fotografer & Videografer)", unit: "Tenaga Outsourcing" },
  { nama: "Badalani", jabatan: "Teknis Peliputan & Publikasi (Video Editor)", unit: "Tenaga Outsourcing" },
];

async function main() {
  const sudah = await prisma.staff.count();
  if (sudah > 0) {
    console.log(`Tabel Staff sudah berisi ${sudah} baris — seed dibatalkan (idempoten).`);
    return;
  }
  const perUnit = {};
  for (const [i, d] of DATA.entries()) {
    const n = (perUnit[d.unit] ?? 0) + 1;
    perUnit[d.unit] = n;
    await prisma.staff.create({
      data: { nama: d.nama, jabatan: d.jabatan, unit: d.unit, urutan: n * 10 + i },
    });
  }
  const total = await prisma.staff.count();
  console.log(`Seed pegawai selesai: ${total} baris.`);
}

main()
  .catch((e) => {
    console.error("Seed pegawai gagal:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
