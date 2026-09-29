-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusKepemilikanLahan" AS ENUM ('MS', 'SW', 'BH', 'TA', 'L');

-- CreateEnum
CREATE TYPE "SistemBudidaya" AS ENUM ('AF', 'MK');

-- CreateEnum
CREATE TYPE "JawabanGap" AS ENUM ('YA', 'TIDAK', 'KADANG');

-- CreateEnum
CREATE TYPE "SatuanProduksi" AS ENUM ('KG', 'SOLUP', 'BAMBU', 'KALENG');

-- CreateEnum
CREATE TYPE "JenisProdukDijual" AS ENUM ('CHERRY', 'GABAH_BASAH', 'GABAH_KERING', 'GB_WET_HULL', 'GB_NATURAL', 'GB_HONEY', 'GB_FULL_WASH', 'GB_WINE', 'LAINNYA');

-- CreateEnum
CREATE TYPE "KategoriPasar" AS ENUM ('KOMERSIAL', 'KOMERSIAL_BERSERTIFIKAT', 'SPECIALTY', 'ORGANIK', 'LAINNYA');

-- CreateEnum
CREATE TYPE "JenisPraktikGap" AS ENUM ('PEMANGKASAN_KOPI', 'PEMANGKASAN_NAUNGAN', 'PENGENDALIAN_GULMA', 'PEMUPUKAN', 'PEREMAJAAN_TANAMAN', 'PENGENDALIAN_PBKO', 'PENGENDALIAN_KARAT_DAUN', 'PESTISIDA_SESUAI_DOSIS', 'PENYIMPANAN_PESTISIDA', 'TERAS_SENGKEDAN', 'COVER_CROP', 'RORAK_RESAPAN', 'LIMBAH_PULP', 'PANEN_SELEKTIF', 'SORTASI_CHERRY', 'PENJEMURAN_BERSIH', 'PENYIMPANAN_HASIL', 'TANPA_BAKAR_LAHAN', 'TANPA_KIMIA_TERLARANG', 'APD_PESTISIDA', 'TANPA_PEKERJA_ANAK');

-- CreateEnum
CREATE TYPE "JenisKondisiKebun" AS ENUM ('KEPEMILIKAN_JELAS', 'BATAS_KONSERVASI', 'BATAS_HUTAN_LINDUNG', 'DEKAT_SUNGAI', 'DEKAT_MATA_AIR', 'POHON_NAUNGAN', 'KONSERVASI_TANAH', 'PERNAH_BAKAR_LAHAN', 'KONFLIK_SATWA', 'EROSI_LONGSOR');

-- CreateTable
CREATE TABLE "kelompok_tani" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "desa_kode" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kelompok_tani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petani" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "kode_petani" TEXT,
    "nama_lengkap" TEXT NOT NULL,
    "nama_panggilan" TEXT,
    "jenis_kelamin" "JenisKelamin",
    "tahun_lahir" INTEGER,
    "alamat_domisili" TEXT,
    "telepon" TEXT,
    "tanggal_pendaftaran" TIMESTAMP(3),
    "nama_petugas_pendaftar" TEXT,
    "kontak_darurat_nama" TEXT,
    "kontak_darurat_telepon" TEXT,
    "kontak_darurat_hubungan" TEXT,
    "desa_kode" TEXT NOT NULL,
    "kelompok_tani_id" TEXT,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "petani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_petani" (
    "id" TEXT NOT NULL,
    "nomor" INTEGER NOT NULL,
    "petani_id" TEXT NOT NULL,
    "nama_hamparan" TEXT,
    "varietas" TEXT,
    "tahun_tanam" INTEGER,
    "kode_gps" TEXT,
    "elevasi_mdpl" DOUBLE PRECISION,
    "kemiringan_persen" DOUBLE PRECISION,
    "luas_kopi_ha" DOUBLE PRECISION,
    "foto_key" TEXT,
    "foto_latitude" DOUBLE PRECISION,
    "foto_longitude" DOUBLE PRECISION,
    "status_kepemilikan" "StatusKepemilikanLahan",
    "sistem_budidaya" "SistemBudidaya",
    "area_konservasi" TEXT,
    "tanaman_baru" INTEGER,
    "pohon_produktif" INTEGER,
    "pohon_tidak_produktif" INTEGER,
    "pestisida_terakhir" TEXT,

    CONSTRAINT "plot_petani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanaman_naungan" (
    "id" TEXT NOT NULL,
    "plot_id" TEXT NOT NULL,
    "jenis" TEXT,
    "jumlah" INTEGER,
    "fungsi" TEXT,
    "pemangkasan_per_tahun" TEXT,
    "tahun_tanam" INTEGER,

    CONSTRAINT "tanaman_naungan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "praktik_gap" (
    "id" TEXT NOT NULL,
    "jenis" "JenisPraktikGap" NOT NULL,
    "jawaban" "JawabanGap",
    "keterangan" TEXT,
    "petani_id" TEXT NOT NULL,

    CONSTRAINT "praktik_gap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "riwayat_produksi" (
    "id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "satuan" "SatuanProduksi",
    "cherry" DOUBLE PRECISION,
    "gabah_basah" DOUBLE PRECISION,
    "gabah_kering" DOUBLE PRECISION,
    "green_bean" DOUBLE PRECISION,
    "produktivitas" DOUBLE PRECISION,
    "petani_id" TEXT NOT NULL,

    CONSTRAINT "riwayat_produksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produk_dijual" (
    "id" TEXT NOT NULL,
    "jenis" "JenisProdukDijual" NOT NULL,
    "label_custom" TEXT,
    "dijual" BOOLEAN NOT NULL DEFAULT false,
    "volume_kg_tahun" DOUBLE PRECISION,
    "petani_id" TEXT NOT NULL,

    CONSTRAINT "produk_dijual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pasar_petani" (
    "id" TEXT NOT NULL,
    "kategori" "KategoriPasar" NOT NULL,
    "label_custom" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT false,
    "persentase" DOUBLE PRECISION,
    "profil_penjual" TEXT,
    "petani_id" TEXT NOT NULL,

    CONSTRAINT "pasar_petani_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kondisi_kebun" (
    "id" TEXT NOT NULL,
    "jenis" "JenisKondisiKebun" NOT NULL,
    "jawaban" BOOLEAN NOT NULL DEFAULT false,
    "keterangan" TEXT,
    "petani_id" TEXT NOT NULL,

    CONSTRAINT "kondisi_kebun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kelompok_tani_desa_kode_kode_key" ON "kelompok_tani"("desa_kode", "kode");

-- CreateIndex
CREATE UNIQUE INDEX "petani_kode_petani_key" ON "petani"("kode_petani");

-- CreateIndex
CREATE INDEX "petani_created_by_id_idx" ON "petani"("created_by_id");

-- CreateIndex
CREATE INDEX "petani_desa_kode_idx" ON "petani"("desa_kode");

-- CreateIndex
CREATE INDEX "plot_petani_petani_id_idx" ON "plot_petani"("petani_id");

-- CreateIndex
CREATE INDEX "tanaman_naungan_plot_id_idx" ON "tanaman_naungan"("plot_id");

-- CreateIndex
CREATE UNIQUE INDEX "praktik_gap_petani_id_jenis_key" ON "praktik_gap"("petani_id", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "riwayat_produksi_petani_id_tahun_key" ON "riwayat_produksi"("petani_id", "tahun");

-- CreateIndex
CREATE INDEX "produk_dijual_petani_id_idx" ON "produk_dijual"("petani_id");

-- CreateIndex
CREATE INDEX "pasar_petani_petani_id_idx" ON "pasar_petani"("petani_id");

-- CreateIndex
CREATE UNIQUE INDEX "kondisi_kebun_petani_id_jenis_key" ON "kondisi_kebun"("petani_id", "jenis");

-- AddForeignKey
ALTER TABLE "kelompok_tani" ADD CONSTRAINT "kelompok_tani_desa_kode_fkey" FOREIGN KEY ("desa_kode") REFERENCES "wilayah_desa"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petani" ADD CONSTRAINT "petani_desa_kode_fkey" FOREIGN KEY ("desa_kode") REFERENCES "wilayah_desa"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petani" ADD CONSTRAINT "petani_kelompok_tani_id_fkey" FOREIGN KEY ("kelompok_tani_id") REFERENCES "kelompok_tani"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petani" ADD CONSTRAINT "petani_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_petani" ADD CONSTRAINT "plot_petani_petani_id_fkey" FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanaman_naungan" ADD CONSTRAINT "tanaman_naungan_plot_id_fkey" FOREIGN KEY ("plot_id") REFERENCES "plot_petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "praktik_gap" ADD CONSTRAINT "praktik_gap_petani_id_fkey" FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riwayat_produksi" ADD CONSTRAINT "riwayat_produksi_petani_id_fkey" FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produk_dijual" ADD CONSTRAINT "produk_dijual_petani_id_fkey" FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pasar_petani" ADD CONSTRAINT "pasar_petani_petani_id_fkey" FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kondisi_kebun" ADD CONSTRAINT "kondisi_kebun_petani_id_fkey" FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;
