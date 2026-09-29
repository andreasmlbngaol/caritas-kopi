// app/(main)/petani/[id]/export/docx/route.ts
import { auth } from "@/auth";
import { getPetaniFull } from "@/app/(main)/petani/queries";
import { buildPetaniExportModel } from "@/app/(main)/petani/export-model";
import { buildPetaniDocx } from "./builder";

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const p = await getPetaniFull(id);
    if (!p) return new Response("Not found", { status: 404 });
    if (session.user.role !== "ADMIN" && p.createdById !== session.user.id) {
        return new Response("Not found", { status: 404 });
    }

    const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
    const model = buildPetaniExportModel(p, appUrl);
    const buf = await buildPetaniDocx(model);

    return new Response(new Uint8Array(buf), {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="${model.fileName}.docx"`,
        },
    });
}