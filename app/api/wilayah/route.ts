import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parent = req.nextUrl.searchParams.get("parent");

    if (!parent) {
        const data = await prisma.wilayahProvinsi.findMany({ orderBy: { nama: "asc" } });
        return NextResponse.json(data);
    }

    const depth = parent.split(".").length;
    if (depth === 1) {
        const data = await prisma.wilayahKabupaten.findMany({
            where: { provinsiKode: parent }, orderBy: { nama: "asc" },
        });
        return NextResponse.json(data);
    }
    if (depth === 2) {
        const data = await prisma.wilayahKecamatan.findMany({
            where: { kabupatenKode: parent }, orderBy: { nama: "asc" },
        });
        return NextResponse.json(data);
    }
    const data = await prisma.wilayahDesa.findMany({
        where: { kecamatanKode: parent }, orderBy: { nama: "asc" },
    });
    return NextResponse.json(data);
}