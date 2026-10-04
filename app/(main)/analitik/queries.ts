// app/(main)/analitik/queries.ts
// Agregasi server-side untuk dashboard & halaman analitik (khusus ADMIN).
import { prisma } from "@/lib/prisma";
import type { JenisPraktikGap } from "@/app/generated/prisma/enums";

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
        areal, plot, petaniKopiDesa, produksiTahun, harga,
    ] = await Promise.all([
        prisma.petani.count(),
        prisma.baselineDesa.count(),
        prisma.kelompokTani.count(),
        prisma.baselineDesa.aggregate({ _sum: { luasArealKopiHa: true } }),
        prisma.plotPetani.aggregate({ _sum: { luasKopiHa: true, pohonProduktif: true } }),
        prisma.baselineDesa.aggregate({ _sum: { jumlahPetaniKopi: true } }),
        prisma.riwayatProduksi.groupBy({
            by: ["tahun"],
            _sum: { cherry: true, gabahBasah: true, greenBean: true, gabahKering: true },
            orderBy: { tahun: "asc" },
        }),
        prisma.baselineDesa.aggregate({
            _avg: { hargaCherryRp: true, hargaGreenBeanRpKg: true, produktivitasKgHaTahun: true },
        }),
    ]);

    const terbaru = produksiTahun.at(-1);
    return {
        jumlahPetani, jumlahDesa, jumlahKelompok,
        luasArealKopiHa: num(areal._sum.luasArealKopiHa),
        luasPlotHa: num(plot._sum.luasKopiHa),
        pohonProduktif: num(plot._sum.pohonProduktif),
        petaniKopiDesa: num(petaniKopiDesa._sum.jumlahPetaniKopi),
        tahunTerbaru: terbaru?.tahun ?? null,
        produksiTerbaru: {
            cherry: num(terbaru?._sum.cherry),
            greenBean: num(terbaru?._sum.greenBean),
            gabahBasah: num(terbaru?._sum.gabahBasah),
            gabahKering: num(terbaru?._sum.gabahKering),
        },
        hargaRataCherry: num(harga._avg.hargaCherryRp),
        hargaRataGreenBean: num(harga._avg.hargaGreenBeanRpKg),
        produktivitasRata: num(harga._avg.produktivitasKgHaTahun),
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
export async function getGapAdoption() {
    const [totalPetani, rows] = await Promise.all([
        prisma.petani.count(),
        prisma.praktikGap.groupBy({ by: ["jenis", "jawaban"], _count: true }),
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
export async function getProduksi() {
    const [byTahun, terbaruRows] = await Promise.all([
        prisma.riwayatProduksi.groupBy({
            by: ["tahun"],
            _sum: { cherry: true, gabahBasah: true, gabahKering: true, greenBean: true },
            _avg: { produktivitas: true },
            _count: true,
            orderBy: { tahun: "asc" },
        }),
        prisma.riwayatProduksi.findMany({
            select: {
                tahun: true, cherry: true, gabahBasah: true, gabahKering: true, greenBean: true,
                petani: { select: { desa: { select: { nama: true } } } },
            },
        }),
    ]);

    const tahunTerbaru = byTahun.at(-1)?.tahun ?? null;
    const perDesa = new Map<string, { nama: string; cherry: number; gabahBasah: number; gabahKering: number; greenBean: number }>();
    for (const r of terbaruRows) {
        if (r.tahun !== tahunTerbaru) continue;
        const nama = r.petani.desa.nama;
        const e = perDesa.get(nama) ?? { nama, cherry: 0, gabahBasah: 0, gabahKering: 0, greenBean: 0 };
        e.cherry += num(r.cherry);
        e.gabahBasah += num(r.gabahBasah);
        e.gabahKering += num(r.gabahKering);
        e.greenBean += num(r.greenBean);
        perDesa.set(nama, e);
    }
    const topDesa = [...perDesa.values()]
        .map((d) => ({ ...d, total: d.cherry + d.gabahBasah + d.gabahKering + d.greenBean }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 7);

    return {
        tahunTerbaru,
        byTahun: byTahun.map((t) => ({
            tahun: String(t.tahun),
            cherry: num(t._sum.cherry),
            gabahBasah: num(t._sum.gabahBasah),
            gabahKering: num(t._sum.gabahKering),
            greenBean: num(t._sum.greenBean),
            produktivitasRata: num(t._avg.produktivitas),
            jumlahPetani: t._count,
        })),
        topDesa,
    };
}

// ---------- Pasar & Produk ----------
export async function getPasarProduk() {
    const [produk, pasar, totalPetani, volumeByJenis] = await Promise.all([
        prisma.produkDijual.findMany({
            where: { dijual: true },
            select: { jenis: true, labelCustom: true, volumeKgTahun: true },
        }),
        prisma.pasarPetani.findMany({
            where: { aktif: true },
            select: { kategori: true, labelCustom: true, persentase: true, profilPenjual: true },
        }),
        prisma.petani.count(),
        // volume "lainnya" yang mungkin tercatat walau baris tidak ditandai dijual
        prisma.produkDijual.groupBy({ by: ["jenis"], _sum: { volumeKgTahun: true } }),
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
        volumeByJenis: volumeByJenis.map((v) => ({ jenis: v.jenis, volume: num(v._sum.volumeKgTahun) })),
    };
}

// ---------- Konservasi & Kondisi Kebun ----------
export async function getKonservasi() {
    const [kondisi, totalPetani, desa, desaRows] = await Promise.all([
        prisma.kondisiKebun.groupBy({ by: ["jenis"], where: { jawaban: true }, _count: true }),
        prisma.petani.count(),
        prisma.baselineDesa.aggregate({
            _sum: { luasPenyanggaHa: true, luasAPLHa: true, tutupanHutan: true, tutupanAgroforestry: true },
            _avg: { jarakKonservasiKm: true },
            _count: true,
        }),
        prisma.baselineDesa.findMany({
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
export async function getWilayah() {
    const [perDesa, perGender, desaList, lembaga, kebijakan, petaniLahir] = await Promise.all([
        prisma.petani.groupBy({ by: ["desaKode"], _count: true }),
        prisma.petani.groupBy({ by: ["jenisKelamin"], _count: true }),
        prisma.baselineDesa.findMany({
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
        prisma.kelembagaanDesa.groupBy({ by: ["jenis"], _sum: { jumlah: true }, _count: true }),
        prisma.kebijakanDesa.groupBy({ by: ["jenis"], where: { ada: true }, _count: true }),
        prisma.petani.findMany({ where: { tanggalLahir: { not: null } }, select: { tanggalLahir: true } }),
    ]);

    const desaKodeSet = new Set(perDesa.map((d) => d.desaKode));
    const namaDesa = await prisma.wilayahDesa.findMany({
        where: { kode: { in: [...desaKodeSet] } },
        select: { kode: true, nama: true, kecamatan: { select: { nama: true } } },
    });
    const namaMap = new Map(namaDesa.map((d) => [d.kode, d]));

    const topDesa = perDesa
        .map((d) => ({
            nama: namaMap.get(d.desaKode)?.nama ?? d.desaKode,
            kecamatan: namaMap.get(d.desaKode)?.kecamatan.nama ?? "-",
            petani: d._count,
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
export async function getAgronomi() {
    const [plots, totalPetani] = await Promise.all([
        prisma.plotPetani.findMany({
            select: {
                varietas: true, sistemBudidaya: true, statusKepemilikan: true, areaKonservasi: true,
                tahunTanam: true, luasKopiHa: true, pohonProduktif: true, pohonTidakProduktif: true,
                tanamanBaru: true, elevasiMdpl: true, kemiringanPersen: true,
                pestisidaNama: true, pestisidaBulanTahun: true,
                naungan: { select: { jenis: true, jumlah: true, pemangkasan: true } },
            },
        }),
        prisma.petani.count(),
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

    const naunganMap = new Map<string, { spell: Map<string, number>; plot: number; pohon: number; dipangkas: number }>();
    for (const p of plots) {
        for (const n of p.naungan) {
            const v = clean(n.jenis) ?? "(tanpa nama)";
            const e = naunganMap.get(ci(v)) ?? { spell: new Map<string, number>(), plot: 0, pohon: 0, dipangkas: 0 };
            e.spell.set(v, (e.spell.get(v) ?? 0) + 1);
            e.plot += 1;
            e.pohon += n.jumlah ?? 0;
            if (n.pemangkasan) e.dipangkas += 1;
            naunganMap.set(ci(v), e);
        }
    }
    const naungan = [...naunganMap.values()]
        .map((e) => ({ nama: pickSpelling(e.spell), plot: e.plot, pohon: e.pohon, dipangkas: e.dipangkas }))
        .sort((a, b) => b.plot - a.plot);

    const pestisida = counter((p) => p.pestisidaNama).slice(0, 12);

    // Distribusi umur tanaman (tahun tanam → umur)
    const nowYear = new Date().getFullYear();
    const umurMap = new Map<string, number>();
    let totalPohonProduktif = 0, totalPohonTidakProduktif = 0, totalTanamanBaru = 0, totalLuas = 0;
    for (const p of plots) {
        totalPohonProduktif += p.pohonProduktif ?? 0;
        totalPohonTidakProduktif += p.pohonTidakProduktif ?? 0;
        totalTanamanBaru += p.tanamanBaru ?? 0;
        totalLuas += p.luasKopiHa ?? 0;
        if (p.tahunTanam) {
            const umur = nowYear - p.tahunTanam;
            const bucket = umur < 3 ? "< 3 th" : umur < 7 ? "3-6 th" : umur < 15 ? "7-14 th" : "≥ 15 th";
            umurMap.set(bucket, (umurMap.get(bucket) ?? 0) + 1);
        }
    }
    const umurUrut = ["< 3 th", "3-6 th", "7-14 th", "≥ 15 th"];
    const umur = umurUrut.map((label) => ({ label, jumlah: umurMap.get(label) ?? 0 }));

    const rataProduktif = plots.length ? totalPohonProduktif / plots.length : 0;

    return {
        totalPetani, jumlahPlot: plots.length, totalLuas,
        totalPohonProduktif, totalPohonTidakProduktif, totalTanamanBaru, rataProduktif,
        varietas,
        sistemBudidaya: counter((p) => p.sistemBudidaya),
        kepemilikan: counter((p) => p.statusKepemilikan),
        areaKonservasi: counter((p) => p.areaKonservasi),
        naungan, pestisida, umur,
    };
}

// ---------- Lokasi (koordinat untuk peta) ----------
export async function getLokasi() {
    const [desa, plots] = await Promise.all([
        prisma.baselineDesa.findMany({
            where: { latitude: { not: null }, longitude: { not: null } },
            select: {
                latitude: true, longitude: true, luasArealKopiHa: true, jumlahPetaniKopi: true, jumlahPenduduk: true,
                ketinggianMdpl: true,
                wilayah: { select: { nama: true, kecamatan: { select: { nama: true, kabupaten: { select: { nama: true } } } } } },
            },
        }),
        prisma.plotPetani.findMany({
            where: { fotoLatitude: { not: null }, fotoLongitude: { not: null } },
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
            luasArealKopiHa: num(d.luasArealKopiHa), petaniKopi: num(d.jumlahPetaniKopi),
            penduduk: num(d.jumlahPenduduk), ketinggian: d.ketinggianMdpl,
        })),
        plot: plots.map((p) => ({
            lat: p.fotoLatitude as number, lng: p.fotoLongitude as number,
            luasKopiHa: num(p.luasKopiHa), varietas: p.varietas, hamparan: p.namaHamparan,
            petani: p.petani.namaLengkap, desa: p.petani.desa.nama,
        })),
    };
}
