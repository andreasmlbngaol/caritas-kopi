-- Preserve current single planting year as a one-item list.
ALTER TABLE "plot_petani"
  ALTER COLUMN "tahun_tanam" TYPE INTEGER[]
  USING CASE
    WHEN "tahun_tanam" IS NULL THEN ARRAY[]::INTEGER[]
    ELSE ARRAY["tahun_tanam"]
  END;
ALTER TABLE "plot_petani"
  ALTER COLUMN "tahun_tanam" SET DEFAULT ARRAY[]::INTEGER[],
  ALTER COLUMN "tahun_tanam" SET NOT NULL;

-- Move shade records to farmer ownership while preserving every row.
ALTER TABLE "tanaman_naungan" ADD COLUMN "petani_id" TEXT;
UPDATE "tanaman_naungan" AS shade
SET "petani_id" = plot."petani_id"
FROM "plot_petani" AS plot
WHERE shade."plot_id" = plot."id";

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "tanaman_naungan" WHERE "petani_id" IS NULL) THEN
    RAISE EXCEPTION 'Cannot migrate shade rows: one or more plot owners were not found';
  END IF;
END $$;

ALTER TABLE "tanaman_naungan" ALTER COLUMN "petani_id" SET NOT NULL;
CREATE INDEX "tanaman_naungan_petani_id_idx" ON "tanaman_naungan"("petani_id");
ALTER TABLE "tanaman_naungan"
  ADD CONSTRAINT "tanaman_naungan_petani_id_fkey"
  FOREIGN KEY ("petani_id") REFERENCES "petani"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tanaman_naungan" DROP CONSTRAINT "tanaman_naungan_plot_id_fkey";
DROP INDEX "tanaman_naungan_plot_id_idx";
ALTER TABLE "tanaman_naungan" DROP COLUMN "plot_id";
