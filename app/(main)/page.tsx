// app/(main)/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    Plus, MapPin, ArrowUpRight, UserRound, UserRoundGroup,
    Sprout, TrendingUp, ShoppingCart, Trees, PieChart, Leaf,
} from "lucide-react";
import { pageWide } from "./layout-cls";
import { getRingkasan } from "./analitik/queries";
import { StatTile, fmt } from "./analitik/_components/analytics-ui";
import { LineChartX } from "./analitik/_components/charts";

const idNum = new Intl.NumberFormat("id-ID");

const KATEGORI = [
    { href: "/analitik/gap", label: "GAP", desc: "Adopsi 21 praktik budidaya", icon: Sprout },
    { href: "/analitik/agronomi", label: "Agronomi Plot", desc: "Varietas, naungan, umur tanaman", icon: Leaf },
    { href: "/analitik/produksi", label: "Produksi", desc: "Volume & produktivitas per tahun", icon: TrendingUp },
    { href: "/analitik/pasar", label: "Pasar & Produk", desc: "Jenis produk & kategori pasar", icon: ShoppingCart },
    { href: "/analitik/konservasi", label: "Konservasi", desc: "Kondisi kebun & lingkungan", icon: Trees },
    { href: "/analitik/wilayah", label: "Wilayah & Kelembagaan", desc: "Demografi & kelembagaan desa", icon: PieChart },
    { href: "/analitik/peta", label: "Peta Sebaran", desc: "Lokasi desa & plot petani", icon: MapPin },
];

export default async function HomePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "ADMIN";

    // ============ ENUMERATOR: dashboard input (tidak berubah) ============
    if (!isAdmin) {
        const scope = { createdById: session.user.id };
        const [jumlahPetani, jumlahDesa, jumlahKelompok] = await Promise.all([
            prisma.petani.count({ where: scope }),
            prisma.baselineDesa.count({ where: scope }),
            prisma.kelompokTani.count({ where: { petani: { some: { createdById: session.user.id } } } }),
        ]);

        const stats = [
            { label: "Jumlah Data Petani", value: jumlahPetani, icon: UserRound, href: "/petani" },
            { label: "Jumlah Data Desa", value: jumlahDesa, icon: MapPin, href: "/desa" },
            { label: "Jumlah Kelompok Tani", value: jumlahKelompok, icon: UserRoundGroup, href: "/kelompok-tani" },
        ];

        return (
            <main className={pageWide}>
                <header>
                    <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Selamat datang, {session.user.name ?? "Pengguna"} - ringkasan data yang Anda inputkan.
                    </p>
                </header>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link href="/petani/baru"
                        className="group flex items-center justify-between rounded-2xl bg-jade-800 p-6 text-white shadow-sm transition-colors hover:bg-jade-900">
                        <div>
                            <p className="text-base font-semibold">Input Data Petani</p>
                            <p className="mt-1 text-sm text-jade-100/80">Isi formulir pendataan petani kopi baru</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-transform group-hover:scale-105">
                            <Plus size={22} />
                        </div>
                    </Link>
                    <Link href="/desa/baru"
                        className="group flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 transition-colors hover:ring-jade-700/40">
                        <div>
                            <p className="text-base font-semibold text-gray-900">Input Data Desa</p>
                            <p className="mt-1 text-sm text-gray-500">Isi formulir pendataan desa baru</p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-jade-50 group-hover:text-jade-800">
                            <Plus size={22} />
                        </div>
                    </Link>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((s) => (
                        <Link key={s.label} href={s.href}
                            className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-jade-700/40">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{s.label}</p>
                                <s.icon size={18} className="text-jade-700" />
                            </div>
                            <p className="mt-2 text-3xl font-semibold tracking-tight">{idNum.format(s.value)}</p>
                            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-500 transition-colors group-hover:text-jade-700">
                                Lihat data
                                <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </p>
                        </Link>
                    ))}
                </div>
            </main>
        );
    }

    // ============ ADMIN: dashboard analitik ============
    const r = await getRingkasan();

    const ENTITAS = [
        { label: "Total petani", value: r.jumlahPetani, href: "/petani", addHref: "/petani/baru", highlight: true },
        { label: "Desa terdata", value: r.jumlahDesa, href: "/desa", addHref: "/desa/baru", highlight: false },
        { label: "Kelompok tani", value: r.jumlahKelompok, href: "/kelompok-tani", addHref: "/kelompok-tani/baru", highlight: false },
    ];

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Dashboard Analitik</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Selamat datang, {session.user.name ?? "Pengguna"} - ringkasan seluruh data yang terkumpul.
                </p>
            </header>

            {/* Entitas utama + aksi */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ENTITAS.map((e) => (
                    <div key={e.label} className={`flex flex-col rounded-2xl p-6 shadow-sm ${
                        e.highlight ? "bg-jade-800 text-white" : "bg-white ring-1 ring-gray-950/5"
                    }`}>
                        <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                            e.highlight ? "text-jade-200" : "text-gray-500"
                        }`}>{e.label}</p>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">{idNum.format(e.value)}</p>
                        <div className="mt-5 flex flex-wrap items-center gap-2">
                            <Link href={e.href}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                    e.highlight ? "bg-white/15 text-white hover:bg-white/25" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}>
                                Lihat semua
                                <ArrowUpRight size={13} />
                            </Link>
                            <Link href={e.addHref}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                    e.highlight ? "text-jade-100 hover:bg-white/10" : "text-gray-600 hover:bg-gray-50"
                                }`}>
                                <Plus size={13} /> Tambah
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Angka umum */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatTile label="Luas areal kopi" value={fmt(r.luasArealKopiHa)} unit="ha" hint={`${fmt(r.luasPlotHa)} ha dari plot petani`} />
                <StatTile label="Produktivitas rata-rata" value={fmt(r.produktivitasRata, 1)} unit="kg/ha" hint={`Tahun ${r.tahunTerbaru ?? "-"}`} />
                <StatTile label="Pohon produktif" value={fmt(r.pohonProduktif)} hint="Dari seluruh plot petani" />
            </div>

            {/* Kategori */}
            <h2 className="mt-10 text-sm font-semibold tracking-tight">Kategori Analitik</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {KATEGORI.map((k) => (
                    <Link key={k.href} href={k.href}
                        className="group flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-jade-700/40">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{k.label}</p>
                            <p className="mt-1 text-xs text-gray-500">{k.desc}</p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-jade-50 text-jade-800 transition-colors group-hover:bg-jade-100">
                            <k.icon size={18} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Mini chart */}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                <div className="mb-4">
                    <h2 className="text-sm font-semibold tracking-tight">Tren produksi</h2>
                    <p className="mt-0.5 text-xs text-gray-500">Total volume (kg) per tahun, skala akar agar volume kecil tetap terlihat</p>
                </div>
                <LineChartX
                    data={r.trenProduksi}
                    xKey="tahun"
                    lines={[
                        { key: "cherry", label: "Cherry" },
                        { key: "gabahBasah", label: "Gabah basah" },
                        { key: "gabahKering", label: "Gabah kering" },
                        { key: "greenBean", label: "Green bean" },
                    ]}
                    unit="kg"
                    scale="sqrt"
                    height={260}
                />
            </div>
        </main>
    );
}
