# CLAUDE.md

Panduan kerja untuk agent/AI di repo **Database Kopi** (Caritas Kopi). Baca ini
dulu sebelum menyentuh kode — konteks, konvensi, dan aturan desain sudah
dirangkum di sini supaya tidak perlu dijelaskan ulang dari nol.

---

## 1. Apa proyek ini

Aplikasi web pendataan **baseline desa & petani kopi** (proyek PKL). Enumerator
mengisi data lapangan lewat formulir; **admin** melihat analitik agregat dan
mengelola akun. Data bisa diekspor ke PDF/DOCX.

Dua peran:
- **ENUMERATOR** — hanya input & melihat data miliknya sendiri.
- **ADMIN** — melihat seluruh data, mengelola pengguna, dan **satu-satunya yang
  boleh mengakses analitik**.

Prinsip akses: enumerator fokus mengisi data; semua analitik = ADMIN-only,
dijaga di UI (nav) **dan** di server (setiap halaman/aksi cek role).

---

## 2. Perintah

```bash
npm run dev            # next dev (Turbopack)
npm run build          # prisma generate && next build
npm run lint           # eslint 9
npx tsc --noEmit       # typecheck (wajib bersih sebelum selesai)
npm run seed           # admin user dari .env
npm run seed:wilayah   # hierarki wilayah dari prisma/data/wilayah.sql
npm run seed:all       # wilayah + admin
npx tsx prisma/seed-sample.ts   # data contoh (5 desa/petani/kelompok, prefix SAMPEL-)
```

Sebelum menganggap selesai: **`npx tsc --noEmit` + `npm run lint` + `npm run build`
harus bersih.** Hanya boleh ada 0 error; warning pun usahakan nol.

> Catatan: script `seed-sample.ts` belum terdaftar di `package.json`; jalankan
> langsung dengan `tsx`. Data contoh memakai prefix `SAMPEL-` agar mudah dibersihkan.

---

## 3. Stack

- **Next.js 16** (App Router, Turbopack, RSC) + **React 19** — semua mutasi lewat
  **Server Actions**, bukan API route (kecuali kasus khusus di bawah).
- **TypeScript 5** strict, alias `@/*` → `./*`.
- **Tailwind CSS 4** (CSS-first, `@theme` di `app/globals.css`). Tema warna: **jade**.
- **Prisma 6** dengan adapter `@prisma/adapter-pg` (engine-less, pakai driver `pg`).
  Client **di-generate ke `app/generated/prisma`** (gitignored) — import dari
  `@/app/generated/prisma/client` (dan `/enums`), **bukan** `@prisma/client`.
- **NextAuth v5 beta** (Credentials + JWT, bcrypt).
- **recharts** (chart analitik), **leaflet/react-leaflet** (peta),
  **lucide-react** (ikon), **sharp** + **Cloudflare R2** (`aws4fetch`) untuk foto,
  **@react-pdf/renderer** & **docx** untuk ekspor.

---

## 4. Arsitektur & pola

### Autentikasi & proteksi rute
- `auth.ts` — instance NextAuth: provider Credentials, verifikasi bcrypt,
  callback menyuntik `id` + `role` ke token & session.
- `auth.config.ts` — konfigurasi (pages, strategi JWT, callbacks).
- `proxy.ts` — middleware NextAuth; melindungi semua rute kecuali
  `/api/*`, aset statis, dan `/login`.
- `types/next-auth.d.ts` — augmentasi tipe session (`id`, `role`).
- **Pola guard halaman admin** (ikuti persis):
  ```ts
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  ```

### Akses data
- `lib/prisma.ts` — singleton `PrismaClient` + `PrismaPg` adapter.
- Query server ada di file `queries.ts` per modul (mis.
  `app/(main)/analitik/queries.ts`, `app/(main)/desa/queries.ts`).
- Sertakan `createdById: session.user.id` untuk scope enumerator; admin tanpa scope.

### Server Actions
- Semua CRUD = fungsi `"use server"` di `actions.ts` (mis.
  `app/(main)/petani/actions.ts`). Redirect setelah sukses.
- Form client pakai `useActionState`; tombol submit memakai komponen
  `SubmitButton` bersama.

### Ekspor
- PDF: `.../export/pdf/` (`@react-pdf/renderer`), DOCX: `.../export/docx/`.
- Foto di dalam PDF diambil lewat proxy terautentikasi `/api/foto/[key]`.

### Unggah foto
- `/api/upload` → Sharp (EXIF rotate, resize ≤1920px, WebP 90%) → PUT ke R2.
- Disajikan lewat `/api/foto/[...key]` (memblokir path traversal & key di luar prefix `petani/`).

### API routes (yang tersisa)
`/api/auth`, `/api/upload`, `/api/foto`, `/api/wilayah` (lookup wilayah cascading),
`/api/kelompok-tani` (fetch by kode desa). Selain ini, pakai Server Action.

---

## 5. Peta direktori

```text
app/
├─ (main)/                     # layout terautentikasi (NavRail + cek session)
│  ├─ page.tsx                 # Dashboard: admin = analitik, enumerator = input
│  ├─ nav-rail.tsx             # Rail desktop (collapsible) + drawer mobile
│  ├─ analitik/                # ANALITIK (ADMIN-only)
│  │  ├─ queries.ts            # Agregasi Prisma (getRingkasan, getGapAdoption, ...)
│  │  ├─ _components/
│  │  │  ├─ charts.tsx         # Wrapper recharts (Bar/HBar/Line/Donut/Stacked/Proportion)
│  │  │  ├─ analytics-ui.tsx   # ChartCard, StatTile, Meter, RankList, fmt()
│  │  │  ├─ palette.ts         # SERIES, ACCENT, warna axis/grid
│  │  │  ├─ map.tsx / map-inner.tsx
│  │  ├─ gap|agronomi|produksi|pasar|konservasi|wilayah|peta/page.tsx
│  │  └─ loading.tsx           # Skeleton
│  ├─ petani/  desa/  kelompok-tani/   # CRUD per modul (page/form/actions/queries/export)
│  ├─ admin/users/             # Kelola pengguna (ADMIN-only)
│  ├─ _components/             # Primitif UI bersama (lihat §7)
│  └─ layout-cls.ts            # pageWide / pageForm
├─ login/                      # Kartu login 2 kolom + toggle tema
├─ _components/theme-toggle.tsx
├─ globals.css                 # @theme jade + dark mode
└─ layout.tsx                  # Root: font Geist, metadata, skrip anti-flash tema
lib/       prisma.ts, r2.ts
prisma/    schema.prisma, migrations/, seed*.ts, data/wilayah.sql
```

---

## 6. Model data (ringkas)

`User`, hierarki wilayah (`WilayahProvinsi→Kabupaten→Kecamatan→Desa`),
`BaselineDesa` (+ `KebijakanDesa`, `KelembagaanDesa`), `KelompokTani`,
`Petani` (+ `PlotPetani`, `TanamanNaungan`, `PraktikGap`, `RiwayatProduksi`,
`ProdukDijual`, `PasarPetani`, `KondisiKebun`).

Konstanta label & enum Indonesia ada di `app/(main)/petani/constants.ts`
(`GAP_GROUPS`, `KONDISI_KEBUN`, `PRODUK`, `PASAR`, `TAHUN_PRODUKSI`,
`STATUS_KEPEMILIKAN`, ...) dan `app/(main)/desa/constants.ts` (`KEBIJAKAN`,
`LEMBAGA`). **Selalu pakai konstanta ini** untuk label, jangan hardcode.

---

## 7. Primitif UI bersama (`app/(main)/_components/`)

- `ui.tsx` — `inputCls`, `Section`, `SubSection`, `Grid`, `Field`,
  `FieldUnitSelect`, `Skeleton`/`ListSkeleton`/`AnalyticsSkeleton`.
- `modal.tsx` — **satu-satunya** dialog. Punya focus trap, Esc, restore fokus,
  ARIA (`role="dialog"`, `aria-modal`, `aria-labelledby`). Jangan bikin overlay manual.
- `submit-button.tsx` — tombol submit + modal daftar kolom kosong (wajib/opsional).
- `delete-button.tsx` — tombol hapus + konfirmasi via `Modal`.
- `unsaved-guard.tsx` — cegah kehilangan data saat keluar form.
- `combobox.tsx`, `date-picker.tsx`, `yes-no.tsx` (Segmented/YesNoField/YesNoRow),
  `wilayah-select.tsx`, `action-form.tsx`, `navigation-progress.tsx`.

Loading state: tambahkan `loading.tsx` per segmen (pakai `ListSkeleton` /
`AnalyticsSkeleton`) untuk rute server yang lambat.

---

## 8. ATURAN DESAIN (penting — ini preferensi eksplisit pemilik)

Ini bukan selera bebas. Ikuti ketat:

1. **Jangan warna-warni berlebihan.** Pewarnaan harus punya *tujuan*, bukan dekorasi.
   Hal-hal yang dilarang:
   - Strip warna aksen di pinggir card ("sangat AI").
   - Mewarnai ikon di nav rail.
   - Mewarnai semua card / semua elemen.
2. **Highlight = 1-2 kartu penting saja.** Cara highlight: ganti latar kartu dari
   putih jadi warna utama (jade solid) dan sesuaikan warna teksnya agar terbaca.
   Gunakan prop `highlight` di `StatTile`. Sisanya tetap putih.
   Setiap halaman analitik menandai **satu** `StatTile` terpentingnya dengan `highlight`.
3. **Kurangi ikon yang tidak perlu.** Jangan pasang ikon dekoratif di judul
   halaman — judul sudah menjelaskannya.
4. **Legend chart urut: Tidak → Kadang → Ya** (merah → oranye → hijau).
5. **Tooltip chart wajib berlatar putih** (lihat `tooltipStyle` di `charts.tsx`).
6. **Jangan pakai em dash (—) / en dash (–).** Pakai tanda hubung pendek `-`.
   (Sudah disapu di seluruh repo; jaga agar tidak muncul lagi.)
7. **Data teks bebas tahan beda huruf besar/kecil.** Untuk field free-text
   (varietas, tanaman naungan, pestisida, label "Lainnya" produk/pasar, praktik
   konservasi, satwa, dsb.) lakukan grouping **case-insensitive** (lowercase key,
   lalu pilih ejaan yang paling sering muncul). Helper ada di `analitik/queries.ts`
   (`ci`, `tally`, `pickSpelling`).
8. **Placeholder "-" tidak dihitung** dalam statistik. Helper `clean()` di
   `analitik/queries.ts` membuang nilai kosong/`"-"`.
9. **Halaman login**: satu kartu di tengah (bukan full layar), dibagi 2 kolom;
   kolom kiri hanya daftar fitur singkat — **jangan mengarang copy/marketing**.
10. **Toggle tema ada di atas tombol logout** (nav rail expanded & collapsed,
    juga drawer mobile) dan di pojok kanan atas kartu login.

---

## 9. Tema & dark mode

- Warna jade didefinisikan di `@theme` (`app/globals.css`). Pakai kelas
  `bg-jade-*` / `text-jade-*`; jangan tambah palet baru sembarangan.
- **Dark mode = class-based** (`@custom-variant dark`). Skrip inline di
  `app/layout.tsx` menambah `.dark` sebelum paint (anti-flash).
- **Strategi dark mode: remap token, bukan `dark:` di tiap elemen.**
  Tailwind v4 meng-compile `bg-white` → `var(--color-white)`, jadi di `globals.css`
  blok `.dark` membalik nilai `--color-gray-*` dan `--color-jade-*` (teks jadi
  terang, latar jadi gelap) secara otomatis. Untuk kelas yang memakai satu token
  sebagai **dua peran** (mis. `bg-white` vs `text-white`, `bg-jade-800` vs
  `text-jade-800`), tambahkan override eksplisit `.dark .kelas { ... }` **di luar
  `@layer`** agar menang cascade. Ikuti pola yang sudah ada.
- Default mengikuti **preferensi OS** (`prefers-color-scheme`), kecuali pengguna
  pernah memilih manual (tersimpan di `localStorage` key `theme`).
- Komponen toggle: `app/_components/theme-toggle.tsx` (pakai `useSyncExternalStore`).
- Untuk warna chart di dark mode, jaga kontras teks sumbu (`MUTED` di `palette.ts`).

---

## 10. Gotcha / jebakan

- **ESLint `react-hooks/set-state-in-effect`**: jangan `setState` di body `useEffect`.
  Untuk membaca state eksternal (kelas DOM, localStorage), pakai
  `useSyncExternalStore` (lihat `theme-toggle.tsx`).
- **ESLint `react-hooks/static-components`**: jangan definisikan komponen di dalam
  komponen lain — pindahkan ke module scope (mis. `PropTip` di `charts.tsx`).
- **Prisma client path**: import dari `@/app/generated/prisma/client`, bukan
  `@prisma/client`. Jalankan `npx prisma generate` (atau `npm run build`) bila tipe hilang.
- **Aksesibilitas**: setiap tombol ikon butuh `aria-label` (bukan hanya `title`);
  item nav aktif pakai `aria-current="page"`; hormati `prefers-reduced-motion`
  (sudah ada blok global di `globals.css`).
- **Kontras**: hindari `text-gray-400` untuk teks bermakna (gagal WCAG AA). Pakai
  `text-gray-500`+ untuk teks kecil; simpan `gray-400` hanya untuk dekoratif.
- **Layout mobile**: rail nav tersembunyi di bawah `md`; ada tombol hamburger +
  drawer. Konten utama pakai `pt-16 md:pt-10` (lihat `layout-cls.ts`) agar tidak
  tertutup tombol.

---

## 11. Keamanan

- **JANGAN pernah commit atau menampilkan isi `.env` / `.env.prod`** (berisi
  `AUTH_SECRET`, `ADMIN_PASSWORD`, kredensial R2). `.env*` sudah di `.gitignore`
  kecuali `.env.example`.
- Jangan hardcode rahasia; selalu lewat env.
- Validasi input di batas kepercayaan (form & API); jangan andalkan validasi UI saja.

---

## 12. Sebelum menandai tugas selesai

1. `npx tsc --noEmit` → bersih.
2. `npm run lint` → tanpa error (warning usahakan nol).
3. `npm run build` → sukses.
4. Cek konsistensi dengan aturan desain (§8) dan dark mode (§9).
5. Untuk perubahan data/agregasi, verifikasi terhadap isi DB nyata bila memungkinkan.
