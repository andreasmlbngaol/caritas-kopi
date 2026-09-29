// app/api/kelompok-tani/route.ts
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const desa = new URL(req.url).searchParams.get("desa");
    if (!desa) return Response.json({ error: "Parameter desa wajib" }, { status: 400 });

    const rows = await prisma.kelompokTani.findMany({
        where: { desaKode: desa },
        orderBy: { nama: "asc" },
        select: { id: true, nama: true, kode: true },
    });

    return Response.json(rows);
}