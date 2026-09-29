// lib/r2.ts
import { AwsClient } from "aws4fetch";

let cached: AwsClient | null = null;

export function getR2(): { client: AwsClient; endpoint: string; bucket: string } {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
        throw new Error(
            "Konfigurasi R2 belum lengkap. Isi R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME di .env"
        );
    }

    cached ??= new AwsClient({ accessKeyId, secretAccessKey });
    return { client: cached, endpoint: endpoint.replace(/\/$/, ""), bucket };
}