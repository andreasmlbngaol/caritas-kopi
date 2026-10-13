// lib/zip.ts
// Penulis ZIP minimal (metode "store", tanpa kompresi) memakai crc32 dari
// node:zlib. Dipakai untuk membungkus beberapa PDF jadi satu unduhan.
// ponytail: store-only - PDF sudah terkompresi sendiri, deflate tak sepadan
// dengan kodenya. Tambah deflate hanya kalau suatu saat isinya teks mentah.
import { crc32 } from "node:zlib";

export type ZipEntry = { name: string; data: Uint8Array };

function concat(parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of parts) {
        out.set(p, o);
        o += p.length;
    }
    return out;
}

export function zipStore(entries: ZipEntry[]): Uint8Array {
    const enc = new TextEncoder();
    const localParts: Uint8Array[] = [];
    const centralParts: Uint8Array[] = [];
    let offset = 0;

    for (const e of entries) {
        const name = enc.encode(e.name);
        const crc = crc32(e.data) >>> 0;
        const size = e.data.length;

        // Local file header (30 byte + nama)
        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0, true);
        lv.setUint16(8, 0, true); // method: store
        lv.setUint16(10, 0, true);
        lv.setUint16(12, 0, true);
        lv.setUint32(14, crc, true);
        lv.setUint32(18, size, true);
        lv.setUint32(22, size, true);
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true);
        local.set(name, 30);
        localParts.push(local, e.data);

        // Central directory header (46 byte + nama)
        const central = new Uint8Array(46 + name.length);
        const cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        cv.setUint16(6, 20, true);
        cv.setUint16(8, 0, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, name.length, true);
        cv.setUint16(30, 0, true);
        cv.setUint16(32, 0, true);
        cv.setUint16(34, 0, true);
        cv.setUint16(36, 0, true);
        cv.setUint32(38, 0, true);
        cv.setUint32(42, offset, true);
        central.set(name, 46);
        centralParts.push(central);

        offset += local.length + size;
    }

    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);

    // End of central directory (22 byte)
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    return concat([...localParts, ...centralParts, end]);
}
