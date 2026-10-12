/**
 * Preloader — tirai pembuka saat portal pertama kali dibuka.
 *
 * Terinspirasi preloader situs lama (huruf "DISKOMINFOSP" berputar), versi
 * lebih halus: huruf masuk berurutan (flip 3D + kilau gradien) di atas cahaya
 * radial, lalu tirai memudar sendiri.
 *
 * Sengaja TANPA state React:
 *   - Tirai dirender di server, jadi langsung terlihat sejak cat pertama
 *     (tidak ada kedip "konten dulu, tirai belakangan").
 *   - Penyembunyian otomatis memakai animasi CSS (`preloader-auto-hide`),
 *     sehingga tetap hilang walau JavaScript gagal.
 *   - Skrip inline kecil menandai sesi tab: bila sudah pernah melihat tirai,
 *     `<html data-preloader="lewat">` membuat CSS menyembunyikannya seketika
 *     di muat ulang / navigasi berikutnya (tanpa kilatan).
 */
const KATA = "DISKOMINFOSP";

const SKRIP_SESI = `try{if(sessionStorage.getItem('diskominfosp:preloader')==='1'){document.documentElement.setAttribute('data-preloader','lewat')}else{sessionStorage.setItem('diskominfosp:preloader','1')}}catch(e){}`;

export function Preloader() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKRIP_SESI }} />
      <div
        className="preloader"
        role="status"
        aria-label="Memuat portal Diskominfo SP HST"
      >
        <div className="preloader__inner">
          <div className="preloader__word" aria-hidden="true">
            {Array.from(KATA).map((huruf, i) => (
              <span
                key={i}
                className="preloader__letter"
                style={{ animationDelay: `${0.06 * i}s` }}
              >
                <span
                  className="preloader__letter-inner"
                  style={{ animationDelay: `${0.06 * i}s` }}
                >
                  {huruf}
                </span>
              </span>
            ))}
          </div>
          <p className="preloader__tagline">
            Dinas Komunikasi, Informatika, Statistik dan Persandian
          </p>
          <div className="preloader__track" aria-hidden="true">
            <span className="preloader__bar" />
          </div>
        </div>
      </div>
    </>
  );
}
