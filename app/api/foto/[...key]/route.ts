// app/api/foto/[...key]/route.ts
import { auth } from "@/auth";
import { getR2 } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ key: string[] }> }
) {
    const session = await auth();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const { key } = await params;
    const objectKey = key.join("/");
    // Tolak path traversal & key di luar prefix petani
    if (objectKey.includes("..") || !objectKey.startsWith("petani/")) {
        return new Response("Not found", { status: 404 });
    }

    try {
        const { client, endpoint, bucket } = getR2();
        const res = await client.fetch(`${endpoint}/${bucket}/${objectKey}`);
        if (!res.ok || !res.body) return new Response("Not found", { status: 404 });

        return new Response(res.body, {
            headers: {
                "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
                "Cache-Control": "private, max-age=3600",
            },
        });
    } catch (e) {
        console.error(e);
        return new Response("Storage error", { status: 502 });
    }
}