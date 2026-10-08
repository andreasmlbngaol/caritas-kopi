// app/(main)/petani/export-model.ts
import type { getPetaniFull } from "./queries";
import {
    GAP_GROUPS, KONDISI_KEBUN, PRODUK, PASAR,
    TAHUN_PRODUKSI, TAHUN_ESTIMASI, SATUAN_PRODUKSI,
    fmtBulanTahun,
} from "./constants";

export type FullPetani = NonNullable<Awaited<ReturnType<typeof getPetaniFull>>>;

const idNum = new Intl.NumberFormat("id-ID");
const fmt = (v: string | number | null | undefined) =>
    v == null || v === "" ? "-" : String(v);
const num = (v: number | null | undefined) => (v == null ? "-" : idNum.format(v));
const bool = (v: boolean | null | undefined) => (v == null ? "-" : v ? "Ya" : "Tidak");
const fmtDate = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

const kode = (v: string | null) => v ?? "-"; // status/sistem: kode mentah saja (MS, AF, …)
const satuanLabel = (v: string | null) =>
    SATUAN_PRODUKSI.find((s) => s.value === v)?.label ?? (v ?? "-");

export function buildPetaniExportModel(p: FullPetani, appUrl: string) {
    const kec = p.desa.kecamatan;
    const kab = kec.kabupaten;

    return {
        fileName: `Data Petani ${p.namaLengkap}`,
        meta: {
            penginput: p.createdBy.fullName ?? p.createdBy.username,
            tanggalInput: fmtDate(p.createdAt),
        },
        sectionA: [
            ["Nama Lengkap (sesuai KTP)", p.namaLengkap],
            ["Nama Panggilan", fmt(p.namaPanggilan)],
            ["Jenis Kelamin", p.jenisKelamin === "L" ? "Laki-laki" : p.jenisKelamin === "P" ? "Perempuan" : "-"],
            ["Tanggal Lahir", fmtDate(p.tanggalLahir)],
            ["Alamat Domisili", fmt(p.alamatDomisili)],
            ["Nomor Telepon / HP", fmt(p.telepon)],
            ["Tanggal Pendaftaran", fmtDate(p.tanggalPendaftaran)],
            ["Nama Petugas Pendaftar", fmt(p.namaPetugasPendaftar)],
            ["Nama Kontak Darurat", fmt(p.kontakDaruratNama)],
            ["Nomor Telepon / HP Kontak Darurat", fmt(p.kontakDaruratTelepon)],
            ["Hubungan dengan Kontak Darurat", fmt(p.kontakDaruratHubungan)],
            ["Desa", `${p.desa.nama}, ${kec.nama}, ${kab.nama}, ${kab.provinsi.nama}`],
        ] as [string, string][],
        petugas: {
            kodePetani: fmt(p.kodePetani),
            namaKelompok: p.kelompokTani ? p.kelompokTani.nama : "-",
            kodeKelompok: p.kelompokTani?.kode ?? "-",
        },
        sectionB1: p.plot.map((pl) => [
            String(pl.nomor),
            fmt(pl.namaHamparan),
            fmt(pl.varietas),
            pl.tahunTanam.length ? pl.tahunTanam.join(", ") : "-",
            fmt(pl.kodeGps),
            num(pl.elevasiMdpl),
            num(pl.kemiringanPersen),
            num(pl.luasKopiHa),
        ] as [string, string, string, string, string, string, string, string]),
        sectionB1b: p.plot.map((pl) => ({
            no: String(pl.nomor),
            fotoUrl: pl.fotoKey ? `${appUrl}/api/foto/${pl.fotoKey}` : null,
            fotoKoordinat:
                pl.fotoLatitude != null && pl.fotoLongitude != null
                    ? `${pl.fotoLatitude}, ${pl.fotoLongitude}`
                    : null,
            status: kode(pl.statusKepemilikan),
            sistem: kode(pl.sistemBudidaya),
            konservasi: fmt(pl.areaKonservasi),
            tanamanBaru: num(pl.tanamanBaru),
            pohonProduktif: num(pl.pohonProduktif),
            pohonTidakProduktif: num(pl.pohonTidakProduktif),
            pestisida:
                [pl.pestisidaNama, pl.pestisidaBulanTahun ? fmtBulanTahun(pl.pestisidaBulanTahun) : null]
                    .filter(Boolean).join(" - ") || "-",
        })),
        sectionB2: p.naungan.map((n) => [
            fmt(n.jenis),
            num(n.jumlah),
            fmt(n.fungsi),
            bool(n.pemangkasan),
            fmt(n.produksiPerTahun),
            num(n.tahunTanam),
        ] as [string, string, string, string, string, string]),
        sectionC: GAP_GROUPS.map((g) => ({
            kelompok: g.kelompok,
            rows: g.items.map((item) => {
                const row = p.praktikGap.find((x) => x.jenis === item.jenis);
                return {
                    label: item.label,
                    jawaban: (row?.jawaban ?? null) as "YA" | "TIDAK" | "KADANG" | null,
                    keterangan: fmt(row?.keterangan),
                };
            }),
        })),
        sectionD: TAHUN_PRODUKSI.map((tahun) => {
            const r = p.produksi.find((x) => x.tahun === tahun);
            return [
                `${tahun}${tahun === TAHUN_ESTIMASI ? " (estimasi)" : ""}`,
                satuanLabel(r?.satuan ?? null),
                num(r?.cherry), num(r?.gabahBasah), num(r?.gabahKering),
                num(r?.greenBean), num(r?.produktivitas),
            ] as [string, string, string, string, string, string, string];
        }),
        sectionE1: p.produk.map((r) => ({
            label: r.jenis === "LAINNYA"
                ? `Lainnya: ${fmt(r.labelCustom)}`
                : (PRODUK.find((x) => x.jenis === r.jenis)?.label ?? r.jenis),
            aktif: r.dijual,
            volume: r.dijual ? num(r.volumeKgTahun) : "0",
        })),
        sectionE2: p.pasar.map((r) => ({
            label: r.kategori === "LAINNYA"
                ? `Lainnya: ${fmt(r.labelCustom)}`
                : (PASAR.find((x) => x.kategori === r.kategori)?.label ?? r.kategori),
            aktif: r.aktif,
            persentase: r.aktif ? num(r.persentase) : "0",
            profil: r.aktif ? fmt(r.profilPenjual) : "-",
        })),
        sectionF: KONDISI_KEBUN.map((k) => {
            const row = p.kondisiKebun.find((x) => x.jenis === k.jenis);
            return {
                label: k.label,
                jawaban: row?.jawaban ?? false,
                keterangan: row?.jawaban ? fmt(row.keterangan) : "-",
            };
        }),
    };
}

export type PetaniExportModel = ReturnType<typeof buildPetaniExportModel>;