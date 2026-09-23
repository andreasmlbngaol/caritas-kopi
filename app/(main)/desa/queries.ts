// app/(main)/desa/queries.ts
import { prisma } from "@/lib/prisma";

export async function getBaselineDesa(id: string) {
    return prisma.baselineDesa.findUnique({
        where: { id },
        include: { kebijakan: true, kelembagaan: true },
    });
}

export async function getBaselineDesaFull(id: string) {
    return prisma.baselineDesa.findUnique({
        where: { id },
        include: {
            kebijakan: true,
            kelembagaan: true,
            createdBy: { select: { fullName: true, username: true } },
            wilayah: {
                include: {
                    kecamatan: { include: { kabupaten: { include: { provinsi: true } } } },
                },
            },
        },
    });
}