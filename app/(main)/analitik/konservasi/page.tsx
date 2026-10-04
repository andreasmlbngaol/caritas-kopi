// app/(main)/analitik/konservasi/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getKonservasi } from "../queries";
import { KONDISI_KEBUN } from "../../petani/constants";
import { ChartCard, StatTile, RankList, fmt } from "../_components/analytics-ui";
import { HBarChartX } from "../_components/charts";

export default async function KonservasiPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const k = await getKonservasi();
    const labelOf = new Map(KONDISI_KEBUN.map((c) => [c.jenis, c.label]));
    const short = (s: string) => (s.length > 40 ? s.slice(0, 38).trimEnd() + "…" : s);

    const chartData = k.kondisi
        .map((c) => ({ label: short(labelOf.get(c.jenis) ?? c.jenis), jumlah: c.jumlah }))
        .sort((a, b) => a.jumlah - b.jumlah);

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Analitik Konservasi & Kondisi Kebun</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Kondisi lingkungan kebun petani dan profil konservasi desa.
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Desa berbatasan konservasi" value={fmt(k.berbatasan)} hint={`dari ${fmt(k.jumlahDesa)} desa`} highlight />
                <StatTile label="Desa rawan longsor" value={fmt(k.rawanLongsor)} />
                <StatTile label="Desa rawan erosi" value={fmt(k.rawanErosi)} />
                <StatTile label="Desa konflik satwa" value={fmt(k.konflikSatwa)} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Luas area penyangga" value={fmt(k.luasPenyanggaHa)} unit="ha" />
                <StatTile label="Luas lahan APL" value={fmt(k.luasAPLHa)} unit="ha" />
                <StatTile label="Tutupan hutan" value={fmt(k.tutupanHutan)} />
                <StatTile label="Agroforestry" value={fmt(k.tutupanAgroforestry)} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Kondisi kebun petani" desc="Jumlah petani yang menjawab 'Ya' per kondisi">
                    <HBarChartX data={chartData} yKey="label" xKey="jumlah" unit="petani" valueLabel="Petani" height={400} />
                </ChartCard>

                <ChartCard title="Rincian kondisi kebun">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    <th className="py-2 pr-3">Kondisi</th>
                                    <th className="py-2 pr-3 text-right">Petani</th>
                                    <th className="py-2 pr-3 text-right">Porsi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {k.kondisi.map((c) => (
                                    <tr key={c.jenis}>
                                        <td className="py-2 pr-3 text-gray-700">{labelOf.get(c.jenis) ?? c.jenis}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(c.jumlah)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(c.pct, 1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <ChartCard title="Praktik konservasi desa" desc="Praktik yang sudah dijalankan">
                    <RankList items={k.praktik} unit="desa" />
                </ChartCard>

                <ChartCard title="Jenis satwa konflik" desc="Satwa yang dilaporkan">
                    <RankList items={k.satwa} unit="desa" />
                </ChartCard>

                <ChartCard title="Kawasan konservasi terkait">
                    {k.kawasan.length === 0 ? (
                        <p className="text-sm text-gray-400">Tidak ada data.</p>
                    ) : (
                        <ul className="space-y-2.5">
                            {k.kawasan.map((n) => (
                                <li key={n} className="flex items-center gap-2.5 rounded-xl bg-jade-50 px-3 py-2 text-sm text-jade-900">
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jade-500" />
                                    {n}
                                </li>
                            ))}
                        </ul>
                    )}
                    <p className="mt-4 text-xs text-gray-400">Rata-rata jarak desa ke kawasan konservasi: {fmt(k.jarakKonservasiRata, 1)} km.</p>
                </ChartCard>
            </div>
        </main>
    );
}
