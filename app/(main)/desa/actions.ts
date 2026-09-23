"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { KEBIJAKAN, LEMBAGA } from "./constants";

// ---------- Helpers zod ----------
// Angka: kosong → 0
const num = z.preprocess(
    (v) => (v === "" || v == null ? 0 : v),
    z.coerce.number().min(0)
);
// Teks: kosong → "-"
const str = z.preprocess(
    (v) => {
        if (v == null) return "-";
        const s = String(v).trim();
        return s === "" ? "-" : s;
    },
    z.string()
);
// Boolean: segmented selalu submit "true"/"false"
const bool = z.preprocess((v) => v === "true", z.boolean());
// Satuan tutupan: default PERSEN
const satuan = z.preprocess(
    (v) => (v === "" || v == null ? "PERSEN" : v),
    z.enum(["PERSEN", "HA"])
);
// PENGECUALIAN: koordinat tetap boleh kosong (0,0 adalah titik nyata di laut)
const latOpt = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(-90).max(90).optional()
);
const longOpt = z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(-180).max(180).optional()
);

const schema = z.object({
    desaKode: z.string().min(1, "Desa wajib dipilih"),
    tahunPendataan: z.coerce.number().int().min(2000).max(2100),
    sumberData: str,
    luasWilayahHa: num, jumlahPenduduk: num, jumlahKK: num,
    jumlahPetaniKopi: num, luasArealKopiHa: num, luasKomoditiLainHa: num,
    latitude: latOpt,
    longitude: longOpt,
    topografi: str, ketinggianMdpl: num,
    bulanHujan: str, bulanKering: str, suhuRataRataC: num,
    jenisTanah: str, aksesJalan: str,
    jarakIbukotaKecamatanKm: num, jarakPasarKm: num, jarakKonservasiKm: num,
    luasAPLHa: num, namaKawasanKonservasi: str,
    produktivitasKgHaTahun: num, hargaCherryRp: num, hargaGreenBeanRpKg: num,
    pembeliUtama: str, jumlahPedagangPengumpul: num, koperasiAktifUnit: num,
    eksportir: str, industriPengolahan: str, permasalahanUtama: str,
    berbatasanKonservasi: bool, luasPenyanggaHa: num,
    tutupanHutan: num, tutupanHutanSatuan: satuan,
    tutupanAgroforestry: num, tutupanAgroforestrySatuan: satuan,
    rawanLongsor: bool, lokasiRawanLongsor: str,
    rawanErosi: bool, lokasiRawanErosi: str,
    konflikSatwa: bool, jenisSatwaKonflik: str,
    praktikKonservasi: str,
});

// ---------- Helpers FormData ----------
function get(formData: FormData, key: string) {
    const v = formData.get(key);
    if (v === null) return undefined;
    const s = String(v).trim();
    return s === "" ? undefined : s;
}

function getNum(formData: FormData, key: string) {
    const v = get(formData, key);
    return v === undefined ? undefined : Number(v);
}

// Bagian B: kosong → "-"
function kebijakanRows(formData: FormData) {
    return KEBIJAKAN.map((k) => ({
        jenis: k.jenis,
        ada: get(formData, `kb_${k.jenis}`) === "true",
        keterangan: get(formData, `kb_${k.jenis}_ket`) ?? "-",
    }));
}

// Bagian C: jumlah kosong → 0, kondisi kosong → "-"
function kelembagaanRows(formData: FormData) {
    return LEMBAGA.map((l) => ({
        jenis: l.jenis,
        jumlah: getNum(formData, `lm_${l.jenis}_jumlah`) ?? 0,
        kondisi: get(formData, `lm_${l.jenis}_kondisi`) ?? "-",
    }));
}

// ---------- CREATE ----------
export async function createBaselineDesa(formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        console.error(parsed.error.flatten());
        throw new Error("Data tidak valid: " + parsed.error.issues[0].path.join("."));
    }

    const existing = await prisma.baselineDesa.findUnique({
        where: { desaKode: parsed.data.desaKode },
    });
    if (existing) throw new Error("Baseline untuk desa ini sudah diinput.");

    await prisma.baselineDesa.create({
        data: {
            ...parsed.data,
            createdById: session.user.id,
            kebijakan: { create: kebijakanRows(formData) },
            kelembagaan: { create: kelembagaanRows(formData) },
        },
    });

    revalidatePath("/desa");
    redirect("/desa");
}

// ---------- UPDATE ----------
export async function updateBaselineDesa(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const existing = await prisma.baselineDesa.findUnique({ where: { id } });
    if (!existing) throw new Error("Data tidak ditemukan");
    if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
        throw new Error("Forbidden");
    }

    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        console.error(parsed.error.flatten());
        throw new Error("Data tidak valid: " + parsed.error.issues[0].path.join("."));
    }

    if (parsed.data.desaKode !== existing.desaKode) {
        const dup = await prisma.baselineDesa.findUnique({
            where: { desaKode: parsed.data.desaKode },
        });
        if (dup) throw new Error("Baseline untuk desa tujuan sudah ada.");
    }

    await prisma.$transaction([
        prisma.kebijakanDesa.deleteMany({ where: { baselineId: id } }),
        prisma.kelembagaanDesa.deleteMany({ where: { baselineId: id } }),
        prisma.baselineDesa.update({
            where: { id },
            data: {
                ...parsed.data,
                kebijakan: { create: kebijakanRows(formData) },
                kelembagaan: { create: kelembagaanRows(formData) },
            },
        }),
    ]);

    revalidatePath("/desa");
    redirect("/desa");
}

// ---------- DELETE ----------
export async function deleteBaselineDesa(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const existing = await prisma.baselineDesa.findUnique({ where: { id } });
    if (!existing) throw new Error("Data tidak ditemukan");
    if (session.user.role !== "ADMIN" && existing.createdById !== session.user.id) {
        throw new Error("Forbidden");
    }

    // kebijakan & kelembagaan ikut terhapus otomatis (onDelete: Cascade di schema)
    await prisma.baselineDesa.delete({ where: { id } });

    revalidatePath("/desa");
    redirect("/desa"); // aman dipanggil dari daftar maupun detail
}