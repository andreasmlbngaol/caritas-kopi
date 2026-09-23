/*
  Warnings:

  - You are about to drop the column `koordinat_desa` on the `baseline_desa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "baseline_desa" DROP COLUMN "koordinat_desa",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
