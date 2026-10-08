// app/(main)/petani/queries.ts
import { prisma } from "@/lib/prisma";

export async function getPetani(id: string) {
    return prisma.petani.findUnique({
        where: { id },
        include: {
            plot: { orderBy: { nomor: "asc" } },
            naungan: true,
            praktikGap: true,
            produksi: true,
            produk: true,
            pasar: true,
            kondisiKebun: true,
            kelompokTani: true,
        },
    });
}

export async function getPetaniFull(id: string) {
    return prisma.petani.findUnique({
        where: { id },
        include: {
            plot: { orderBy: { nomor: "asc" } },
            naungan: true,
            praktikGap: true,
            produksi: true,
            produk: true,
            pasar: true,
            kondisiKebun: true,
            kelompokTani: true,
            createdBy: { select: { fullName: true, username: true } },
            desa: {
                include: {
                    kecamatan: { include: { kabupaten: { include: { provinsi: true } } } },
                },
            },
        },
    });
}