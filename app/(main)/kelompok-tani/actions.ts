// app/(main)/kelompok-tani/actions.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ActionState } from "../_components/action-form";

function get(formData: FormData, key: string) {
    const v = formData.get(key);
    if (v === null) return undefined;
    const s = String(v).trim();
    return s === "" ? undefined : s;
}

function parseForm(formData: FormData) {
    const desaKode = get(formData, "desaKode");
    if (!desaKode) throw new Error("Desa wajib dipilih.");
    const nama = get(formData, "nama");
    if (!nama) throw new Error("Nama kelompok wajib diisi.");

    const k1 = get(formData, "kode1");
    const k2 = get(formData, "kode2");
    let kode: string | null = null;
    if (k1 || k2) {
        if (!k1 || !k2) throw new Error("Kode kelompok belum lengkap (2 bagian).");
        kode = `${k1}-${k2}`.toUpperCase();
    }
    return { desaKode, nama, kode };
}

// ---------- CREATE ----------
export async function createKelompokTani(
    prev: ActionState,
    formData: FormData
): Promise<ActionState> {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    let data;
    try {
        data = parseForm(formData);
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Data tidak valid" };
    }

    if (data.kode) {
        const dup = await prisma.kelompokTani.findUnique({
            where: { desaKode_kode: { desaKode: data.desaKode, kode: data.kode } },
        });
        if (dup) return { error: `Kode ${data.kode} sudah dipakai di desa ini.` };
    }

    await prisma.kelompokTani.create({ data });

    revalidatePath("/kelompok-tani");
    redirect("/kelompok-tani");
}

// ---------- UPDATE ----------
export async function updateKelompokTani(
    id: string,
    prev: ActionState,
    formData: FormData
): Promise<ActionState> {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const existing = await prisma.kelompokTani.findUnique({ where: { id } });
    if (!existing) return { error: "Data tidak ditemukan" };

    let data;
    try {
        data = parseForm(formData);
    } catch (e) {
        return { error: e instanceof Error ? e.message : "Data tidak valid" };
    }

    if (data.kode && (data.kode !== existing.kode || data.desaKode !== existing.desaKode)) {
        const dup = await prisma.kelompokTani.findUnique({
            where: { desaKode_kode: { desaKode: data.desaKode, kode: data.kode } },
        });
        if (dup) return { error: `Kode ${data.kode} sudah dipakai di desa ini.` };
    }

    await prisma.kelompokTani.update({ where: { id }, data });

    revalidatePath("/kelompok-tani");
    redirect("/kelompok-tani");
}

// ---------- DELETE ----------
// Tidak redirect - DeleteButton me-refresh halaman. Kembalikan { error } bila
// masih dipakai (pesan throw disensor Next.js di produksi).
export async function deleteKelompokTani(id: string) {
    const session = await auth();
    if (!session?.user) return { error: "Unauthorized" };

    const kt = await prisma.kelompokTani.findUnique({
        where: { id },
        include: { _count: { select: { petani: true } } },
    });
    if (!kt) return { error: "Data tidak ditemukan" };
    if (kt._count.petani > 0) {
        return {
            error: `Kelompok ini masih dipakai oleh ${kt._count.petani} petani. Lepaskan dulu petani-petaninya dari kelompok ini (lewat edit petani).`,
        };
    }

    await prisma.kelompokTani.delete({ where: { id } });
    revalidatePath("/kelompok-tani");
}