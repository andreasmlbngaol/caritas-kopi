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

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Dashboard Analitik</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Selamat datang, {session.user.name ?? "Pengguna"} - ringkasan seluruh data yang terkumpul.
                </p>
            </header>

            {/* Info besar */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Total petani" value={r.jumlahPetani} highlight />
                <StatTile label="Desa terdata" value={r.jumlahDesa} />
                <StatTile label="Kelompok tani" value={r.jumlahKelompok} />
                <StatTile label="Luas areal kopi" value={fmt(r.luasArealKopiHa)} unit="ha" hint={`${fmt(r.luasPlotHa)} ha dari plot petani`} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label={`Green bean ${r.tahunTerbaru ?? ""}`} value={fmt(r.produksiTerbaru.greenBean)} unit="kg" />
                <StatTile label="Produktivitas rata-rata" value={fmt(r.produktivitasRata, 1)} unit="kg/ha" />
                <StatTile label="Harga rata-rata cherry" value={fmt(r.hargaRataCherry)} unit="Rp/kg" />
                <StatTile label="Pohon produktif" value={fmt(r.pohonProduktif)} />
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
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 lg:col-span-2">
                    <div className="mb-4">
                        <h2 className="text-sm font-semibold tracking-tight">Tren produksi</h2>
                        <p className="mt-0.5 text-xs text-gray-500">Total volume (kg) per tahun</p>
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
                        height={260}
                    />
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                    <h2 className="text-sm font-semibold tracking-tight">Akses cepat</h2>
                    <div className="mt-4 space-y-2">
                        <Link href="/petani/baru" className="flex items-center gap-3 rounded-xl bg-jade-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-jade-900">
                            <Plus size={16} /> Input Data Petani
                        </Link>
                        <Link href="/desa/baru" className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                            <Plus size={16} /> Input Data Desa
                        </Link>
                        <Link href="/petani" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50">
                            <UserRound size={16} /> Lihat Semua Petani
                        </Link>
                        <Link href="/desa" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50">
                            <MapPin size={16} /> Lihat Semua Desa
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
