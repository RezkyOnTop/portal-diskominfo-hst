import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RadioPlayerProvider } from "@/components/layout/RadioPlayerProvider";
import { BackToTop } from "@/components/layout/BackToTop";
import { ComboMelayang } from "@/components/chat/ComboMelayang";
import { VisitorBeacon } from "@/components/analytics/VisitorBeacon";
import { Preloader } from "@/components/layout/Preloader";
import { NavProgress } from "@/components/layout/NavProgress";

/**
 * Layout publik — SEMUA halaman situs (beranda, berita, layanan, dsb).
 *
 * Chrome publik tinggal di sini, bukan di root layout, agar area dashboard
 * (`app/(admin)`) tidak ikut memuat navbar, footer, preloader, tombol radio,
 * maupun chat melayang.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <RadioPlayerProvider>
      <Preloader />
      <NavProgress />
      <Navbar />
      <main id="konten-utama" className="flex-1 pb-16">
        {children}
      </main>
      <Footer />
      <BackToTop />
      <ComboMelayang />
      <VisitorBeacon />
    </RadioPlayerProvider>
  );
}
