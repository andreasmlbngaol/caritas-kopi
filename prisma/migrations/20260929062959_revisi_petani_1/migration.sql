/*
  Warnings:

  - You are about to drop the column `tahun_lahir` on the `petani` table. All the data in the column will be lost.
  - You are about to drop the column `pestisida_terakhir` on the `plot_petani` table. All the data in the column will be lost.
  - You are about to drop the column `pemangkasan_per_tahun` on the `tanaman_naungan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "petani" DROP COLUMN "tahun_lahir",
ADD COLUMN     "tanggal_lahir" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "plot_petani" DROP COLUMN "pestisida_terakhir",
ADD COLUMN     "pestisida_bulan_tahun" TEXT,
ADD COLUMN     "pestisida_nama" TEXT;

-- AlterTable
ALTER TABLE "tanaman_naungan" DROP COLUMN "pemangkasan_per_tahun",
ADD COLUMN     "pemangkasan" BOOLEAN,
ADD COLUMN     "produksi_per_tahun" TEXT;
