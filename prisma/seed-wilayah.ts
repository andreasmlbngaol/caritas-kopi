import "dotenv/config";
import { readFileSync } from "fs";
import { PrismaClient } from "@/app/generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function parseWilayahSql(filePath: string) {
    const sql = readFileSync(filePath, "utf-8");
    const regex = /\('((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)'\)/g;
    const rows: { kode: string; nama: string }[] = [];
    let match;
    while ((match = regex.exec(sql)) !== null) {
        rows.push({ kode: match[1], nama: match[2].replace(/\\'/g, "'") });
    }
    return rows;
}

function chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
}

async function main() {
    const rows = parseWilayahSql("prisma/data/wilayah.sql");
    console.log(`Total baris ditemukan: ${rows.length}`);

    const provinsi: { kode: string; nama: string }[] = [];
    const kabupatenRaw: { kode: string; nama: string; provinsiKode: string }[] = [];
    const kecamatanRaw: { kode: string; nama: string; kabupatenKode: string }[] = [];
    const desaRaw: { kode: string; nama: string; kecamatanKode: string }[] = [];

    for (const { kode, nama } of rows) {
        const parts = kode.split(".");
        if (parts.length === 1) provinsi.push({ kode, nama });
        else if (parts.length === 2) kabupatenRaw.push({ kode, nama, provinsiKode: parts[0] });
        else if (parts.length === 3) kecamatanRaw.push({ kode, nama, kabupatenKode: parts.slice(0, 2).join(".") });
        else if (parts.length === 4) desaRaw.push({ kode, nama, kecamatanKode: parts.slice(0, 3).join(".") });
    }

    // Filter: buang baris yang kode induknya nggak ketemu di level atasnya
    const provinsiCodes = new Set(provinsi.map((p) => p.kode));
    const kabupaten = kabupatenRaw.filter((k) => provinsiCodes.has(k.provinsiKode));

    const kabupatenCodes = new Set(kabupaten.map((k) => k.kode));
    const kecamatan = kecamatanRaw.filter((k) => kabupatenCodes.has(k.kabupatenKode));

    const kecamatanCodes = new Set(kecamatan.map((k) => k.kode));
    const desa = desaRaw.filter((d) => kecamatanCodes.has(d.kecamatanKode));

    const skippedKab = kabupatenRaw.length - kabupaten.length;
    const skippedKec = kecamatanRaw.length - kecamatan.length;
    const skippedDesa = desaRaw.length - desa.length;

    console.log({ provinsi: provinsi.length, kabupaten: kabupaten.length, kecamatan: kecamatan.length, desa: desa.length });
    if (skippedKab || skippedKec || skippedDesa) {
        console.warn(`Dilewati (kode induk nggak ketemu) -> kabupaten: ${skippedKab}, kecamatan: ${skippedKec}, desa: ${skippedDesa}`);
        console.warn("Contoh desa yang dilewati:", desaRaw.filter((d) => !kecamatanCodes.has(d.kecamatanKode)).slice(0, 5));
    }

    console.log("Import provinsi...");
    for (const batch of chunk(provinsi, 500)) {
        await prisma.wilayahProvinsi.createMany({ data: batch, skipDuplicates: true });
    }

    console.log("Import kabupaten...");
    for (const batch of chunk(kabupaten, 500)) {
        await prisma.wilayahKabupaten.createMany({ data: batch, skipDuplicates: true });
    }

    console.log("Import kecamatan...");
    for (const batch of chunk(kecamatan, 1000)) {
        await prisma.wilayahKecamatan.createMany({ data: batch, skipDuplicates: true });
    }

    console.log("Import desa...");
    for (const batch of chunk(desa, 1000)) {
        await prisma.wilayahDesa.createMany({ data: batch, skipDuplicates: true });
    }

    console.log("Selesai!");
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());