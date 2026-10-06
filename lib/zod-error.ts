// lib/zod-error.ts
// Ubah ZodError jadi pesan Indonesia yang menyebut kolom + alasannya,
// supaya pengguna tidak cuma dapat "Data tidak valid".
import { z } from "zod";

// Fallback pesan zod dalam bahasa Indonesia (dipakai bila customError di bawah
// tidak menangani kode issue tertentu).
z.config(z.locales.id());

// Nama kolom yang ramah dibaca. Field yang tidak terdaftar di-prettify otomatis
// (camelCase -> "Camel Case").
const FIELD_LABELS: Record<string, string> = {
    // Identitas petani
    desaKode: "Desa",
    namaLengkap: "Nama Lengkap",
    namaPanggilan: "Nama Panggilan",
    jenisKelamin: "Jenis Kelamin",
    tanggalLahir: "Tanggal Lahir",
    alamatDomisili: "Alamat Domisili",
    telepon: "Nomor Telepon",
    tanggalPendaftaran: "Tanggal Pendaftaran",
    namaPetugasPendaftar: "Nama Petugas Pendaftar",
    kontakDaruratNama: "Nama Kontak Darurat",
    kontakDaruratTelepon: "No. Telepon Kontak Darurat",
    kontakDaruratHubungan: "Hubungan Kontak Darurat",
    // Plot
    namaHamparan: "Nama / Hamparan",
    tahunTanam: "Tahun Tanam",
    kodeGps: "Kode GPS",
    elevasiMdpl: "Elevasi (mdpl)",
    kemiringanPersen: "Kemiringan (%)",
    luasKopiHa: "Luas Kopi (Ha)",
    fotoKey: "Foto Geotagged",
    fotoLatitude: "Koordinat Foto - Latitude",
    fotoLongitude: "Koordinat Foto - Longitude",
    statusKepemilikan: "Status Kepemilikan Lahan",
    sistemBudidaya: "Sistem Budidaya",
    areaKonservasi: "Area Konservasi di Lahan",
    tanamanBaru: "Jumlah Tanaman Baru",
    pohonProduktif: "Jumlah Pohon Produktif",
    pohonTidakProduktif: "Jumlah Pohon Tidak Produktif",
    pestisidaNama: "Jenis Pestisida Terakhir",
    pestisidaBulanTahun: "Bulan & Tahun Pestisida Terakhir",
    // Naungan
    jenis: "Jenis",
    jumlah: "Jumlah",
    fungsi: "Fungsi",
    pemangkasan: "Pemangkasan",
    produksiPerTahun: "Produksi / Tahun",
    // Baseline desa
    tahunPendataan: "Tahun Pendataan",
    sumberData: "Sumber Data",
    luasWilayahHa: "Luas Wilayah (Ha)",
    jumlahPenduduk: "Jumlah Penduduk",
    jumlahKK: "Jumlah KK",
    jumlahPetaniKopi: "Jumlah Petani Kopi",
    luasArealKopiHa: "Luas Areal Kopi (Ha)",
    luasKomoditiLainHa: "Luas Area Komoditi Lainnya (Ha)",
    latitude: "Latitude",
    longitude: "Longitude",
    topografi: "Topografi",
    ketinggianMdpl: "Ketinggian (mdpl)",
    bulanHujan: "Bulan Hujan",
    bulanKering: "Bulan Kering",
    suhuRataRataC: "Suhu Rata-rata",
    jenisTanah: "Jenis Tanah",
    aksesJalan: "Akses Jalan",
    jarakIbukotaKecamatanKm: "Jarak ke Ibu Kota Kecamatan (km)",
    jarakPasarKm: "Jarak ke Pasar (km)",
    jarakKonservasiKm: "Jarak ke Kawasan Konservasi (km)",
    luasAPLHa: "Luas Lahan APL (Ha)",
    namaKawasanKonservasi: "Nama Kawasan Konservasi",
    produktivitasKgHaTahun: "Produktivitas (kg/Ha/tahun)",
    hargaCherryRp: "Harga Cherry (Rp)",
    hargaGreenBeanRpKg: "Harga Green Bean (Rp/kg)",
    pembeliUtama: "Pembeli Utama",
    jumlahPedagangPengumpul: "Jumlah Pedagang Pengumpul",
    koperasiAktifUnit: "Koperasi Aktif",
    eksportir: "Eksportir",
    industriPengolahan: "Industri Pengolahan",
    permasalahanUtama: "Permasalahan Utama",
    berbatasanKonservasi: "Berbatasan dengan Kawasan Konservasi",
    luasPenyanggaHa: "Luas Kawasan Penyangga (Ha)",
    tutupanHutan: "Tutupan Hutan",
    tutupanHutanSatuan: "Satuan Tutupan Hutan",
    tutupanAgroforestry: "Tutupan Agroforestry",
    tutupanAgroforestrySatuan: "Satuan Tutupan Agroforestry",
    rawanLongsor: "Daerah Rawan Longsor",
    lokasiRawanLongsor: "Lokasi Rawan Longsor",
    rawanErosi: "Daerah Rawan Erosi",
    lokasiRawanErosi: "Lokasi Rawan Erosi",
    konflikSatwa: "Konflik Satwa",
    jenisSatwaKonflik: "Jenis Satwa Konflik",
    praktikKonservasi: "Praktik Konservasi",
};

function prettify(key: string): string {
    const s = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function labelFor(key: string): string {
    return FIELD_LABELS[key] ?? prettify(key);
}

// Alasan singkat & ramah untuk tiap kode issue zod.
function friendlyReason(issue: z.core.$ZodIssue): string | undefined {
    const i = issue as unknown as Record<string, unknown>;
    switch (issue.code) {
        case "invalid_type": {
            const expected = i.expected as string | undefined;
            const received = i.received as string | undefined;
            if (expected === "number" || received === "NaN") return "harus berupa angka";
            if (expected === "int") return "harus bilangan bulat";
            if (expected === "date") return "format tanggal tidak dikenali";
            if (expected === "boolean") return "harus berupa Ya/Tidak";
            if (expected === "string") return "wajib diisi";
            return expected ? `harus berupa ${expected}` : undefined;
        }
        case "too_small": {
            if (i.origin === "string") return "wajib diisi";
            return `minimal ${i.minimum}`;
        }
        case "too_big":
            return `maksimal ${i.maximum}`;
        case "invalid_value":
            return `harus salah satu dari: ${((i.values as string[]) ?? []).join(", ")}`;
        case "invalid_format":
            return "format tidak sesuai";
        default:
            return undefined;
    }
}

/**
 * Ubah ZodError jadi kalimat yang menyebut tiap kolom bermasalah.
 * `prefix` opsional, mis. "Plot 2" atau "Naungan Plot 1 baris 3".
 */
export function formatZodError(error: z.ZodError, prefix?: string): string {
    const parts: string[] = [];
    for (const issue of error.issues) {
        const key = String(issue.path[issue.path.length - 1] ?? "");
        const label = key ? labelFor(key) : "Data";
        const reason = friendlyReason(issue) ?? issue.message;
        parts.push(`${label}: ${reason}`);
    }
    const body = parts.length ? parts.join("; ") : "Data tidak valid";
    return prefix ? `${prefix} - ${body}` : body;
}
