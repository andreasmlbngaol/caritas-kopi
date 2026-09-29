// app/(main)/petani/constants.ts
import type {
    JenisPraktikGap,
    JenisKondisiKebun,
    JenisProdukDijual,
    KategoriPasar,
    SatuanProduksi,
    StatusKepemilikanLahan,
    SistemBudidaya,
    JenisKelamin,
} from "@/app/generated/prisma/enums";

export type GapItem = { jenis: JenisPraktikGap; label: string };

// ---------- C – Praktik GAP (21 item, 5 kelompok) ----------
export const GAP_GROUPS: { kelompok: string; items: GapItem[] }[] = [
    {
        kelompok: "Pemeliharaan tanaman",
        items: [
            { jenis: "PEMANGKASAN_KOPI", label: "Pemangkasan Kopi Rutin" },
            { jenis: "PEMANGKASAN_NAUNGAN", label: "Pemangkasan Pohon Naungan" },
            { jenis: "PENGENDALIAN_GULMA", label: "Pengendalian Gulma (Manual/Herbisida)" },
            { jenis: "PEMUPUKAN", label: "Pemupukan (Organik/Anorganik)" },
            { jenis: "PEREMAJAAN_TANAMAN", label: "Peremajaan Tanaman Tua (Replanting/Stumping/Grafting)" },
        ],
    },
    {
        kelompok: "Pengelolaan Hama & Penyakit",
        items: [
            { jenis: "PENGENDALIAN_PBKO", label: "Pengendalian penggerek buah kopi" },
            { jenis: "PENGENDALIAN_KARAT_DAUN", label: "Pengendalian penyakit karat daun (HV/CLR)" },
            { jenis: "PESTISIDA_SESUAI_DOSIS", label: "Penggunaan pestisida sesuai dosis dan jadwal" },
            { jenis: "PENYIMPANAN_PESTISIDA", label: "Penyimpanan pestisida terpisah dari bahan pangan" },
        ],
    },
    {
        kelompok: "Konservasi Air & Tanah",
        items: [
            { jenis: "TERAS_SENGKEDAN", label: "Pembuatan teras/sengkedan di lahan miring" },
            { jenis: "COVER_CROP", label: "Penanaman cover crop/tanaman penutup tanah" },
            { jenis: "RORAK_RESAPAN", label: "Pembuatan rorak/lubang resapan" },
            { jenis: "LIMBAH_PULP", label: "Pengelolaan limbah pulp/kulit kopi" },
        ],
    },
    {
        kelompok: "Panen & Pasca-Panen",
        items: [
            { jenis: "PANEN_SELEKTIF", label: "Panen selektif (petik merah)" },
            { jenis: "SORTASI_CHERRY", label: "Sortasi cherry sebelum dijual/diproses" },
            { jenis: "PENJEMURAN_BERSIH", label: "Penjemuran di tempat bersih (tidak di jalan/tanah langsung)" },
            { jenis: "PENYIMPANAN_HASIL", label: "Penyimpanan hasil panen di tempat kering dan bersih" },
        ],
    },
    {
        kelompok: "Lingkungan & Sosial",
        items: [
            { jenis: "TANPA_BAKAR_LAHAN", label: "Tidak membuka lahan dengan cara membakar" },
            { jenis: "TANPA_KIMIA_TERLARANG", label: "Tidak menggunakan bahan kimia terlarang" },
            { jenis: "APD_PESTISIDA", label: "Menggunakan APD saat aplikasi pestisida" },
            { jenis: "TANPA_PEKERJA_ANAK", label: "Tidak mempekerjakan anak di bawah umur" },
        ],
    },
];

export const GAP_ITEMS: GapItem[] = GAP_GROUPS.flatMap((g) => g.items);

export const GAP_OPTIONS: { value: string; label: string }[] = [
    { value: "YA", label: "Ya" },
    { value: "TIDAK", label: "Tidak" },
    { value: "KADANG", label: "Kadang" },
];

// ---------- F – Kondisi Kebun (10 item) ----------
export const KONDISI_KEBUN: { jenis: JenisKondisiKebun; label: string }[] = [
    { jenis: "KEPEMILIKAN_JELAS", label: "Kepemilikan lahan jelas (SHM, Surat Desa, Surat Pinjam Lahan)" },
    { jenis: "BATAS_KONSERVASI", label: "Berbatasan dengan kawasan konservasi" },
    { jenis: "BATAS_HUTAN_LINDUNG", label: "Berbatasan dengan hutan lindung" },
    { jenis: "DEKAT_SUNGAI", label: "Berdekatan dengan sungai" },
    { jenis: "DEKAT_MATA_AIR", label: "Berdekatan dengan mata air" },
    { jenis: "POHON_NAUNGAN", label: "Menggunakan pohon naungan" },
    { jenis: "KONSERVASI_TANAH", label: "Menerapkan konservasi tanah" },
    { jenis: "PERNAH_BAKAR_LAHAN", label: "Pernah membuka lahan dengan membakar" },
    { jenis: "KONFLIK_SATWA", label: "Pernah terjadi konflik satwa" },
    { jenis: "EROSI_LONGSOR", label: "Terdapat erosi/longsor" },
];

// ---------- E.1 – Jenis Produk (8 tetap; LAINNYA = baris dinamis) ----------
export const PRODUK: { jenis: JenisProdukDijual; label: string }[] = [
    { jenis: "CHERRY", label: "Cherry" },
    { jenis: "GABAH_BASAH", label: "Gabah Basah" },
    { jenis: "GABAH_KERING", label: "Gabah Kering" },
    { jenis: "GB_WET_HULL", label: "Green Bean – Wet Hull" },
    { jenis: "GB_NATURAL", label: "Green Bean – Natural Process" },
    { jenis: "GB_HONEY", label: "Green Bean – Honey Process" },
    { jenis: "GB_FULL_WASH", label: "Green Bean – Full Wash" },
    { jenis: "GB_WINE", label: "Green Bean – Wine Process" },
];

// ---------- E.2 – Kategori Pasar (4 tetap; LAINNYA = baris dinamis) ----------
export const PASAR: { kategori: KategoriPasar; label: string }[] = [
    { kategori: "KOMERSIAL", label: "Komersial" },
    { kategori: "KOMERSIAL_BERSERTIFIKAT", label: "Komersial Bersertifikat" },
    { kategori: "SPECIALTY", label: "Specialty Coffee" },
    { kategori: "ORGANIK", label: "Organik" },
];

// ---------- D – Riwayat Produksi (tahun tetap sesuai formulir) ----------
export const TAHUN_PRODUKSI: number[] = [2023, 2024, 2025, 2026];
export const TAHUN_ESTIMASI = 2026; // diberi label "(estimasi)" di form

export const SATUAN_PRODUKSI: { value: SatuanProduksi; label: string }[] = [
    { value: "KG", label: "Kg" },
    { value: "SOLUP", label: "Solup" },
    { value: "BAMBU", label: "Bambu" },
    { value: "KALENG", label: "Kaleng" },
];

// ---------- B.1 – Kode pada tabel plot ----------
export const STATUS_KEPEMILIKAN: { value: StatusKepemilikanLahan; label: string }[] = [
    { value: "MS", label: "MS – Milik Sendiri" },
    { value: "SW", label: "SW – Sewa" },
    { value: "BH", label: "BH – Bagi Hasil" },
    { value: "TA", label: "TA – Tanah Adat" },
    { value: "L", label: "L – Lainnya" },
];

export const SISTEM_BUDIDAYA: { value: SistemBudidaya; label: string }[] = [
    { value: "AF", label: "AF – Agroforestry" },
    { value: "MK", label: "MK – Monokultur" },
];

export const JENIS_KELAMIN: { value: JenisKelamin; label: string }[] = [
    { value: "L", label: "Laki-laki" },
    { value: "P", label: "Perempuan" },
];

// ---------- Format tanggal Indonesia ----------
export const BULAN_ID = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// "2026-06" → "Juni 2026"
export function fmtBulanTahun(v: string | null | undefined): string {
    if (!v) return "-";
    const [y, m] = v.split("-");
    const bulan = BULAN_ID[Number(m) - 1];
    return bulan ? `${bulan} ${y}` : v;
}