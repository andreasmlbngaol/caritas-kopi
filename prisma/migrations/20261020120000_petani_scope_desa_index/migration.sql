-- Mempercepat query analitik yang memfilter enumerator + desa sekaligus.
CREATE INDEX IF NOT EXISTS "petani_created_by_id_desa_kode_idx"
ON "petani"("created_by_id", "desa_kode");
