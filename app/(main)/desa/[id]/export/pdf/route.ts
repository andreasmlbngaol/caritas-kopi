// app/(main)/desa/[id]/export/pdf/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/auth";
import { getBaselineDesaFull } from "@/app/(main)/desa/queries";
import { buildDesaExportModel } from "@/app/(main)/desa/export-model";
import { DesaPdf } from "./pdf-document";

export const runtime = "nodejs";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const b = await getBaselineDesaFull(id);
    if (!b) return new Response("Not found", { status: 404 });
    if (session.user.role !== "ADMIN" && b.createdById !== session.user.id) {
        return new Response("Not found", { status: 404 });
    }

    const model = buildDesaExportModel(b);
    const buf = await renderToBuffer(DesaPdf({ m: model }));

    return new Response(new Uint8Array(buf), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${model.fileName}.pdf"`,
        },
    });
}