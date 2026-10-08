// app/(main)/petani/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { GAP_ITEMS, KONDISI_KEBUN, PRODUK, PASAR, TAHUN_PRODUKSI } from "./constants";
import { formatZodError } from "@/lib/zod-error";
import type { ActionState } from "../_components/action-form";
import type {
    StatusKepemilikanLahan,
    SistemBudidaya,
    SatuanProduksi,
    JawabanGap,
} from "@/app/generated/prisma/enums";

// ---------- Helpers zod ----------
const num = z.preprocess(
    (v) => (v === "" || v == null ? 0 : v),
    z.coerce.number().min(0)
);
const intNum = z.preprocess(
    (v) => (v === "" || v == null ? 0 : v),
    z.coerce.number().int().min(0)
);
const str = z.preprocess(
    (v) => {
        if (v == null) return "-";
        const s = String(v).trim();
        return s === "" ? "-" : s;
    },
    z.string()
);
const strOpt = z.preprocess(
    (v) => {
        if (v == null) return undefined;
        const s = String(v).trim();
        return s === "" ? undefined : s;
    },
    z.string().optional()
);
const bool = z.preprocess((v) => v === "true", z.boolean());
const intOpt = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().optional()
);
const latOpt = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(-90).max(90).optional()
);
const longOpt = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(-180).max(180).optional()
);
const enumOpt = <T extends string>(values: readonly T[]) =>
    z.preprocess(
        (v) => (v === "" || v == null ? undefined : v),
        z.enum(values as [T, ...T[]]).optional()
    );
const dateOpt = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.date().optional()
);

const STATUS_KEPEMILIKAN_VALUES = ["MS", "SW", "BH", "TA", "L"] as const;
const SISTEM_BUDIDAYA_VALUES = ["AF", "MK"] as const;
const SATUAN_VALUES = ["KG", "SOLUP", "BAMBU", "KALENG"] as const;
const JAWABAN_GAP_VALUES = ["YA", "TIDAK", "KADANG"] as const;

// ---------- Skema bagian A ----------
const schema = z.object({
    desaKode: z.string().min(1, "Desa wajib dipilih"),
    namaLengkap: z.string().min(1, "Nama lengkap wajib diisi"),
    namaPanggilan: str,
    jenisKelamin: enumOpt(["L", "P"] as const),
    tanggalLahir: dateOpt,
    alamatDomisili: str,
    telepon: str,
    tanggalPendaftaran: dateOpt,
    namaPetugasPendaftar: str,
    kontakDaruratNama: str,
    kontakDaruratTelepon: str,
    kontakDaruratHubungan: str,
});

// B.1 - varietas ditangani terpisah (multi-entry, digabung ", ")
const plotSchema = z.object({
    namaHamparan: str,
    tahunTanam: z.array(z.number().int().min(1900).max(new Date().getFullYear())),
    kodeGps: strOpt,
    elevasiMdpl: num,
    kemiringanPersen: num,
    luasKopiHa: num,
    fotoKey: strOpt,
    fotoLatitude: latOpt,
    fotoLongitude: longOpt,
    statusKepemilikan: enumOpt(STATUS_KEPEMILIKAN_VALUES),
    sistemBudidaya: enumOpt(SISTEM_BUDIDAYA_VALUES),
    areaKonservasi: str,
    tanamanBaru: intNum,
    pohonProduktif: intNum,
    pohonTidakProduktif: intNum,
    pestisidaNama: strOpt,
    pestisidaBulanTahun: strOpt, // "YYYY-MM" dari input type=month
});

// B.2 - Tanaman naungan/sela/tegakan
const naunganSchema = z.object({
    jenis: str,
    jumlah: intNum,
    fungsi: str,
    pemangkasan: bool,
    produksiPerTahun: str,
    tahunTanam: intOpt,
});

// ---------- Helpers FormData ----------
function get(formData: FormData, key: string) {
    const v = formData.get(key);
    if (v === null) return undefined;
    const s = String(v).trim();
    return s === "" ? undefined : s;
}

function getBool(formData: FormData, key: string) {
    return get(formData, key) === "true";
}

function hasAnyWithPrefix(formData: FormData, prefix: string) {
    for (const k of formData.keys()) if (k.startsWith(prefix)) return true;
    return false;
}

const PLOT_FIELDS = [
    "namaHamparan", "kodeGps", "elevasiMdpl",
    "kemiringanPersen", "luasKopiHa", "fotoKey", "fotoLatitude", "fotoLongitude",
    "statusKepemilikan", "sistemBudidaya", "areaKonservasi", "tanamanBaru",
    "pohonProduktif", "pohonTidakProduktif", "pestisidaNama", "pestisidaBulanTahun",
] as const;

const NAUNGAN_FIELDS = [
    "jenis", "jumlah", "fungsi", "pemangkasan", "produksiPerTahun", "tahunTanam",
] as const;

function varietasGabung(formData: FormData, i: number): string {
    const list: string[] = [];
    for (let k = 0; ; k++) {
        if (formData.get(`plot_${i}_varietas_${k}`) === null) break;
        const v = get(formData, `plot_${i}_varietas_${k}`);
        if (v) list.push(v);
    }
    return list.length ? list.join(", ") : "-";
}

function plotRows(formData: FormData) {
    const rows: (z.infer<typeof plotSchema> & {
        varietas: string;
    })[] = [];

    for (let i = 0; ; i++) {
        if (!hasAnyWithPrefix(formData, `plot_${i}_`)) break;

        const raw: Record<string, string | undefined> = {};
        for (const f of PLOT_FIELDS) raw[f] = get(formData, `plot_${i}_${f}`);
        const yearPrefix = `plot_${i}_tahunTanam_`;
        const yearKeys = [...formData.keys()]
            .filter((key) => key.startsWith(yearPrefix))
            .sort((a, b) => Number(a.slice(yearPrefix.length)) - Number(b.slice(yearPrefix.length)));
        const years: number[] = [];
        for (const key of yearKeys) {
            const rawYear = get(formData, key);
            if (rawYear === undefined) continue;
            const parsedYear = z.coerce.number().int().min(1900).max(new Date().getFullYear()).safeParse(rawYear);
            if (!parsedYear.success) throw new Error(`Plot ${i + 1}: tahun tanam harus antara 1900 dan ${new Date().getFullYear()}.`);
            years.push(parsedYear.data);
        }
        const uniqueYears = [...new Set(years)].sort((a, b) => a - b);
        raw.tahunTanam = undefined;
        const varietas = varietasGabung(formData, i);
        if (Object.values(raw).every((v) => v === undefined) && varietas === "-" && uniqueYears.length === 0) continue;

        const parsed = plotSchema.safeParse({ ...raw, tahunTanam: uniqueYears });
        if (!parsed.success) {
            throw new Error(formatZodError(parsed.error, `Plot ${i + 1}`));
        }
        rows.push({ ...parsed.data, varietas });
    }
    return rows;
}

function naunganRows(formData: FormData) {
    const rows: z.infer<typeof naunganSchema>[] = [];
    for (let i = 0; ; i++) {
        if (!hasAnyWithPrefix(formData, `naung_${i}_`)) break;
        const raw: Record<string, string | undefined> = {};
        for (const f of NAUNGAN_FIELDS) raw[f] = get(formData, `naung_${i}_${f}`);
        const bermakna = NAUNGAN_FIELDS.some((f) => f !== "pemangkasan" && raw[f] !== undefined);
        if (!bermakna) continue;
        const parsed = naunganSchema.safeParse(raw);
        if (!parsed.success) throw new Error(formatZodError(parsed.error, `Tanaman naungan baris ${i + 1}`));
        rows.push(parsed.data);
    }
    return rows;
}

// C - GAP: default TIDAK sesuai permintaan
function gapRows(formData: FormData) {
    return GAP_ITEMS.map((g) => {
        const v = get(formData, `gap_${g.jenis}`) ?? "TIDAK";
        const jawaban = (JAWABAN_GAP_VALUES as readonly string[]).includes(v)
            ? (v as JawabanGap)
            : ("TIDAK" as JawabanGap);
        return {
            jenis: g.jenis,
            jawaban,
            keterangan: get(formData, `gap_${g.jenis}_ket`) ?? "-",
        };
    });
}

function produksiRows(formData: FormData) {
    return TAHUN_PRODUKSI.map((tahun) => {
        const s = get(formData, `prod_${tahun}_satuan`);
        const satuan = (SATUAN_VALUES as readonly string[]).includes(s ?? "")
            ? (s as SatuanProduksi)
            : ("KG" as SatuanProduksi);
        const cherry = num.parse(formData.get(`prod_${tahun}_cherry`));
        const gabahBasah = num.parse(formData.get(`prod_${tahun}_gabahBasah`));
        const gabahKering = num.parse(formData.get(`prod_${tahun}_gabahKering`));
        const greenBean = num.parse(formData.get(`prod_${tahun}_greenBean`));

        return {
            tahun,
            satuan,
            cherry,
            gabahBasah,
            gabahKering,
            greenBean,
            produktivitas: cherry + gabahBasah + gabahKering + greenBean,
        };
    });
}

function produkRows(formData: FormData) {
    const fixed = PRODUK.map((p) => ({
        jenis: p.jenis,
        labelCustom: null as string | null,
        dijual: getBool(formData, `pd_${p.jenis}`),
        volumeKgTahun: num.parse(formData.get(`pd_${p.jenis}_vol`)),
    }));

    const custom: typeof fixed = [];
    for (let i = 0; ; i++) {
        if (!hasAnyWithPrefix(formData, `pdl_${i}_`)) break;
        const nama = get(formData, `pdl_${i}_nama`);
        if (!nama) continue;
        custom.push({
            jenis: "LAINNYA",
            labelCustom: nama,
            dijual: getBool(formData, `pdl_${i}_dijual`),
            volumeKgTahun: num.parse(formData.get(`pdl_${i}_vol`)),
        });
    }
    return [...fixed, ...custom];
}

function pasarRows(formData: FormData) {
    const fixed = PASAR.map((p) => ({
        kategori: p.kategori,
        labelCustom: null as string | null,
        aktif: getBool(formData, `ps_${p.kategori}`),
        persentase: num.parse(formData.get(`ps_${p.kategori}_persen`)),
        profilPenjual: get(formData, `ps_${p.kategori}_profil`) ?? "-",
    }));

    const custom: typeof fixed = [];
    for (let i = 0; ; i++) {
        if (!hasAnyWithPrefix(formData, `psl_${i}_`)) break;
        const nama = get(formData, `psl_${i}_nama`);
        if (!nama) continue;
        custom.push({
            kategori: "LAINNYA",
            labelCustom: nama,
            aktif: getBool(formData, `psl_${i}_aktif`),
            persentase: num.parse(formData.get(`psl_${i}_persen`)),
            profilPenjual: get(formData, `psl_${i}_profil`) ?? "-",
        });
    }
    return [...fixed, ...custom];
}

function kondisiRows(formData: FormData) {
    return KONDISI_KEBUN.map((k) => ({
        jenis: k.jenis,
        jawaban: getBool(formData, `kb_${k.jenis}`),
        keterangan: get(formData, `kb_${k.jenis}_ket`) ?? "-",
    }));
}

function buildKodePetani(formData: FormData): string | null {
    const s1 = get(formData, "kp1");
    const s2 = get(formData, "kp2");
    const s3 = get(formData, "kp3");
    if (!s2 && !s3) return null;
    if (!s1 || !s2 || !s3) throw new Error("Kode petani belum lengkap (harus 3 bagian).");
    return `${s1}-${s2}-${s3}`.toUpperCase();
}

async function resolveKelompokTaniId(formData: FormData, desaKode: string) {
    const existingId = get(formData, "kelompokTaniId");
    if (existingId) {
        const kt = await prisma.kelompokTani.findUnique({ where: { id: existingId } });
        if (!kt || kt.desaKode !== desaKode) throw new Error("Kelompok tani tidak valid.");
        return kt.id;
    }

    const nama = get(formData, "kt_nama");
    if (!nama) return null;

    const k1 = get(formData, "kt_kode_1");
    const k2 = get(formData, "kt_kode_2");
    let kode: string | null = null;
    if (k1 || k2) {
        if (!k1 || !k2) throw new Error("Kode kelompok tani belum lengkap (2 bagian).");
        kode = `${k1}-${k2}`.toUpperCase();
    }

    const existing = kode
        ? await prisma.kelompokTani.findUnique({
            where: { desaKode_kode: { desaKode, kode } },
        })
        : await prisma.kelompokTani.findFirst({
            where: { desaKode, kode: null, nama: { equals: nama, mode: "insensitive" } },
        });
    if (existing) return existing.id;

    const created = await prisma.kelompokTani.create({
        data: { nama, kode, desaKode },
    });
    return created.id;
}

function childrenPayload(formData: FormData) {
    return {
        plot: {
            create: plotRows(formData).map((p, idx) => ({
                nomor: idx + 1,
                namaHamparan: p.namaHamparan,
                varietas: p.varietas,
                tahunTanam: p.tahunTanam,
                kodeGps: p.kodeGps,
                elevasiMdpl: p.elevasiMdpl,
                kemiringanPersen: p.kemiringanPersen,
                luasKopiHa: p.luasKopiHa,
                fotoKey: p.fotoKey,
                fotoLatitude: p.fotoLatitude,
                fotoLongitude: p.fotoLongitude,
                statusKepemilikan: p.statusKepemilikan as StatusKepemilikanLahan | undefined,
                sistemBudidaya: p.sistemBudidaya as SistemBudidaya | undefined,
                areaKonservasi: p.areaKonservasi,
                tanamanBaru: p.tanamanBaru,
                pohonProduktif: p.pohonProduktif,
                pohonTidakProduktif: p.pohonTidakProduktif,
                pestisidaNama: p.pestisidaNama,
                pestisidaBulanTahun: p.pestisidaBulanTahun,
            })),
        },
        naungan: { create: naunganRows(formData) },
        praktikGap: { create: gapRows(formData) },
        produksi: { create: produksiRows(formData) },
        produk: { create: produkRows(formData) },
        pasar: { create: pasarRows(formData) },
        kondisiKebun: { create: kondisiRows(formData) },
    };
}

// Konversi error apa pun (termasuk ZodError mentah dari num.parse) jadi pesan form
function toActionError(e: unknown): string {
    if (e instanceof z.ZodError) return formatZodError(e);
    return e instanceof Error ? e.message : "Data tidak valid";
}

function parseAll(formData: FormData) {
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        throw new Error(formatZodError(parsed.error, "Data identitas petani"));
    }
    const kodePetani = buildKodePetani(formData);
    const children = childrenPayload(formData);
    return { scalars: parsed.data, kodePetani, children };
}

// ---------- CREATE ----------
export async function createPetani(
    prev: ActionState,
    formData: FormData
): Promise<ActionState> {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    let scalars, kodePetani, children, kelompokTaniId;
    try {
        ({ scalars, kodePetani, children } = parseAll(formData));
        kelompokTaniId = await resolveKelompokTaniId(formData, scalars.desaKode);
    } catch (e) {
        return { error: toActionError(e) };
    }

    if (kodePetani) {
        const dup = await prisma.petani.findUnique({ where: { kodePetani } });
        if (dup) return { error: "Kode petani sudah dipakai." };
    }

    await prisma.petani.create({
        data: {
            ...scalars,
            kodePetani,
            kelompokTaniId,
            createdById: session.user.id,
            ...children,
        },
    });

    revalidatePath("/petani");
    redirect("/petani");
}

// ---------- UPDATE ----------
// Dipakai dengan .bind(null, id) → signature form jadi (prev, formData)
export async function updatePetani(
    id: string,
    prev: ActionState,
    formData: FormData
): Promise<ActionState> {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const existing = await prisma.petani.findUnique({ where: { id } });
    if (!existing) return { error: "Data tidak ditemukan" };
    if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
        return { error: "Forbidden" };
    }

    let scalars, kodePetani, children, kelompokTaniId;
    try {
        ({ scalars, kodePetani, children } = parseAll(formData));
        kelompokTaniId = await resolveKelompokTaniId(formData, scalars.desaKode);
    } catch (e) {
        return { error: toActionError(e) };
    }

    if (kodePetani && kodePetani !== existing.kodePetani) {
        const dup = await prisma.petani.findUnique({ where: { kodePetani } });
        if (dup) return { error: "Kode petani sudah dipakai." };
    }

    await prisma.$transaction([
        prisma.plotPetani.deleteMany({ where: { petaniId: id } }),
        prisma.tanamanNaungan.deleteMany({ where: { petaniId: id } }),
        prisma.praktikGap.deleteMany({ where: { petaniId: id } }),
        prisma.riwayatProduksi.deleteMany({ where: { petaniId: id } }),
        prisma.produkDijual.deleteMany({ where: { petaniId: id } }),
        prisma.pasarPetani.deleteMany({ where: { petaniId: id } }),
        prisma.kondisiKebun.deleteMany({ where: { petaniId: id } }),
        prisma.petani.update({
            where: { id },
            data: {
                ...scalars,
                kodePetani,
                kelompokTaniId,
                ...children,
            },
        }),
    ]);

    revalidatePath("/petani");
    redirect("/petani");
}

// ---------- DELETE ----------
// Kembalikan { error } bila gagal - pesan throw disensor Next.js di produksi.
export async function deletePetani(id: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const existing = await prisma.petani.findUnique({ where: { id } });
    if (!existing) return { error: "Data tidak ditemukan" };
    if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
        return { error: "Forbidden" };
    }

    await prisma.petani.delete({ where: { id } });

    revalidatePath("/petani");
    redirect("/petani");
}