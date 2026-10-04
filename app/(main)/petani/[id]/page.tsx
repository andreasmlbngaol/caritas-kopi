// app/(main)/petani/[id]/page.tsx
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, FileText, Pencil } from "lucide-react";
import { pageWide } from "../../layout-cls";
import { getPetaniFull } from "../queries";
import { GAP_GROUPS, KONDISI_KEBUN, PRODUK, PASAR, TAHUN_PRODUKSI, TAHUN_ESTIMASI, SATUAN_PRODUKSI, STATUS_KEPEMILIKAN, SISTEM_BUDIDAYA, fmtBulanTahun } from "../constants";
import { DeleteButton } from "../delete-button";

const idNum = new Intl.NumberFormat("id-ID");
const fmt = (v: string | number | null | undefined) =>
    v == null || v === "" ? "-" : String(v);
const num = (v: number | null | undefined) => (v == null ? "-" : idNum.format(v));
const bool = (v: boolean | null | undefined) => (v == null ? "-" : v ? "Ya" : "Tidak");
const gap = (v: string | null | undefined) =>
    v == null ? "-" : v === "YA" ? "Ya" : v === "TIDAK" ? "Tidak" : "Kadang";
const fmtDate = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-5 text-sm font-semibold tracking-tight">{title}</h2>
            {children}
        </section>
    );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
            <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
        </div>
    );
}

function KVGrid({ items }: { items: [string, React.ReactNode][] }) {
    return (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map(([l, v]) => (
                <KV key={l} label={l} value={v} />
            ))}
        </dl>
    );
}

export default async function PetaniDetailPage({
                                                   params,
                                               }: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const p = await getPetaniFull(id);
    if (!p) notFound();
    if (session.user.role !== "ADMIN" && p.createdById !== session.user.id) notFound();

    const kec = p.desa.kecamatan;
    const kab = kec.kabupaten;

    const statusLabel = (v: string | null) =>
        STATUS_KEPEMILIKAN.find((s) => s.value === v)?.label ?? (v ?? "-");
    const sistemLabel = (v: string | null) =>
        SISTEM_BUDIDAYA.find((s) => s.value === v)?.label ?? (v ?? "-");
    const satuanLabel = (v: string | null) =>
        SATUAN_PRODUKSI.find((s) => s.value === v)?.label ?? (v ?? "-");
    const pestisidaLabel = (nama: string | null, blnThn: string | null) => {
        if (!nama && !blnThn) return "-";
        const parts = [nama, blnThn ? fmtBulanTahun(blnThn) : null].filter(Boolean);
        return parts.join(" - ");
    };

    return (
        <main className={pageWide}>
            <header className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/petani" aria-label="Kembali ke daftar" className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">{p.namaLengkap}</h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {p.kodePetani ?? "Tanpa kode"} | {p.desa.nama}, Kec. {kec.nama}, {kab.nama}, {kab.provinsi.nama}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <a
                    href={`/petani/${p.id}/export/pdf`}
                    title="Unduh PDF"
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                    >
                    <FileDown size={16} />
                </a>
                    <a
                    href={`/petani/${p.id}/export/docx`}
                    title="Unduh Word"
                    className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                    >
                    <FileText size={16} />
                </a>
                <Link
                        href={`/petani/${p.id}/edit`} title="Edit"
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white hover:text-jade-800 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5"
                    >
                        <Pencil size={16} />
                    </Link>
                    <DeleteButton id={p.id} nama={p.namaLengkap} />
                </div>
            </header>

            <div className="mt-8 space-y-6">
                {/* A */}
                <Card title="A - Data Identitas Petani">
                    <KVGrid items={[
                        ["Nama Lengkap", p.namaLengkap],
                        ["Nama Panggilan", fmt(p.namaPanggilan)],
                        ["Jenis Kelamin", p.jenisKelamin === "L" ? "Laki-laki" : p.jenisKelamin === "P" ? "Perempuan" : "-"],
                        ["Tanggal Lahir", fmtDate(p.tanggalLahir)],
                        ["Nomor Telepon / HP", fmt(p.telepon)],
                        ["Tanggal Pendaftaran", fmtDate(p.tanggalPendaftaran)],
                        ["Nama Petugas Pendaftar", fmt(p.namaPetugasPendaftar)],
                        ["Alamat Domisili", fmt(p.alamatDomisili)],
                        ["Kelompok Tani", p.kelompokTani ? `${p.kelompokTani.nama}${p.kelompokTani.kode ? ` (${p.kelompokTani.kode})` : ""}` : "-"],
                        ["Kontak Darurat", fmt(p.kontakDaruratNama)],
                        ["No. HP Kontak Darurat", fmt(p.kontakDaruratTelepon)],
                        ["Hubungan Kontak Darurat", fmt(p.kontakDaruratHubungan)],
                        ["Diinput oleh", p.createdBy.fullName ?? p.createdBy.username],
                        ["Tanggal Input", fmtDate(p.createdAt)],
                    ]} />
                </Card>

                {/* B */}
                <Card title="B - Data Fisik Lokasi Plot">
                    {p.plot.length === 0 ? (
                        <p className="text-sm text-gray-500">Belum ada data plot.</p>
                    ) : (
                        <div className="space-y-6">
                            {p.plot.map((pl) => (
                                <div key={pl.id} className="rounded-xl bg-gray-50/60 p-5 ring-1 ring-inset ring-gray-200">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Plot {pl.nomor}
                                        </h3>
                                        {pl.fotoKey && (
                                            <a href={`/api/foto/${pl.fotoKey}`} target="_blank" rel="noreferrer">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={`/api/foto/${pl.fotoKey}`}
                                                    alt={`Foto plot ${pl.nomor}`}
                                                    className="h-20 w-20 rounded-lg object-cover ring-1 ring-gray-200"
                                                />
                                            </a>
                                        )}
                                    </div>
                                    <div className="mt-3">
                                        <KVGrid items={[
                                            ["Nama / Hamparan", fmt(pl.namaHamparan)],
                                            ["Varietas", fmt(pl.varietas)],
                                            ["Tahun Tanam", num(pl.tahunTanam)],
                                            ["Kode GPS", fmt(pl.kodeGps)],
                                            ["Elevasi (mdpl)", num(pl.elevasiMdpl)],
                                            ["Kemiringan (%)", num(pl.kemiringanPersen)],
                                            ["Luas Kopi (Ha)", num(pl.luasKopiHa)],
                                            ["Status Kepemilikan", statusLabel(pl.statusKepemilikan)],
                                            ["Sistem Budidaya", sistemLabel(pl.sistemBudidaya)],
                                            ["Area Konservasi", fmt(pl.areaKonservasi)],
                                            ["Tanaman Baru", num(pl.tanamanBaru)],
                                            ["Pohon Produktif", num(pl.pohonProduktif)],
                                            ["Pohon Tidak Produktif", num(pl.pohonTidakProduktif)],
                                            ["Pestisida Terakhir", pestisidaLabel(pl.pestisidaNama, pl.pestisidaBulanTahun)],
                                            ["Koordinat Foto", pl.fotoLatitude != null && pl.fotoLongitude != null ? `${pl.fotoLatitude}, ${pl.fotoLongitude}` : "-"],
                                        ]} />
                                    </div>
                                    {pl.naungan.length > 0 && (
                                        <div className="mt-4 overflow-x-auto">
                                            <table className="w-full min-w-[640px] text-sm">
                                                <thead>
                                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                                    <th className="py-1.5 pr-3">Jenis Naungan/Sela/Tegakan</th>
                                                    <th className="py-1.5 pr-3">Jumlah</th>
                                                    <th className="py-1.5 pr-3">Fungsi</th>
                                                    <th className="py-1.5 pr-3">Pemangkasan</th>
                                                    <th className="py-1.5 pr-3">Produksi/Tahun</th>
                                                    <th className="py-1.5">Tahun Tanam</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                {pl.naungan.map((n) => (
                                                    <tr key={n.id}>
                                                        <td className="py-1.5 pr-3">{fmt(n.jenis)}</td>
                                                        <td className="py-1.5 pr-3">{num(n.jumlah)}</td>
                                                        <td className="py-1.5 pr-3">{fmt(n.fungsi)}</td>
                                                        <td className="py-1.5 pr-3">{bool(n.pemangkasan)}</td>
                                                        <td className="py-1.5 pr-3">{fmt(n.produksiPerTahun)}</td>
                                                        <td className="py-1.5">{num(n.tahunTanam)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* C */}
                <Card title="C - Praktik GAP Kebun">
                    <div className="space-y-6">
                        {GAP_GROUPS.map((g) => (
                            <div key={g.kelompok}>
                                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    {g.kelompok}
                                </h3>
                                <div className="divide-y divide-gray-100">
                                    {g.items.map((item) => {
                                        const row = p.praktikGap.find((x) => x.jenis === item.jenis);
                                        return (
                                            <div key={item.jenis} className="grid grid-cols-[1fr_80px_1fr] items-center gap-3 py-2 text-sm">
                                                <span className="text-gray-700">{item.label}</span>
                                                <span className="font-medium text-gray-900">{gap(row?.jawaban)}</span>
                                                <span className="text-gray-500">{fmt(row?.keterangan)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* D */}
                <Card title="D - Riwayat Estimasi Produksi">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead>
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                <th className="py-2 pr-3">Tahun</th>
                                <th className="py-2 pr-3">Satuan</th>
                                <th className="py-2 pr-3">Cherry</th>
                                <th className="py-2 pr-3">Gabah Basah / Labu</th>
                                <th className="py-2 pr-3">Gabah Kering</th>
                                <th className="py-2 pr-3">Green Bean</th>
                                <th className="py-2">Produktivitas</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {TAHUN_PRODUKSI.map((tahun) => {
                                const r = p.produksi.find((x) => x.tahun === tahun);
                                return (
                                    <tr key={tahun}>
                                        <td className="py-2 pr-3 font-medium text-gray-900">
                                            {tahun}{tahun === TAHUN_ESTIMASI ? " (estimasi)" : ""}
                                        </td>
                                        <td className="py-2 pr-3 text-gray-500">{satuanLabel(r?.satuan ?? null)}</td>
                                        <td className="py-2 pr-3">{num(r?.cherry)}</td>
                                        <td className="py-2 pr-3">{num(r?.gabahBasah)}</td>
                                        <td className="py-2 pr-3">{num(r?.gabahKering)}</td>
                                        <td className="py-2 pr-3">{num(r?.greenBean)}</td>
                                        <td className="py-2">{num(r?.produktivitas)}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* E */}
                <Card title="E - Penjualan">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div>
                            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                E.1 - Jenis Produk yang Dijual
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {p.produk.map((r) => (
                                    <div key={r.id} className="grid grid-cols-[1fr_60px_1fr] items-center gap-3 py-2 text-sm">
                                        <span className="text-gray-700">
                                            {r.jenis === "LAINNYA" ? fmt(r.labelCustom) : PRODUK.find((x) => x.jenis === r.jenis)?.label}
                                        </span>
                                        <span className="font-medium text-gray-900">{bool(r.dijual)}</span>
                                        <span className="text-gray-500">{r.dijual ? `${num(r.volumeKgTahun)} kg/tahun` : ""}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                E.2 - Kategori Pasar
                            </h3>
                            <div className="divide-y divide-gray-100">
                                {p.pasar.map((r) => (
                                    <div key={r.id} className="grid grid-cols-[1fr_60px_1fr] items-center gap-3 py-2 text-sm">
                                        <span className="text-gray-700">
                                            {r.kategori === "LAINNYA" ? fmt(r.labelCustom) : PASAR.find((x) => x.kategori === r.kategori)?.label}
                                        </span>
                                        <span className="font-medium text-gray-900">{bool(r.aktif)}</span>
                                        <span className="text-gray-500">
                                            {r.aktif ? `${num(r.persentase)}% · ${fmt(r.profilPenjual)}` : ""}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* F */}
                <Card title="F - Kondisi Kebun">
                    <div className="divide-y divide-gray-100">
                        {KONDISI_KEBUN.map((k) => {
                            const row = p.kondisiKebun.find((x) => x.jenis === k.jenis);
                            return (
                                <div key={k.jenis} className="grid grid-cols-[1fr_80px_1fr] items-center gap-3 py-2 text-sm">
                                    <span className="text-gray-700">{k.label}</span>
                                    <span className="font-medium text-gray-900">{bool(row?.jawaban)}</span>
                                    <span className="text-gray-500">{row?.jawaban ? fmt(row.keterangan) : ""}</span>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </main>
    );
}