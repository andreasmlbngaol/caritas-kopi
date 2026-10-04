import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
    StatusKepemilikanLahan, SistemBudidaya, SatuanProduksi, JawabanGap, JenisKelamin,
} from "@/app/generated/prisma/enums";
import { GAP_ITEMS, KONDISI_KEBUN, PRODUK, PASAR, TAHUN_PRODUKSI } from "@/app/(main)/petani/constants";

// Data contoh untuk uji tampilan analitik/peta. Idempoten: dihapus dulu lalu dibuat ulang.
// Jalankan:  npx tsx prisma/seed-sample.ts

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PREFIX = "SAMPEL-"; // penanda agar mudah dibersihkan

const rnd = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 100) / 100;
const rint = (min: number, max: number) => Math.floor(min + Math.random() * (max - min + 1));
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// GAP acak tapi deterministik condong ke praktik umum (realistis)
const GAP_LEAN_YA = new Set([
    "PEMANGKASAN_KOPI", "PENGENDALIAN_GULMA", "PEMUPUKAN", "PANEN_SELEKTIF",
    "SORTASI_CHERRY", "TANPA_BAKAR_LAHAN", "TANPA_PEKERJA_ANAK", "PENJEMURAN_BERSIH",
]);
function jawabanGap(jenis: string): JawabanGap {
    const r = Math.random();
    if (GAP_LEAN_YA.has(jenis)) return r < 0.7 ? "YA" : r < 0.9 ? "KADANG" : "TIDAK";
    return r < 0.35 ? "YA" : r < 0.65 ? "KADANG" : "TIDAK";
}

const KONDISI_TRUE = new Set(["KEPEMILIKAN_JELAS", "POHON_NAUNGAN", "KONSERVASI_TANAH", "DEKAT_SUNGAI"]);

type DesaSample = {
    desaKode: string; kecamatan: string; kabupaten: string;
    lat: number; lng: number; luasWilayah: number; penduduk: number; kk: number;
    petaniKopi: number; arealKopi: number; topografi: string; ketinggian: number;
    suhu: number; tanah: string; akses: string; hargaCherry: number; hargaGb: number;
    konservasi: boolean; longsor: boolean; erosi: boolean;
};

const DESA: DesaSample[] = [
    { desaKode: "11.05.07.2002", kecamatan: "Arongan Lambalek", kabupaten: "Aceh Barat", lat: 4.32, lng: 95.98, luasWilayah: 1200, penduduk: 1850, kk: 460, petaniKopi: 320, arealKopi: 410, topografi: "Berbukit", ketinggian: 220, suhu: 26, tanah: "Andosol", akses: "Aspal", hargaCherry: 8500, hargaGb: 65000, konservasi: true, longsor: true, erosi: false },
    { desaKode: "11.05.07.2003", kecamatan: "Arongan Lambalek", kabupaten: "Aceh Barat", lat: 4.30, lng: 96.01, luasWilayah: 980, penduduk: 1420, kk: 350, petaniKopi: 250, arealKopi: 300, topografi: "Datar", ketinggian: 150, suhu: 27, tanah: "Latosol", akses: "Aspal", hargaCherry: 8200, hargaGb: 62000, konservasi: false, longsor: false, erosi: true },
    { desaKode: "11.05.06.2002", kecamatan: "Samatiga", kabupaten: "Aceh Barat", lat: 4.28, lng: 95.92, luasWilayah: 1500, penduduk: 2100, kk: 520, petaniKopi: 400, arealKopi: 560, topografi: "Berbukit", ketinggian: 300, suhu: 25, tanah: "Andosol", akses: "Kerikil", hargaCherry: 9000, hargaGb: 68000, konservasi: true, longsor: true, erosi: true },
    { desaKode: "11.12.01.2007", kecamatan: "Blangpidie", kabupaten: "Aceh Barat Daya", lat: 3.75, lng: 96.85, luasWilayah: 1100, penduduk: 1650, kk: 400, petaniKopi: 280, arealKopi: 380, topografi: "Bergunung", ketinggian: 480, suhu: 23, tanah: "Podsolik", akses: "Aspal", hargaCherry: 9500, hargaGb: 72000, konservasi: true, longsor: true, erosi: true },
    { desaKode: "11.12.02.2002", kecamatan: "Tangan-Tangan", kabupaten: "Aceh Barat Daya", lat: 3.68, lng: 96.90, luasWilayah: 1300, penduduk: 1900, kk: 470, petaniKopi: 350, arealKopi: 470, topografi: "Berbukit", ketinggian: 350, suhu: 24, tanah: "Latosol", akses: "Tanah", hargaCherry: 8800, hargaGb: 66000, konservasi: false, longsor: true, erosi: true },
];

const NAMA_DEPAN = ["Ahmad", "Muhammad", "Siti", "Fatimah", "Abdul", "Nur", "Ibrahim", "Cut", "Yusuf", "Aisyah", "Ridwan", "Marlina"];
const NAMA_BELAKANG = ["Fauzi", "Hasan", "Yani", "Ramli", "Zainal", "Bakar", "Sulaiman", "Ibrahim", "Nurdin", "Mansur"];

const VARIETAS = ["Arabika Gayo", "Arabika Aceh", "Ateng", "Sigararutang", "Typica", "Bourbon"];
const NAUNGAN = ["Lamtorogung", "Pete", "Alpukat", "Durian", "Kopi Robusta", "Sengon"];
const PESTISIDA = ["Fungisida Dithane", "Insektisida Decis", "Herbisida Roundup", "Biopestisida Neem"];
const PENGUMPUL = ["Pengepul Desa", "Tengkulak", "Koperasi", "Pasar Lokal"];
const EKSPORTIR = ["PT Kopi Aceh", "CV Nusantara Coffee", "-"];

async function main() {
    // 1) Bersihkan sampel lama (cascade akan menghapus anak-anak)
    const oldPetani = await prisma.petani.findMany({ where: { kodePetani: { startsWith: PREFIX } }, select: { id: true } });
    if (oldPetani.length) {
        await prisma.petani.deleteMany({ where: { id: { in: oldPetani.map((p) => p.id) } } });
        console.log(`Hapus ${oldPetani.length} petani sampel lama.`);
    }
    const oldDesa = await prisma.baselineDesa.findMany({ where: { sumberData: { startsWith: PREFIX } }, select: { id: true } });
    if (oldDesa.length) {
        await prisma.baselineDesa.deleteMany({ where: { id: { in: oldDesa.map((d) => d.id) } } });
        console.log(`Hapus ${oldDesa.length} baseline desa sampel lama.`);
    }
    await prisma.kelompokTani.deleteMany({ where: { nama: { startsWith: PREFIX } } });

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) throw new Error("Tidak ada user ADMIN. Jalankan `npm run seed` dulu.");

    // 2) Baseline desa
    for (const d of DESA) {
        await prisma.baselineDesa.create({
            data: {
                tahunPendataan: 2025,
                sumberData: `${PREFIX}contoh`,
                desaKode: d.desaKode,
                luasWilayahHa: d.luasWilayah,
                jumlahPenduduk: d.penduduk,
                jumlahKK: d.kk,
                jumlahPetaniKopi: d.petaniKopi,
                luasArealKopiHa: d.arealKopi,
                luasKomoditiLainHa: rnd(50, 200),
                latitude: d.lat,
                longitude: d.lng,
                topografi: d.topografi,
                ketinggianMdpl: d.ketinggian,
                bulanHujan: "September-Januari",
                bulanKering: "Juni-Agustus",
                suhuRataRataC: d.suhu,
                jenisTanah: d.tanah,
                aksesJalan: d.akses,
                jarakIbukotaKecamatanKm: rint(2, 15),
                jarakPasarKm: rint(3, 20),
                jarakKonservasiKm: rint(1, 10),
                luasAPLHa: rnd(100, 500),
                namaKawasanKonservasi: d.konservasi ? "Kawasan Hutan Lindung Leuser" : null,
                produktivitasKgHaTahun: rnd(600, 1200),
                hargaCherryRp: d.hargaCherry,
                hargaGreenBeanRpKg: d.hargaGb,
                pembeliUtama: pick(PENGUMPUL),
                jumlahPedagangPengumpul: rint(2, 8),
                koperasiAktifUnit: rint(0, 3),
                eksportir: pick(EKSPORTIR),
                industriPengolahan: pick(["Huller", "Pabrik Pengolahan Basah", "Tidak ada"]),
                permasalahanUtama: pick(["Akses jalan rusak", "Harga tidak stabil", "Hama PBKO", "Kurang modal"]),
                berbatasanKonservasi: d.konservasi,
                luasPenyanggaHa: rnd(10, 80),
                tutupanHutan: rnd(20, 60),
                tutupanHutanSatuan: "PERSEN",
                tutupanAgroforestry: rnd(30, 70),
                tutupanAgroforestrySatuan: "PERSEN",
                rawanLongsor: d.longsor,
                lokasiRawanLongsor: d.longsor ? "Lereng bagian utara" : null,
                rawanErosi: d.erosi,
                lokasiRawanErosi: d.erosi ? "Sepanjang aliran sungai" : null,
                konflikSatwa: d.konservasi,
                jenisSatwaKonflik: d.konservasi ? pick(["Monyet", "Babi hutan", "Musang"]) : null,
                praktikKonservasi: pick(["Terasering", "Penanaman naungan", "Rorak", "Cover crop"]),
                createdById: admin.id,
                kebijakan: {
                    create: [
                        { jenis: "RPJM_DESA", ada: true, keterangan: "Memuat program kopi" },
                        { jenis: "PROGRAM_PERKEMBANGAN_KOPI", ada: Math.random() > 0.4 },
                        { jenis: "PROGRAM_KOPERASI", ada: Math.random() > 0.5 },
                        { jenis: "PERDES_PERTANIAN", ada: Math.random() > 0.6 },
                    ],
                },
                kelembagaan: {
                    create: [
                        { jenis: "KELOMPOK_TANI", jumlah: rint(2, 6), kondisi: "Aktif" },
                        { jenis: "GAPOKTAN", jumlah: rint(0, 2), kondisi: "Aktif" },
                        { jenis: "KOPERASI", jumlah: rint(0, 2), kondisi: "Berjalan" },
                        { jenis: "BUMDES", jumlah: rint(0, 1) },
                        { jenis: "PENYULUH", jumlah: rint(1, 3) },
                    ],
                },
            },
        });
    }
    console.log(`✓ ${DESA.length} baseline desa dibuat.`);

    // 3) Kelompok tani
    const kelompokByDesa = new Map<string, { id: string }[]>();
    for (const d of DESA) {
        const kt = await prisma.kelompokTani.create({
            data: { nama: `${PREFIX}Kelompok Tani ${d.kecamatan}`, kode: `S-${d.desaKode.slice(-4)}`, desaKode: d.desaKode },
        });
        kelompokByDesa.set(d.desaKode, [kt]);
    }
    console.log(`✓ ${DESA.length} kelompok tani dibuat.`);

    // 4) 5 petani - masing-masing di desa berbeda
    let seq = 0;
    for (const d of DESA) {
        seq += 1;
        const gender: JenisKelamin = Math.random() > 0.3 ? "L" : "P";
        const depan = gender === "P" ? pick(["Siti", "Fatimah", "Nur", "Aisyah", "Cut"]) : pick(["Ahmad", "Muhammad", "Abdul", "Ibrahim", "Yusuf"]);
        const nama = `${depan} ${pick(NAMA_BELAKANG)}`;
        const tahunLahir = rint(1965, 1998);
        const kt = kelompokByDesa.get(d.desaKode)![0];

        await prisma.petani.create({
            data: {
                kodePetani: `${PREFIX}${String(seq).padStart(3, "0")}`,
                namaLengkap: nama,
                namaPanggilan: depan,
                jenisKelamin: gender,
                tanggalLahir: new Date(tahunLahir, rint(0, 11), rint(1, 28)),
                alamatDomisili: `Dusun ${rint(1, 4)}, ${d.kecamatan}`,
                telepon: `0812${rint(10000000, 99999999)}`,
                tanggalPendaftaran: new Date(2025, rint(0, 9), rint(1, 28)),
                namaPetugasPendaftar: "Petugas Sampel",
                kontakDaruratNama: `${pick(NAMA_DEPAN)} ${pick(NAMA_BELAKANG)}`,
                kontakDaruratTelepon: `0813${rint(10000000, 99999999)}`,
                kontakDaruratHubungan: pick(["Istri", "Suami", "Anak", "Saudara"]),
                desaKode: d.desaKode,
                kelompokTaniId: kt.id,
                createdById: admin.id,
                plot: {
                    create: Array.from({ length: rint(1, 2) }, (_, i) => ({
                        nomor: i + 1,
                        namaHamparan: `Hamparan ${i + 1}`,
                        varietas: [...new Set([pick(VARIETAS), pick(VARIETAS)])].join(", "),
                        tahunTanam: rint(2005, 2022),
                        kodeGps: `GP${rint(1000, 9999)}`,
                        elevasiMdpl: d.ketinggian + rint(-50, 50),
                        kemiringanPersen: rint(5, 40),
                        luasKopiHa: rnd(0.3, 2.5),
                        fotoLatitude: d.lat + (Math.random() - 0.5) * 0.03,
                        fotoLongitude: d.lng + (Math.random() - 0.5) * 0.03,
                        statusKepemilikan: pick(["MS", "MS", "SW", "BH", "TA"] as const) as StatusKepemilikanLahan,
                        sistemBudidaya: pick(["AF", "AF", "MK"] as const) as SistemBudidaya,
                        areaKonservasi: pick(["Dekat hutan lindung", "-", "Sempadan sungai"]),
                        tanamanBaru: rint(0, 150),
                        pohonProduktif: rint(200, 900),
                        pohonTidakProduktif: rint(0, 120),
                        pestisidaNama: Math.random() > 0.5 ? pick(PESTISIDA) : null,
                        pestisidaBulanTahun: `2025-0${rint(1, 9)}`,
                        naungan: {
                            create: Array.from({ length: rint(1, 3) }, () => ({
                                jenis: pick(NAUNGAN),
                                jumlah: rint(10, 200),
                                fungsi: pick(["Peneduh", "Kayu", "Buah"]),
                                pemangkasan: Math.random() > 0.4,
                                produksiPerTahun: pick(["-", "50 kg", "100 kg"]),
                                tahunTanam: rint(2000, 2020),
                            })),
                        },
                    })),
                },
                praktikGap: {
                    create: GAP_ITEMS.map((g) => ({
                        jenis: g.jenis,
                        jawaban: jawabanGap(g.jenis),
                        keterangan: "-",
                    })),
                },
                produksi: {
                    create: TAHUN_PRODUKSI.map((tahun) => {
                        const cherry = rint(200, 1500);
                        const gabahKering = rint(50, 400);
                        const greenBean = rint(30, 250);
                        const gabahBasah = rint(0, 100);
                        return {
                            tahun,
                            satuan: "KG" as SatuanProduksi,
                            cherry, gabahBasah, gabahKering, greenBean,
                            produktivitas: cherry + gabahBasah + gabahKering + greenBean,
                        };
                    }),
                },
                produk: {
                    create: PRODUK.map((p) => {
                        const dijual = Math.random() > 0.5;
                        return { jenis: p.jenis, labelCustom: null as string | null, dijual, volumeKgTahun: dijual ? rint(20, 300) : 0 };
                    }).concat([
                        { jenis: "LAINNYA" as const, labelCustom: "Kopi Luwak", dijual: Math.random() > 0.6, volumeKgTahun: rint(5, 30) },
                    ]),
                },
                pasar: {
                    create: PASAR.map((p) => {
                        const aktif = Math.random() > 0.5;
                        return {
                            kategori: p.kategori, labelCustom: null as string | null, aktif,
                            persentase: aktif ? rint(10, 80) : 0,
                            profilPenjual: aktif ? pick(["Pengepul", "Koperasi", "Eksportir", "Pasar lokal"]) : "-",
                        };
                    }).concat([
                        { kategori: "LAINNYA" as const, labelCustom: "Pasar Lokal Desa", aktif: Math.random() > 0.5, persentase: rint(5, 40), profilPenjual: "Pengepul desa" },
                    ]),
                },
                kondisiKebun: {
                    create: KONDISI_KEBUN.map((k) => ({
                        jenis: k.jenis,
                        jawaban: KONDISI_TRUE.has(k.jenis) ? Math.random() > 0.25 : Math.random() > 0.7,
                        keterangan: "-",
                    })),
                },
            },
        });
    }
    console.log(`✓ 5 petani sampel dibuat (masing-masing 1 desa berbeda).`);
    console.log("Selesai. Buka / dan /analitik/* untuk melihat isinya.");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
