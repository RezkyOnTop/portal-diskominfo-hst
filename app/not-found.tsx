import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-heading text-6xl font-bold text-primary-600">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold text-neutral-900">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-neutral-600">
        Halaman yang Anda cari mungkin telah dipindahkan atau tidak tersedia.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
