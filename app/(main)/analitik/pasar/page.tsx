// app/(main)/analitik/pasar/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analitik Pasar & Produk" };

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getPasarProduk } from "../queries";
import { PRODUK, PASAR } from "../../petani/constants";
import { ChartCard, StatTile, fmt } from "../_components/analytics-ui";
import { HBarChartX, DonutChartX } from "../_components/charts";

export default async function PasarPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const { produk, pasar, totalPetani } = await getPasarProduk();

    const produkLabel = new Map<string, string>(PRODUK.map((p) => [p.jenis, p.label]));
    const pasarLabel = new Map<string, string>(PASAR.map((p) => [p.kategori, p.label]));
    const labelProduk = (p: { jenis: string; label: string }) => (p.jenis === "LAINNYA" ? p.label : produkLabel.get(p.jenis) ?? p.jenis);
    const labelPasar = (p: { kategori: string; label: string }) => (p.kategori === "LAINNYA" ? p.label : pasarLabel.get(p.kategori) ?? p.kategori);
    const short = (s: string) => (s.length > 32 ? s.slice(0, 30).trimEnd() + "…" : s);

    const produkData = produk.map((p) => ({ label: short(labelProduk(p)), volume: p.volume }));
    const pasarData = pasar.map((p) => ({ nama: short(labelPasar(p)), petani: p.petani }));

    const totalVolume = produk.reduce((s, p) => s + p.volume, 0);
    const topProduk = produk[0];

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Analitik Pasar & Produk</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Sebaran jenis produk yang dijual dan kategori pasar petani (termasuk produk/kategori lainnya).
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatTile label="Total volume terjual" value={fmt(totalVolume)} unit="kg/thn" highlight />
                <StatTile label="Produk terbesar" value={fmt(topProduk?.volume ?? 0)} unit="kg"
                    hint={topProduk ? labelProduk(topProduk) : "-"} />
                <StatTile label="Petani terdaftar" value={fmt(totalPetani)} hint={`${pasar.length} kategori pasar aktif`} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Volume per jenis produk" desc="Total kg/tahun yang dijual (hanya produk aktif)">
                    <HBarChartX data={produkData} yKey="label" xKey="volume" unit="kg" valueLabel="Volume" height={Math.max(300, produk.length * 40)} />
                </ChartCard>
                <ChartCard title="Sebaran kategori pasar" desc="Jumlah petani per kategori pasar aktif">
                    <DonutChartX data={pasarData} nameKey="nama" valueKey="petani" height={340} />
                </ChartCard>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Rincian produk">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="py-2 pr-3">Produk</th>
                                    <th className="py-2 pr-3 text-right">Petani</th>
                                    <th className="py-2 pr-3 text-right">Volume (kg)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {produk.map((p, i) => (
                                    <tr key={i}>
                                        <td className="py-2 pr-3 text-gray-700">
                                            {labelProduk(p)}
                                            {p.custom && <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">lainnya</span>}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(p.petani)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.volume)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>

                <ChartCard title="Rincian kategori pasar">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="py-2 pr-3">Kategori</th>
                                    <th className="py-2 pr-3 text-right">Petani</th>
                                    <th className="py-2 pr-3 text-right">Rata-rata porsi</th>
                                    <th className="py-2 pr-3">Profil penjual</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pasar.map((p, i) => (
                                    <tr key={i}>
                                        <td className="py-2 pr-3 text-gray-700">
                                            {labelPasar(p)}
                                            {p.custom && <span className="ml-1.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">lainnya</span>}
                                        </td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(p.petani)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.rataPersen, 1)}%</td>
                                        <td className="py-2 pr-3 text-gray-500">{p.profil.join(", ") || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>
        </main>
    );
}
