-- CreateEnum
CREATE TYPE "SatuanTutupan" AS ENUM ('PERSEN', 'HA');

-- CreateEnum
CREATE TYPE "JenisKebijakan" AS ENUM ('RPJM_DESA', 'PERDES_PERTANIAN', 'PERDES_PERLINDUNGAN_HUTAN', 'PROGRAM_PERKEMBANGAN_KOPI', 'PROGRAM_KOPERASI', 'PROGRAM_PERHUTANAN_SOSIAL');

-- CreateEnum
CREATE TYPE "JenisLembaga" AS ENUM ('KELOMPOK_TANI', 'GAPOKTAN', 'KOPERASI', 'BUMDES', 'PENYULUH', 'PENDAMPING');

-- CreateTable
CREATE TABLE "wilayah_provinsi" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "wilayah_provinsi_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "wilayah_kabupaten" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "provinsi_kode" TEXT NOT NULL,

    CONSTRAINT "wilayah_kabupaten_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "wilayah_kecamatan" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kabupaten_kode" TEXT NOT NULL,

    CONSTRAINT "wilayah_kecamatan_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "wilayah_desa" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kecamatan_kode" TEXT NOT NULL,

    CONSTRAINT "wilayah_desa_pkey" PRIMARY KEY ("kode")
);

-- CreateTable
CREATE TABLE "baseline_desa" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "tahun_pendataan" INTEGER NOT NULL,
    "sumber_data" TEXT,
    "desa_kode" TEXT NOT NULL,
    "luas_wilayah_ha" DOUBLE PRECISION,
    "jumlah_penduduk" INTEGER,
    "jumlah_kk" INTEGER,
    "jumlah_petani_kopi" INTEGER,
    "luas_areal_kopi_ha" DOUBLE PRECISION,
    "luas_komoditi_lain_ha" DOUBLE PRECISION,
    "koordinat_desa" TEXT,
    "topografi" TEXT,
    "ketinggian_mdpl" DOUBLE PRECISION,
    "bulan_hujan" TEXT,
    "bulan_kering" TEXT,
    "suhu_rata_rata_c" DOUBLE PRECISION,
    "jenis_tanah" TEXT,
    "akses_jalan" TEXT,
    "jarak_ibukota_kecamatan_km" DOUBLE PRECISION,
    "jarak_pasar_km" DOUBLE PRECISION,
    "jarak_konservasi_km" DOUBLE PRECISION,
    "luas_apl_ha" DOUBLE PRECISION,
    "nama_kawasan_konservasi" TEXT,
    "produktivitas_kg_ha_tahun" DOUBLE PRECISION,
    "harga_cherry_rp" INTEGER,
    "harga_green_bean_rp_kg" INTEGER,
    "pembeli_utama" TEXT,
    "jumlah_pedagang_pengumpul" INTEGER,
    "koperasi_aktif_unit" INTEGER,
    "eksportir" TEXT,
    "industri_pengolahan" TEXT,
    "permasalahan_utama" TEXT,
    "berbatasan_konservasi" BOOLEAN,
    "luas_penyangga_ha" DOUBLE PRECISION,
    "tutupan_hutan" DOUBLE PRECISION,
    "tutupan_hutan_satuan" "SatuanTutupan",
    "tutupan_agroforestry" DOUBLE PRECISION,
    "tutupan_agroforestry_satuan" "SatuanTutupan",
    "rawan_longsor" BOOLEAN,
    "lokasi_rawan_longsor" TEXT,
    "rawan_erosi" BOOLEAN,
    "lokasi_rawan_erosi" TEXT,
    "konflik_satwa" BOOLEAN,
    "jenis_satwa_konflik" TEXT,
    "praktik_konservasi" TEXT,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "baseline_desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kebijakan_desa" (
    "id" TEXT NOT NULL,
    "jenis" "JenisKebijakan" NOT NULL,
    "ada" BOOLEAN NOT NULL DEFAULT false,
    "keterangan" TEXT,
    "baseline_id" TEXT NOT NULL,

    CONSTRAINT "kebijakan_desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kelembagaan_desa" (
    "id" TEXT NOT NULL,
    "jenis" "JenisLembaga" NOT NULL,
    "nama_lembaga" TEXT,
    "jumlah" INTEGER,
    "kondisi" TEXT,
    "baseline_id" TEXT NOT NULL,

    CONSTRAINT "kelembagaan_desa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wilayah_kabupaten_provinsi_kode_idx" ON "wilayah_kabupaten"("provinsi_kode");

-- CreateIndex
CREATE INDEX "wilayah_kecamatan_kabupaten_kode_idx" ON "wilayah_kecamatan"("kabupaten_kode");

-- CreateIndex
CREATE INDEX "wilayah_desa_kecamatan_kode_idx" ON "wilayah_desa"("kecamatan_kode");

-- CreateIndex
CREATE UNIQUE INDEX "baseline_desa_desa_kode_key" ON "baseline_desa"("desa_kode");

-- CreateIndex
CREATE INDEX "baseline_desa_created_by_id_idx" ON "baseline_desa"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "kebijakan_desa_baseline_id_jenis_key" ON "kebijakan_desa"("baseline_id", "jenis");

-- AddForeignKey
ALTER TABLE "wilayah_kabupaten" ADD CONSTRAINT "wilayah_kabupaten_provinsi_kode_fkey" FOREIGN KEY ("provinsi_kode") REFERENCES "wilayah_provinsi"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wilayah_kecamatan" ADD CONSTRAINT "wilayah_kecamatan_kabupaten_kode_fkey" FOREIGN KEY ("kabupaten_kode") REFERENCES "wilayah_kabupaten"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wilayah_desa" ADD CONSTRAINT "wilayah_desa_kecamatan_kode_fkey" FOREIGN KEY ("kecamatan_kode") REFERENCES "wilayah_kecamatan"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baseline_desa" ADD CONSTRAINT "baseline_desa_desa_kode_fkey" FOREIGN KEY ("desa_kode") REFERENCES "wilayah_desa"("kode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baseline_desa" ADD CONSTRAINT "baseline_desa_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kebijakan_desa" ADD CONSTRAINT "kebijakan_desa_baseline_id_fkey" FOREIGN KEY ("baseline_id") REFERENCES "baseline_desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kelembagaan_desa" ADD CONSTRAINT "kelembagaan_desa_baseline_id_fkey" FOREIGN KEY ("baseline_id") REFERENCES "baseline_desa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
