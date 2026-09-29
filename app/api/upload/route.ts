// app/api/upload/route.ts
import { auth } from "@/auth";
import { getR2 } from "@/lib/r2";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB (file asli)
const ALLOWED: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif",
};

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    let file: File | null = null;
    try {
        const fd = await req.formData();
        file = fd.get("file") as File | null;
    } catch {
        return Response.json({ error: "Body tidak valid" }, { status: 400 });
    }
    if (!file) return Response.json({ error: "Tidak ada file" }, { status: 400 });

    const allowedExt = ALLOWED[file.type];
    if (!allowedExt) {
        return Response.json({ error: "Format harus JPG, PNG, WEBP, atau HEIC" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
        return Response.json({ error: "Ukuran foto maksimal 10 MB" }, { status: 400 });
    }

    let buf: Buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;
    let ext = allowedExt;

    // Kecilkan ukuran: rotate sesuai EXIF → resize maks 1920px → WebP q80.
    // HEIC/HEIF tidak bisa diproses sharp → disimpan apa adanya.
    try {
        buf = await sharp(buf)
            .rotate()
            .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 90 })
            .toBuffer();
        contentType = "image/webp";
        ext = "webp";
    } catch {
        // bukan format yang bisa dikonversi — lanjut pakai file asli
    }

    const key = `petani/${crypto.randomUUID()}.${ext}`;

    try {
        const { client, endpoint, bucket } = getR2();
        const res = await client.fetch(`${endpoint}/${bucket}/${key}`, {
            method: "PUT",
            body: new Uint8Array(buf),
            headers: {
                "Content-Type": contentType,
                "Content-Length": String(buf.length),
            },
        });
        if (!res.ok) {
            console.error("R2 upload gagal:", res.status, await res.text());
            return Response.json({ error: "Upload ke storage gagal" }, { status: 502 });
        }
    } catch (e) {
        console.error(e);
        return Response.json(
            { error: e instanceof Error ? e.message : "Upload gagal" },
            { status: 500 }
        );
    }

    return Response.json({ key });
}