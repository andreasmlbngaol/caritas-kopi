// app/(main)/analitik/produksi/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analitik Produksi" };

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getProduksi, getDesaOptions } from "../queries";
import { ChartCard, StatTile, fmt } from "../_components/analytics-ui";
import { LineChartX, BarChartX, GroupedStackedBarChartX } from "../_components/charts";
import { DesaFilter } from "../_components/desa-filter";

const KATEGORI_PRODUKSI = [
    { key: "cherry", label: "Cherry" },
    { key: "gabahBasah", label: "Gabah basah" },
    { key: "gabahKering", label: "Gabah kering" },
    { key: "greenBean", label: "Green bean" },
];

export default async function ProduksiPage({
    searchParams,
}: {
    searchParams: Promise<{ desa?: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const scope = session.user.role === "ADMIN" ? undefined : session.user.id;
    const { desa } = await searchParams;
    const [{ byTahun, perDesaTahun, tahunDesa, tahunTerbaru }, desaOptions] = await Promise.all([
        getProduksi(scope, desa),
        getDesaOptions(scope),
    ]);
    const terbaru = byTahun.at(-1);
    const totalTerbaru = terbaru
        ? terbaru.cherry + terbaru.gabahBasah + terbaru.gabahKering + terbaru.greenBean
        : 0;

    return (
        <main className={pageWide}>
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">Analitik Produksi</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tren volume produksi & produktivitas petani kopi per tahun.
                    </p>
                </div>
                <DesaFilter options={desaOptions} value={desa} />
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <StatTile label={`Green bean ${tahunTerbaru ?? "-"}`} value={fmt(terbaru?.greenBean ?? 0)} unit="kg" />
                <StatTile label={`Cherry ${tahunTerbaru ?? "-"}`} value={fmt(terbaru?.cherry ?? 0)} unit="kg" />
                <StatTile label={`Gabah basah ${tahunTerbaru ?? "-"}`} value={fmt(terbaru?.gabahBasah ?? 0)} unit="kg" />
                <StatTile label={`Gabah kering ${tahunTerbaru ?? "-"}`} value={fmt(terbaru?.gabahKering ?? 0)} unit="kg" />
                <StatTile label="Produktivitas" value={fmt(totalTerbaru)} unit="kg" hint={`Rata-rata ${fmt(terbaru?.produktivitasRata ?? 0, 1)} kg/ha tahun ${tahunTerbaru ?? "-"}`} highlight />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Tren produksi per tahun" desc="Total volume (kg) menurut jenis olahan, skala akar agar volume kecil tetap terlihat">
                    <LineChartX
                        data={byTahun}
                        xKey="tahun"
                        lines={[
                            { key: "cherry", label: "Cherry" },
                            { key: "gabahBasah", label: "Gabah basah" },
                            { key: "gabahKering", label: "Gabah kering" },
                            { key: "greenBean", label: "Green bean" },
                        ]}
                        unit="kg"
                        scale="sqrt"
                    />
                </ChartCard>
                <ChartCard title="Produktivitas rata-rata" desc="kg per hektar per tahun">
                    <BarChartX data={byTahun} xKey="tahun" yKey="produktivitasRata" unit="kg/ha" valueLabel="Produktivitas" />
                </ChartCard>
            </div>

            <div className="mt-6">
                <ChartCard title="Produksi per desa 2023–2026" desc="4 bar per desa (satu per tahun), tiap bar ditumpuk menurut jenis olahan">
                    <div className="overflow-x-auto">
                        <GroupedStackedBarChartX
                            data={perDesaTahun}
                            xKey="nama"
                            groups={tahunDesa.map((t) => ({ key: String(t), label: String(t) }))}
                            series={KATEGORI_PRODUKSI}
                            unit="kg"
                            rotateLabels={!desa}
                            height={420}
                            minWidth={desa ? undefined : Math.max(640, perDesaTahun.length * 72)}
                            spread={Boolean(desa)}
                        />
                    </div>
                </ChartCard>
            </div>

            <div className="mt-6">
                <ChartCard title="Rekap per tahun">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="py-2 pr-3">Tahun</th>
                                    <th className="py-2 pr-3 text-right">Petani</th>
                                    <th className="py-2 pr-3 text-right">Cherry</th>
                                    <th className="py-2 pr-3 text-right">Gabah basah</th>
                                    <th className="py-2 pr-3 text-right">Gabah kering</th>
                                    <th className="py-2 pr-3 text-right">Green bean</th>
                                    <th className="py-2 pr-3 text-right">Total produksi (kg)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {byTahun.map((t) => (
                                    <tr key={t.tahun}>
                                        <td className="py-2 pr-3 font-medium text-gray-900">{t.tahun}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(t.jumlahPetani)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(t.cherry)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(t.gabahBasah)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(t.gabahKering)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(t.greenBean)}</td>
                                        <td className="py-2 pr-3 text-right font-medium tabular-nums">{fmt(t.total)}</td>
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
