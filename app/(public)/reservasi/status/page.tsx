import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/layout/Container";
import { CekStatusForm } from "@/components/reservasi/CekStatusForm";

export const metadata: Metadata = {
  title: "Cek Status Reservasi",
  description:
    "Pantau status permohonan reservasi layanan Diskominfo SP Kabupaten Hulu Sungai Tengah menggunakan kode lacak.",
};

export default function StatusReservasiPage() {
  return (
    <>
      <PageHeader
        title="Cek Status Reservasi"
        eyebrow="Layanan Publik"
        crumbs={[{ label: "Layanan", href: "/layanan" }, { label: "Reservasi", href: "/reservasi" }, { label: "Cek Status" }]}
      >
        Masukkan kode lacak yang Anda terima saat mengirim permohonan untuk melihat
        status verifikasinya.
      </PageHeader>

      <Container className="py-10">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-card)] border border-neutral-200 bg-white p-6 shadow-[var(--shadow-card)] dark:border-slate-700 dark:bg-slate-900">
          <CekStatusForm />
        </div>
      </Container>
    </>
  );
}
