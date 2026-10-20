// app/(main)/analitik/queries.ts
// Agregasi server-side untuk dashboard & halaman analitik (khusus ADMIN).
import { prisma } from "@/lib/prisma";
import type { JenisPraktikGap } from "@/app/generated/prisma/enums";
import type { PetaniWhereInput, BaselineDesaWhereInput } from "@/app/generated/prisma/models";

const num = (v: unknown): number => (v == null ? 0 : Number(v));

// Nilai teks bebas: buang kosong dan placeholder "-" agar tidak ikut terhitung.
const DASH = "-";
const clean = (v?: string | null): string | null => {
    const t = v?.trim();
    return t && t !== DASH ? t : null;
};

// Kunci pengelompokan case-insensitive ("ateng" == "Ateng" == "ATENG").
const ci = (s: string) => s.toLocaleLowerCase("id-ID");

// Pilih ejaan tampilan dari varian kapitalisasi: yang paling sering muncul;
// seri → yang punya huruf kapital (lebih enak dibaca daripada serba kecil).
function pickSpelling(variants: Map<string, number>): string {
    let best = "";
    let bestN = -1;
    for (const [s, n] of variants) {
        if (n > bestN || (n === bestN && /[A-Z]/.test(s) && !/[A-Z]/.test(best))) {
            best = s;
            bestN = n;
        }
    }
    return best;
}

// Scope data: `userId` diisi untuk ENUMERATOR (hanya data miliknya), `undefined`
// untuk ADMIN (seluruh data). `desaKode` mempersempit ke satu desa.
// Dipakai di semua query analitik.
const petaniWhere = (userId?: string, desaKode?: string): PetaniWhereInput => ({
    ...(userId ? { createdById: userId } : {}),
    ...(desaKode ? { desaKode } : {}),
});
const desaWhere = (userId?: string, desaKode?: string): BaselineDesaWhereInput => ({
    ...(userId ? { createdById: userId } : {}),
    ...(desaKode ? { desaKode } : {}),
});
// Filter relasi ke Petani (dipakai untuk model anak: plot, produksi, produk, dst).
const relPetani = (userId?: string, desaKode?: string): { petani: PetaniWhereInput } | undefined =>
    userId || desaKode ? { petani: petaniWhere(userId, desaKode) } : undefined;
const relBaseline = (userId?: string, desaKode?: string): { baseline: BaselineDesaWhereInput } | undefined =>
    userId || desaKode ? { baseline: desaWhere(userId, desaKode) } : undefined;

// Daftar desa yang punya data (petani atau baseline) untuk dropdown filter.
export async function getDesaOptions(userId?: string) {
    // Satu query: desa yang punya petani ATAU baseline dalam scope user.
    const rows = await prisma.wilayahDesa.findMany({
        where: {
            OR: [
                { petani: { some: userId ? { createdById: userId } : {} } },
                userId
                    ? { baselineDesa: { is: { createdById: userId } } }
                    : { baselineDesa: { isNot: null } },
            ],
        },
        select: { kode: true, nama: true, kecamatan: { select: { nama: true } } },
        orderBy: { nama: "asc" },
    });
    return rows.map((d) => ({ kode: d.kode, nama: d.nama, kecamatan: d.kecamatan.nama }));
}

// Hitung frekuensi teks bebas secara case-insensitive; kembalikan [{nama, jumlah}].
function tally<T>(rows: T[], get: (row: T) => string | null | undefined): { nama: string; jumlah: number }[] {
    const m = new Map<string, { jumlah: number; spell: Map<string, number> }>();
    for (const row of rows) {
        const v = clean(get(row));
        if (!v) continue;
        const e = m.get(ci(v)) ?? { jumlah: 0, spell: new Map<string, number>() };
        e.jumlah += 1;
        e.spell.set(v, (e.spell.get(v) ?? 0) + 1);
        m.set(ci(v), e);
    }
    return [...m.values()].map((e) => ({ nama: pickSpelling(e.spell), jumlah: e.jumlah }));
}

// ---------- Ringkasan dashboard ----------
export async function getRingkasan() {
    const [
        jumlahPetani, jumlahDesa, jumlahKelompok,
        areal, plot, produksiTahun,
    ] = await Promise.all([
        prisma.petani.count(),
        prisma.baselineDesa.count(),
        prisma.kelompokTani.count(),
        prisma.baselineDesa.aggregate({ _sum: { luasArealKopiHa: true } }),
        prisma.plotPetani.aggregate({ _sum: { luasKopiHa: true, pohonProduktif: true } }),
        prisma.riwayatProduksi.groupBy({
            by: ["tahun"],
            _sum: { cherry: true, gabahBasah: true, greenBean: true, gabahKering: true },
            orderBy: { tahun: "asc" },
        }),
    ]);

    const terbaru = produksiTahun.at(-1);
    const luasPlotHa = num(plot._sum.luasKopiHa);
    const volumeTerbaru = terbaru
        ? num(terbaru._sum.cherry) + num(terbaru._sum.gabahBasah)
          + num(terbaru._sum.gabahKering) + num(terbaru._sum.greenBean)
        : 0;
    return {
        jumlahPetani, jumlahDesa, jumlahKelompok,
        luasArealKopiHa: num(areal._sum.luasArealKopiHa),
        luasPlotHa,
        pohonProduktif: num(plot._sum.pohonProduktif),
        tahunTerbaru: terbaru?.tahun ?? null,
        volumeTerbaru,
        // Produktivitas nyata (kg/ha) = total volume tahun terbaru / luas plot.
        produktivitasRata: luasPlotHa > 0 ? volumeTerbaru / luasPlotHa : 0,
        trenProduksi: produksiTahun.map((t) => ({
            tahun: String(t.tahun),
            cherry: num(t._sum.cherry),
            greenBean: num(t._sum.greenBean),
            gabahBasah: num(t._sum.gabahBasah),
            gabahKering: num(t._sum.gabahKering),
        })),
    };
}

// ---------- Ringkasan dashboard enumerator (hanya data miliknya) ----------
// Semua query di-scope lewat createdById, jadi enumerator tidak pernah
// melihat data enumerator lain.
export async function getRingkasanSaya(userId: string) {
    const scope = { createdById: userId };
    const [
        jumlahPetani, jumlahDesa, jumlahKelompok,
        areal, plot, produksiTahun,
    ] = await Promise.all([
        prisma.petani.count({ where: scope }),
        prisma.baselineDesa.count({ where: scope }),
        prisma.kelompokTani.count({ where: { petani: { some: scope } } }),
        prisma.baselineDesa.aggregate({ where: scope, _sum: { luasArealKopiHa: true } }),
        prisma.plotPetani.aggregate({ where: { petani: scope }, _sum: { luasKopiHa: true, pohonProduktif: true } }),
        prisma.riwayatProduksi.groupBy({
            by: ["tahun"],
            where: { petani: scope },
            _sum: { cherry: true, gabahBasah: true, greenBean: true, gabahKering: true },
            orderBy: { tahun: "asc" },
        }),
    ]);

    const terbaru = produksiTahun.at(-1);
    const luasPlotHa = num(plot._sum.luasKopiHa);
    const volumeTerbaru = terbaru
        ? num(terbaru._sum.cherry) + num(terbaru._sum.gabahBasah)
          + num(terbaru._sum.gabahKering) + num(terbaru._sum.greenBean)
        : 0;
    return {
        jumlahPetani, jumlahDesa, jumlahKelompok,
        luasArealKopiHa: num(areal._sum.luasArealKopiHa),
        luasPlotHa,
        pohonProduktif: num(plot._sum.pohonProduktif),
        tahunTerbaru: terbaru?.tahun ?? null,
        volumeTerbaru,
        produktivitasRata: luasPlotHa > 0 ? volumeTerbaru / luasPlotHa : 0,
        trenProduksi: produksiTahun.map((t) => ({
            tahun: String(t.tahun),
            cherry: num(t._sum.cherry),
            greenBean: num(t._sum.greenBean),
            gabahBasah: num(t._sum.gabahBasah),
            gabahKering: num(t._sum.gabahKering),
        })),
    };
}

// ---------- GAP: tingkat adopsi 21 praktik ----------
export async function getGapAdoption(userId?: string, desaKode?: string) {
    const rel = relPetani(userId, desaKode);
    const [totalPetani, rows] = await Promise.all([
        prisma.petani.count({ where: petaniWhere(userId, desaKode) }),
        prisma.praktikGap.groupBy({ by: ["jenis", "jawaban"], where: rel, _count: true }),
    ]);

    const map = new Map<string, { ya: number; tidak: number; kadang: number }>();
    for (const r of rows) {
        const e = map.get(r.jenis) ?? { ya: 0, tidak: 0, kadang: 0 };
        if (r.jawaban === "YA") e.ya += r._count;
        else if (r.jawaban === "TIDAK") e.tidak += r._count;
        else if (r.jawaban === "KADANG") e.kadang += r._count;
        map.set(r.jenis, e);
    }

    const items = [...map.entries()].map(([jenis, e]) => {
        const total = e.ya + e.tidak + e.kadang;
        return { jenis: jenis as JenisPraktikGap, ...e, total, pctYa: total ? (e.ya / total) * 100 : 0 };
    });

    const totalJawaban = items.reduce((s, i) => s + i.total, 0);
    const totalYa = items.reduce((s, i) => s + i.ya, 0);
    return {
        totalPetani,
        items,
        adopsiKeseluruhan: totalJawaban ? (totalYa / totalJawaban) * 100 : 0,
    };
}

// ---------- Produksi ----------
export async function getProduksi(userId?: string, desaKode?: string) {
    const rel = relPetani(userId, desaKode);
    // Satu query untuk semua baris produksi, dipakai untuk rekap per tahun
    // sekaligus produksi per desa. Luas plot tetap query terpisah untuk kg/ha.
    const [rows, plotArea] = await Promise.all([
        prisma.riwayatProduksi.findMany({
            where: rel,
            select: {
                tahun: true, petaniId: true,
                cherry: true, gabahBasah: true, gabahKering: true, greenBean: true,
                petani: { select: { desa: { select: { nama: true } } } },
            },
            orderBy: { tahun: "asc" },
        }),
        // Luas kopi per petani (untuk produktivitas nyata kg/ha per tahun).
        prisma.plotPetani.groupBy({ by: ["petaniId"], where: rel, _sum: { luasKopiHa: true } }),
    ]);

    // Produktivitas per tahun = total volume / total luas plot petani yang
    // melaporkan tahun itu. Bukan rata-rata nilai tersimpan (yang dulu salah
    // karena `produktivitas` tersimpan sebagai jumlah 4 kolom, bukan kg/ha).
    const areaOf = new Map(plotArea.map((p) => [p.petaniId, num(p._sum.luasKopiHa)]));
    type TahunAgg = {
        cherry: number; gabahBasah: number; gabahKering: number; greenBean: number;
        area: number; jumlahPetani: number;
    };
    const perTahun = new Map<string, TahunAgg>();
    for (const r of rows) {
        const key = String(r.tahun);
        const e = perTahun.get(key) ?? {
            cherry: 0, gabahBasah: 0, gabahKering: 0, greenBean: 0, area: 0, jumlahPetani: 0,
        };
        e.cherry += num(r.cherry);
        e.gabahBasah += num(r.gabahBasah);
        e.gabahKering += num(r.gabahKering);
        e.greenBean += num(r.greenBean);
        e.area += areaOf.get(r.petaniId) ?? 0;
        e.jumlahPetani += 1;
        perTahun.set(key, e);
    }
    const byTahun = [...perTahun.entries()]
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tahun, e]) => {
            const total = e.cherry + e.gabahBasah + e.gabahKering + e.greenBean;
            return {
                tahun,
                cherry: e.cherry,
                gabahBasah: e.gabahBasah,
                gabahKering: e.gabahKering,
                greenBean: e.greenBean,
                total,
                produktivitasRata: e.area > 0 ? total / e.area : 0,
                jumlahPetani: e.jumlahPetani,
            };
        });

    const tahunTerbaru = byTahun.length ? Number(byTahun[byTahun.length - 1].tahun) : null;

    // Produksi per desa untuk 4 tahun terakhir. Tiap tahun jadi satu bar
    // bertumpuk (cherry, gabah basah, gabah kering, green bean).
    const TAHUN_DESA = [2023, 2024, 2025, 2026];
    const KATEGORI = ["cherry", "gabahBasah", "gabahKering", "greenBean"] as const;
    type Kategori = Record<(typeof KATEGORI)[number], number>;
    const emptyKategori = (): Kategori => ({ cherry: 0, gabahBasah: 0, gabahKering: 0, greenBean: 0 });
    const perDesa = new Map<string, { nama: string; total: number; perTahun: Map<number, Kategori> }>();
    for (const r of rows) {
        if (!TAHUN_DESA.includes(r.tahun)) continue;
        const nama = r.petani.desa.nama;
        const e = perDesa.get(nama) ?? { nama, total: 0, perTahun: new Map<number, Kategori>() };
        const kategori = e.perTahun.get(r.tahun) ?? emptyKategori();
        for (const k of KATEGORI) {
            const v = num(r[k]);
            kategori[k] += v;
            e.total += v;
        }
        e.perTahun.set(r.tahun, kategori);
        perDesa.set(nama, e);
    }
    const perDesaTahun = [...perDesa.values()]
        .sort((a, b) => b.total - a.total)
        .map((d) => {
            const row: Record<string, string | number> = { nama: d.nama, total: d.total };
            for (const t of TAHUN_DESA) {
                const kategori = d.perTahun.get(t) ?? emptyKategori();
                for (const k of KATEGORI) row[`${t}_${k}`] = kategori[k];
            }
            return row;
        });

    return {
        tahunTerbaru,
        byTahun,
        perDesaTahun,
        tahunDesa: TAHUN_DESA,
    };
}

// ---------- Pasar & Produk ----------
export async function getPasarProduk(userId?: string, desaKode?: string) {
    const rel = relPetani(userId, desaKode);
    const [produk, pasar, totalPetani] = await Promise.all([
        prisma.produkDijual.findMany({
            where: { dijual: true, ...rel },
            select: { jenis: true, labelCustom: true, volumeKgTahun: true },
        }),
        prisma.pasarPetani.findMany({
            where: { aktif: true, ...rel },
            select: { kategori: true, labelCustom: true, persentase: true, profilPenjual: true },
        }),
        prisma.petani.count({ where: petaniWhere(userId, desaKode) }),
    ]);

    // Kelompokkan: label tetap + tiap labelCustom "Lainnya" jadi barisnya sendiri.
    // Label custom digabung case-insensitive ("kopi luwak" == "Kopi Luwak").
    const produkMap = new Map<string, { spell: Map<string, number>; label: string; jenis: string; volume: number; petani: number; custom: boolean }>();
    for (const p of produk) {
        const custom = p.jenis === "LAINNYA";
        const raw = custom ? clean(p.labelCustom) : null;
        const label = custom ? (raw ?? "Lainnya (tanpa nama)") : p.jenis;
        const key = custom ? `L:${ci(label)}` : p.jenis;
        const e = produkMap.get(key) ?? { spell: new Map<string, number>(), label, jenis: p.jenis, volume: 0, petani: 0, custom };
        e.spell.set(label, (e.spell.get(label) ?? 0) + 1);
        e.volume += num(p.volumeKgTahun);
        e.petani += 1;
        produkMap.set(key, e);
    }

    const pasarMap = new Map<string, { spell: Map<string, number>; label: string; kategori: string; petani: number; totalPersen: number; persenN: number; profil: Map<string, string>; custom: boolean }>();
    for (const p of pasar) {
        const custom = p.kategori === "LAINNYA";
        const raw = custom ? clean(p.labelCustom) : null;
        const label = custom ? (raw ?? "Lainnya (tanpa nama)") : p.kategori;
        const key = custom ? `L:${ci(label)}` : p.kategori;
        const e = pasarMap.get(key) ?? { spell: new Map<string, number>(), label, kategori: p.kategori, petani: 0, totalPersen: 0, persenN: 0, profil: new Map<string, string>(), custom };
        e.spell.set(label, (e.spell.get(label) ?? 0) + 1);
        e.petani += 1;
        if (p.persentase != null) { e.totalPersen += p.persentase; e.persenN += 1; }
        const prof = clean(p.profilPenjual);
        if (prof) e.profil.set(ci(prof), prof);
        pasarMap.set(key, e);
    }

    return {
        totalPetani,
        produk: [...produkMap.values()]
            .map(({ spell, ...p }) => ({ ...p, label: pickSpelling(spell), rataVolume: p.petani ? p.volume / p.petani : 0 }))
            .sort((a, b) => b.volume - a.volume),
        pasar: [...pasarMap.values()]
            .map(({ spell, ...p }) => ({ ...p, label: pickSpelling(spell), rataPersen: p.persenN ? p.totalPersen / p.persenN : 0, profil: [...p.profil.values()] }))
            .sort((a, b) => b.petani - a.petani),
    };
}

// ---------- Konservasi & Kondisi Kebun ----------
export async function getKonservasi(userId?: string) {
    const pRel = relPetani(userId);
    const pScope = petaniWhere(userId);
    const dScope = desaWhere(userId);
    const [kondisi, totalPetani, desa, desaRows] = await Promise.all([
        prisma.kondisiKebun.groupBy({ by: ["jenis"], where: { jawaban: true, ...pRel }, _count: true }),
        prisma.petani.count({ where: pScope }),
        prisma.baselineDesa.aggregate({
            where: dScope,
            _sum: { luasPenyanggaHa: true, luasAPLHa: true, tutupanHutan: true, tutupanAgroforestry: true },
            _avg: { jarakKonservasiKm: true },
            _count: true,
        }),
        prisma.baselineDesa.findMany({
            where: dScope,
            select: {
                rawanLongsor: true, rawanErosi: true, konflikSatwa: true, berbatasanKonservasi: true,
                jenisSatwaKonflik: true, namaKawasanKonservasi: true, praktikKonservasi: true,
                lokasiRawanLongsor: true, lokasiRawanErosi: true,
                tutupanHutan: true, tutupanHutanSatuan: true,
                tutupanAgroforestry: true, tutupanAgroforestrySatuan: true,
            },
        }),
    ]);

    const countTrue = (k: keyof (typeof desaRows)[number]) => desaRows.filter((d) => d[k] === true).length;

    // Praktik konservasi & satwa (teks bebas, case-insensitive, buang "-")
    const praktik = tally(desaRows, (d) => d.praktikKonservasi)
        .sort((a, b) => b.jumlah - a.jumlah).slice(0, 10);
    const satwa = tally(desaRows, (d) => d.jenisSatwaKonflik)
        .sort((a, b) => b.jumlah - a.jumlah).slice(0, 10);

    const kawasanSpell = new Map<string, Map<string, number>>();
    for (const d of desaRows) {
        const t = clean(d.namaKawasanKonservasi);
        if (!t) continue;
        const sp = kawasanSpell.get(ci(t)) ?? new Map<string, number>();
        sp.set(t, (sp.get(t) ?? 0) + 1);
        kawasanSpell.set(ci(t), sp);
    }
    const kawasan = [...kawasanSpell.values()].map(pickSpelling);

    return {
        totalPetani,
        kondisi: kondisi.map((k) => ({ jenis: k.jenis, jumlah: k._count, pct: totalPetani ? (k._count / totalPetani) * 100 : 0 })),
        jumlahDesa: desa._count,
        luasPenyanggaHa: num(desa._sum.luasPenyanggaHa),
        luasAPLHa: num(desa._sum.luasAPLHa),
        jarakKonservasiRata: num(desa._avg.jarakKonservasiKm),
        rawanLongsor: countTrue("rawanLongsor"),
        rawanErosi: countTrue("rawanErosi"),
        konflikSatwa: countTrue("konflikSatwa"),
        berbatasan: countTrue("berbatasanKonservasi"),
        tutupanHutan: num(desa._sum.tutupanHutan),
        tutupanAgroforestry: num(desa._sum.tutupanAgroforestry),
        praktik,
        satwa,
        kawasan,
    };
}

// ---------- Wilayah & Kelembagaan ----------
export async function getWilayah(userId?: string, desaKode?: string) {
    const pScope = petaniWhere(userId);
    const dScope = desaWhere(userId);
    // Filter desa hanya untuk demografi (jenis kelamin & kelompok usia).
    const demoScope = petaniWhere(userId, desaKode);
    const [perDesaRows, perGender, desaList, lembaga, kebijakan, petaniLahir] = await Promise.all([
        prisma.wilayahDesa.findMany({
            where: { petani: { some: pScope } },
            select: {
                nama: true,
                kecamatan: { select: { nama: true } },
                _count: { select: { petani: { where: pScope } } },
            },
        }),
        prisma.petani.groupBy({ by: ["jenisKelamin"], where: demoScope, _count: true }),
        prisma.baselineDesa.findMany({
            where: dScope,
            select: {
                jumlahPenduduk: true, luasArealKopiHa: true, jumlahPetaniKopi: true, jumlahKK: true,
                luasWilayahHa: true, luasKomoditiLainHa: true,
                topografi: true, jenisTanah: true, aksesJalan: true,
                ketinggianMdpl: true, suhuRataRataC: true,
                pembeliUtama: true, eksportir: true, industriPengolahan: true,
                permasalahanUtama: true, sumberData: true, tahunPendataan: true,
                wilayah: { select: { nama: true, kecamatan: { select: { nama: true } } } },
            },
        }),
        prisma.kelembagaanDesa.groupBy({ by: ["jenis"], where: relBaseline(userId), _sum: { jumlah: true }, _count: true }),
        prisma.kebijakanDesa.groupBy({ by: ["jenis"], where: { ada: true, ...relBaseline(userId) }, _count: true }),
        prisma.petani.findMany({ where: { tanggalLahir: { not: null }, ...demoScope }, select: { tanggalLahir: true } }),
    ]);

    const topDesa = perDesaRows
        .map((d) => ({
            nama: d.nama,
            kecamatan: d.kecamatan.nama,
            petani: d._count.petani,
        }))
        .sort((a, b) => b.petani - a.petani)
        .slice(0, 10);

    const gender = { L: 0, P: 0, null: 0 };
    for (const g of perGender) {
        if (g.jenisKelamin === "L") gender.L += g._count;
        else if (g.jenisKelamin === "P") gender.P += g._count;
        else gender.null += g._count;
    }

    // Kelompok usia petani
    const now = new Date();
    const buckets = [
        { label: "< 30", min: 0, max: 29 },
        { label: "30-39", min: 30, max: 39 },
        { label: "40-49", min: 40, max: 49 },
        { label: "50-59", min: 50, max: 59 },
        { label: "≥ 60", min: 60, max: 200 },
    ];
    const usia = buckets.map((b) => ({ label: b.label, jumlah: 0 }));
    for (const p of petaniLahir) {
        const d = p.tanggalLahir as Date;
        let age = now.getFullYear() - d.getFullYear();
        const m = now.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
        const idx = buckets.findIndex((b) => age >= b.min && age <= b.max);
        if (idx >= 0) usia[idx].jumlah += 1;
    }

    // Agregat & frekuensi atribut desa (case-insensitive, buang "-")
    const freq = (get: (d: (typeof desaList)[number]) => string | null | undefined) =>
        tally(desaList, get).sort((a, b) => b.jumlah - a.jumlah).slice(0, 8);

    const totalPenduduk = desaList.reduce((s, d) => s + num(d.jumlahPenduduk), 0);
    const totalKK = desaList.reduce((s, d) => s + num(d.jumlahKK), 0);
    const totalArealKopi = desaList.reduce((s, d) => s + num(d.luasArealKopiHa), 0);
    const totalPetaniKopi = desaList.reduce((s, d) => s + num(d.jumlahPetaniKopi), 0);
    const avg = (get: (d: (typeof desaList)[number]) => number | null) => {
        const vals = desaList.map(get).filter((v): v is number => v != null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    return {
        topDesa,
        gender,
        usia,
        totalPenduduk, totalKK, totalArealKopi, totalPetaniKopi,
        rataKetinggian: avg((d) => d.ketinggianMdpl),
        rataSuhu: avg((d) => d.suhuRataRataC),
        jumlahDesa: desaList.length,
        topografi: freq((d) => d.topografi),
        jenisTanah: freq((d) => d.jenisTanah),
        aksesJalan: freq((d) => d.aksesJalan),
        pembeliUtama: freq((d) => d.pembeliUtama),
        eksportir: freq((d) => d.eksportir),
        industri: freq((d) => d.industriPengolahan),
        permasalahan: freq((d) => d.permasalahanUtama),
        lembaga: lembaga.map((l) => ({ jenis: l.jenis, jumlah: num(l._sum.jumlah), desa: l._count })).sort((a, b) => b.jumlah - a.jumlah),
        kebijakan: kebijakan.map((k) => ({ jenis: k.jenis, desa: k._count })),
    };
}

// ---------- Agronomi Plot (varietas, budidaya, naungan, pestisida) ----------
export async function getAgronomi(userId?: string, desaKode?: string) {
    const rel = relPetani(userId, desaKode);
    const [plots, shadeRows, totalPetani] = await Promise.all([
        prisma.plotPetani.findMany({
            where: rel,
            select: {
                varietas: true, sistemBudidaya: true, statusKepemilikan: true, areaKonservasi: true,
                tahunTanam: true, luasKopiHa: true, pohonProduktif: true, pohonTidakProduktif: true,
                tanamanBaru: true, elevasiMdpl: true, kemiringanPersen: true,
                pestisidaNama: true, pestisidaBulanTahun: true,
            },
        }),
        prisma.tanamanNaungan.findMany({
            where: rel,
            select: { jenis: true, jumlah: true, pemangkasan: true, petaniId: true },
        }),
        prisma.petani.count({ where: petaniWhere(userId, desaKode) }),
    ]);

    const counter = (get: (p: (typeof plots)[number]) => string | null | undefined) =>
        tally(plots, get).sort((a, b) => b.jumlah - a.jumlah);

    // Varietas tersimpan digabung ", " per plot → pecah, hitung case-insensitive
    const varietasSpell = new Map<string, { jumlah: number; spell: Map<string, number> }>();
    for (const p of plots) {
        for (const raw of p.varietas?.split(",") ?? []) {
            const v = clean(raw);
            if (!v) continue;
            const e = varietasSpell.get(ci(v)) ?? { jumlah: 0, spell: new Map<string, number>() };
            e.jumlah += 1;
            e.spell.set(v, (e.spell.get(v) ?? 0) + 1);
            varietasSpell.set(ci(v), e);
        }
    }
    const varietas = [...varietasSpell.values()]
        .map((e) => ({ nama: pickSpelling(e.spell), jumlah: e.jumlah }))
        .sort((a, b) => b.jumlah - a.jumlah).slice(0, 12);

    const naunganMap = new Map<string, { spell: Map<string, number>; petani: Set<string>; pohon: number; dipangkas: number }>();
    for (const n of shadeRows) {
        const v = clean(n.jenis) ?? "(tanpa nama)";
        const e = naunganMap.get(ci(v)) ?? { spell: new Map<string, number>(), petani: new Set<string>(), pohon: 0, dipangkas: 0 };
        e.spell.set(v, (e.spell.get(v) ?? 0) + 1);
        e.petani.add(n.petaniId);
        e.pohon += n.jumlah ?? 0;
        if (n.pemangkasan) e.dipangkas += 1;
        naunganMap.set(ci(v), e);
    }
    const naungan = [...naunganMap.values()]
        .map((e) => ({ nama: pickSpelling(e.spell), petani: e.petani.size, pohon: e.pohon, dipangkas: e.dipangkas }))
        .sort((a, b) => b.petani - a.petani);

    const pestisida = counter((p) => p.pestisidaNama).slice(0, 12);

    // Distribusi umur per catatan tahun tanam (kohort), bukan per plot.
    const nowYear = new Date().getFullYear();
    const umurMap = new Map<string, number>();
    let totalPohonProduktif = 0, totalPohonTidakProduktif = 0, totalTanamanBaru = 0, totalLuas = 0;
    for (const p of plots) {
        totalPohonProduktif += p.pohonProduktif ?? 0;
        totalPohonTidakProduktif += p.pohonTidakProduktif ?? 0;
        totalTanamanBaru += p.tanamanBaru ?? 0;
        totalLuas += p.luasKopiHa ?? 0;
        for (const tahun of p.tahunTanam) {
            if (tahun < 1900 || tahun > nowYear) continue;
            const umur = nowYear - tahun;
            const bucket = umur < 3 ? "< 3 th" : umur < 7 ? "3-6 th" : umur < 15 ? "7-14 th" : "≥ 15 th";
            umurMap.set(bucket, (umurMap.get(bucket) ?? 0) + 1);
        }
    }
    const umurUrut = ["< 3 th", "3-6 th", "7-14 th", "≥ 15 th"];
    const umur = umurUrut.map((label) => ({ label, jumlah: umurMap.get(label) ?? 0 }));

    const rataProduktif = plots.length ? totalPohonProduktif / plots.length : 0;

    // AF/MK + plot yang sistem budidayanya belum diisi (null).
    const sistemMap = new Map<string, number>([
        ["AF", 0], ["MK", 0], ["KOSONG", 0],
    ]);
    for (const p of plots) {
        const key = p.sistemBudidaya ?? "KOSONG";
        sistemMap.set(key, (sistemMap.get(key) ?? 0) + 1);
    }
    const sistemBudidaya = [...sistemMap.entries()].map(([nama, jumlah]) => ({ nama, jumlah }));

    return {
        totalPetani, jumlahPlot: plots.length, totalLuas,
        totalPohonProduktif, totalPohonTidakProduktif, totalTanamanBaru, rataProduktif,
        varietas,
        sistemBudidaya,
        kepemilikan: counter((p) => p.statusKepemilikan),
        areaKonservasi: counter((p) => p.areaKonservasi),
        naungan, pestisida, umur,
    };
}

// ---------- Lokasi (koordinat untuk peta) ----------
export async function getLokasi(userId?: string) {
    const pRel = relPetani(userId);
    const dScope = desaWhere(userId);
    const [desa, plots] = await Promise.all([
        prisma.baselineDesa.findMany({
            where: { latitude: { not: null }, longitude: { not: null }, ...dScope },
            select: {
                latitude: true, longitude: true, luasWilayahHa: true, luasArealKopiHa: true,
                jumlahPetaniKopi: true, jumlahPenduduk: true, ketinggianMdpl: true,
                wilayah: { select: { nama: true, kecamatan: { select: { nama: true, kabupaten: { select: { nama: true } } } } } },
            },
        }),
        prisma.plotPetani.findMany({
            where: { fotoLatitude: { not: null }, fotoLongitude: { not: null }, ...pRel },
            select: {
                fotoLatitude: true, fotoLongitude: true, luasKopiHa: true, varietas: true, namaHamparan: true,
                petani: { select: { namaLengkap: true, desa: { select: { nama: true } } } },
            },
        }),
    ]);

    return {
        desa: desa.map((d) => ({
            lat: d.latitude as number, lng: d.longitude as number,
            nama: d.wilayah.nama, kecamatan: d.wilayah.kecamatan.nama, kabupaten: d.wilayah.kecamatan.kabupaten.nama,
            luasWilayahHa: num(d.luasWilayahHa), luasArealKopiHa: num(d.luasArealKopiHa),
            petaniKopi: num(d.jumlahPetaniKopi),
            penduduk: num(d.jumlahPenduduk), ketinggian: d.ketinggianMdpl,
        })),
        plot: plots.map((p) => ({
            lat: p.fotoLatitude as number, lng: p.fotoLongitude as number,
            luasKopiHa: num(p.luasKopiHa), varietas: p.varietas, hamparan: p.namaHamparan,
            petani: p.petani.namaLengkap, desa: p.petani.desa.nama,
        })),
    };
}
