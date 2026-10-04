import { KEBIJAKAN, LEMBAGA } from "./constants";
import type { getBaselineDesaFull } from "./queries";

export type FullBaseline = NonNullable<Awaited<ReturnType<typeof getBaselineDesaFull>>>;

const idNum = new Intl.NumberFormat("id-ID");

const fmt = (v: string | number | null | undefined) =>
    v === null || v === undefined || v === "" ? "-" : String(v);
const num = (v: number | null | undefined) => (v == null ? "-" : idNum.format(v));
const numUnit = (v: number | null | undefined, unit: string) =>
    v == null ? "-" : `${idNum.format(v)} ${unit}`;
const fmtBool = (v: boolean | null | undefined) =>
    v == null ? "-" : v ? "Ya" : "Tidak";
const fmtTutupan = (v: number | null | undefined, s: string | null | undefined) =>
    v == null ? "-" : `${idNum.format(v)} ${s === "HA" ? "Ha" : "%"}`;
const fmtBoolDetail = (
    v: boolean | null | undefined,
    detail: string | null | undefined,
    label: string
) => (v == null ? "-" : v ? (detail ? `Ya, ${label}: ${detail}` : "Ya") : "Tidak");

export function buildDesaExportModel(b: FullBaseline) {
    const w = b.wilayah;
    const kec = w.kecamatan;
    const kab = kec.kabupaten;

    const koordinat =
        b.latitude != null && b.longitude != null ? `${b.latitude}, ${b.longitude}` : "-";
    const musim =
        b.bulanHujan || b.bulanKering
            ? `Hujan: ${b.bulanHujan ?? "-"}\nKering: ${b.bulanKering ?? "-"}`
            : "-";

    // 12 baris × 2 pasang, mengikuti layout kolom kiri-kanan formulir
    const sectionA: { left: [string, string]; right: [string, string] }[] = [
        { left: ["Desa", w.nama], right: ["Topografi", fmt(b.topografi)] },
        { left: ["Kecamatan", kec.nama], right: ["Ketinggian (mdpl)", num(b.ketinggianMdpl)] },
        { left: ["Kabupaten", kab.nama], right: ["Bulan Hujan dan Bulan Kering", musim] },
        { left: ["Provinsi", kab.provinsi.nama], right: ["Suhu Rata-rata (°C)", num(b.suhuRataRataC)] },
        { left: ["Luas Wilayah (Ha)", num(b.luasWilayahHa)], right: ["Jenis Tanah", fmt(b.jenisTanah)] },
        { left: ["Jumlah Penduduk", num(b.jumlahPenduduk)], right: ["Akses Jalan", fmt(b.aksesJalan)] },
        { left: ["Jumlah KK", num(b.jumlahKK)], right: ["Jarak ke Ibu Kota Kecamatan", numUnit(b.jarakIbukotaKecamatanKm, "km")] },
        { left: ["Jumlah Petani Kopi", num(b.jumlahPetaniKopi)], right: ["Jarak ke Pasar", numUnit(b.jarakPasarKm, "km")] },
        { left: ["Luas Areal Kopi (Ha)", num(b.luasArealKopiHa)], right: ["Jarak ke Kawasan Konservasi", numUnit(b.jarakKonservasiKm, "km")] },
        { left: ["Luas Area Komoditi lainnya", numUnit(b.luasKomoditiLainHa, "Ha")], right: ["Luas Lahan APL", numUnit(b.luasAPLHa, "Ha")] },
        { left: ["Koordinat Desa", koordinat], right: ["Nama Kawasan Konservasi", fmt(b.namaKawasanKonservasi)] },
        { left: ["Tahun Pendataan", fmt(b.tahunPendataan)], right: ["Sumber Data", fmt(b.sumberData)] },
    ];

    return {
        fileName: `Data Desa ${w.nama}`,
        meta: {
            penginput: b.createdBy.fullName ?? b.createdBy.username,
            tanggalInput: b.createdAt.toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric",
            }),
        },
        sectionA,
        sectionB: KEBIJAKAN.map((k) => {
            const row = b.kebijakan.find((x) => x.jenis === k.jenis);
            return { label: k.label, ada: row?.ada ?? false, keterangan: row?.keterangan ?? "-" };
        }),
        sectionC: LEMBAGA.map((l) => {
            const row = b.kelembagaan.find((x) => x.jenis === l.jenis);
            return {
                label: l.label,
                jumlah: row?.jumlah != null ? String(row.jumlah) : "0",
                kondisi: row?.kondisi ?? "-",
            };
        }),
        sectionD: [
            ["Jumlah Petani Kopi (orang)", num(b.jumlahPetaniKopi)],
            ["Luas Kebun Kopi (Ha)", num(b.luasArealKopiHa)],
            ["Produktivitas Rata-rata (Kg/Ha/Tahun)", num(b.produktivitasKgHaTahun)],
            ["Harga Cherry (Rp)", num(b.hargaCherryRp)],
            ["Harga Green Bean (Rp/kg)", num(b.hargaGreenBeanRpKg)],
            ["Pembeli Utama", fmt(b.pembeliUtama)],
            ["Jumlah Pedagang Pengumpul (Orang)", num(b.jumlahPedagangPengumpul)],
            ["Koperasi Aktif (Unit)", num(b.koperasiAktifUnit)],
            ["Eksportir", fmt(b.eksportir)],
            ["Industri Pengolahan", fmt(b.industriPengolahan)],
            ["Permasalahan Utama", fmt(b.permasalahanUtama)],
        ] as [string, string][],
        sectionE: [
            ["Berbatasan Kawasan Konservasi (Ya/Tidak)", fmtBool(b.berbatasanKonservasi)],
            ["Luas Kawasan Penyangga (Ha)", num(b.luasPenyanggaHa)],
            ["Tutupan Hutan (% atau Ha)", fmtTutupan(b.tutupanHutan, b.tutupanHutanSatuan)],
            ["Tutupan Agroforestry (% atau Ha)", fmtTutupan(b.tutupanAgroforestry, b.tutupanAgroforestrySatuan)],
            ["Daerah Rawan Longsor", fmtBoolDetail(b.rawanLongsor, b.lokasiRawanLongsor, "lokasi")],
            ["Daerah Rawan Erosi", fmtBoolDetail(b.rawanErosi, b.lokasiRawanErosi, "lokasi")],
            ["Konflik Satwa", fmtBoolDetail(b.konflikSatwa, b.jenisSatwaKonflik, "jenis")],
            ["Praktik Konservasi yang Sudah Ada", fmt(b.praktikKonservasi)],
        ] as [string, string][],
    };
}

export type DesaExportModel = ReturnType<typeof buildDesaExportModel>;