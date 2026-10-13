// app/(main)/petani/export/route.ts
// Export banyak petani sekaligus: render 1 PDF per petani (memakai dokumen &
// model yang sudah ada) lalu bungkus jadi satu file ZIP.
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPetaniFull } from "@/app/(main)/petani/queries";
import { buildPetaniExportModel } from "@/app/(main)/petani/export-model";
import { PetaniPdf } from "@/app/(main)/petani/[id]/export/pdf/pdf-document";
import { zipStore, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";
// ponytail: batas atas agar 1 request tak menarik seluruh DB ke memori.
const MAX = 1000;

function safeName(s: string): string {
    return s.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "petani";
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const isAdmin = session.user.role === "ADMIN";
    const body = (await req.json().catch(() => ({}))) as { ids?: string[] };

    const wanted = Array.isArray(body.ids) ? body.ids : [];
    if (wanted.length === 0) return new Response("Tidak ada data dipilih", { status: 400 });
    if (wanted.length > MAX) {
        return new Response(`Terlalu banyak data (maks ${MAX}). Persempit pilihan.`, { status: 400 });
    }

    // Scope: admin tanpa filter, enumerator hanya data miliknya.
    const scope = isAdmin ? {} : { createdById: session.user.id };
    const allowed = await prisma.petani.findMany({
        where: { id: { in: wanted }, ...scope },
        select: { id: true },
    });
    const allowedSet = new Set(allowed.map((a) => a.id));
    const ids = wanted.filter((id) => allowedSet.has(id));
    if (ids.length === 0) return new Response("Tidak ada data", { status: 404 });

    const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
    const entries: ZipEntry[] = [];
    const used = new Map<string, number>();

    for (const id of ids) {
        const p = await getPetaniFull(id);
        if (!p) continue;
        const model = buildPetaniExportModel(p, appUrl);
        const buf = await renderToBuffer(PetaniPdf({ m: model }));

        const base = safeName(model.fileName);
        const n = used.get(base) ?? 0;
        used.set(base, n + 1);
        const name = n === 0 ? `${base}.pdf` : `${base} (${n + 1}).pdf`;
        entries.push({ name, data: new Uint8Array(buf) });
    }

    if (entries.length === 0) return new Response("Tidak ada data", { status: 404 });

    const zip = zipStore(entries);
    const out = new Uint8Array(zip);
    return new Response(out, {
        headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="Data Petani.zip"`,
        },
    });
}
