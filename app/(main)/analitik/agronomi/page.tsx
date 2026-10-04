// app/(main)/analitik/agronomi/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getAgronomi } from "../queries";
import { STATUS_KEPEMILIKAN, SISTEM_BUDIDAYA } from "../../petani/constants";
import { ChartCard, StatTile, fmt } from "../_components/analytics-ui";
import { HBarChartX, DonutChartX, BarChartX } from "../_components/charts";

const labelOf = (opts: readonly { value: string; label: string }[], v: string) =>
    opts.find((o) => o.value === v)?.label ?? v;

export default async function AgronomiPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const a = await getAgronomi();
    const short = (s: string) => (s.length > 26 ? s.slice(0, 24).trimEnd() + "…" : s);

    const varietasData = a.varietas.map((v) => ({ label: short(v.nama), jumlah: v.jumlah }));
    const sistemData = a.sistemBudidaya.map((s) => ({ nama: labelOf(SISTEM_BUDIDAYA, s.nama), jumlah: s.jumlah }));
    const kepemilikanData = a.kepemilikan.map((k) => ({ nama: labelOf(STATUS_KEPEMILIKAN, k.nama), jumlah: k.jumlah }));
    const naunganData = a.naungan.map((n) => ({ label: short(n.nama), plot: n.plot }));

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Analitik Agronomi Plot</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Varietas, sistem budidaya, kepemilikan lahan, naungan, dan umur tanaman.
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Jumlah plot" value={fmt(a.jumlahPlot)} hint={`dari ${fmt(a.totalPetani)} petani`} highlight />
                <StatTile label="Total luas kopi (plot)" value={fmt(a.totalLuas)} unit="ha" />
                <StatTile label="Pohon produktif" value={fmt(a.totalPohonProduktif)} hint={`rata-rata ${fmt(a.rataProduktif)} / plot`} />
                <StatTile label="Pohon tidak produktif" value={fmt(a.totalPohonTidakProduktif)} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Varietas kopi" desc="Jumlah plot per varietas (multi-varietas dihitung masing-masing)">
                    <HBarChartX data={varietasData} yKey="label" xKey="jumlah" unit="plot" valueLabel="Plot" height={340} />
                </ChartCard>
                <ChartCard title="Sistem budidaya">
                    <DonutChartX data={sistemData} nameKey="nama" valueKey="jumlah" height={340} />
                </ChartCard>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <ChartCard title="Status kepemilikan lahan">
                    <DonutChartX data={kepemilikanData} nameKey="nama" valueKey="jumlah" height={300} />
                </ChartCard>
                <ChartCard title="Umur tanaman" desc="Distribusi plot per umur">
                    <BarChartX data={a.umur} xKey="label" yKey="jumlah" unit="plot" valueLabel="Plot" height={300} />
                </ChartCard>
                <ChartCard title="Tanaman naungan" desc="Jumlah plot per jenis naungan">
                    <HBarChartX data={naunganData} yKey="label" xKey="plot" unit="plot" valueLabel="Plot" height={300} />
                </ChartCard>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Jenis tanaman naungan">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    <th className="py-2 pr-3">Jenis</th>
                                    <th className="py-2 pr-3 text-right">Plot</th>
                                    <th className="py-2 pr-3 text-right">Total pohon</th>
                                    <th className="py-2 pr-3 text-right">Dipangkas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {a.naungan.map((n) => (
                                    <tr key={n.nama}>
                                        <td className="py-2 pr-3 text-gray-700">{n.nama}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(n.plot)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(n.pohon)}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(n.dipangkas)}</td>
                                    </tr>
                                ))}
                                {a.naungan.length === 0 && <tr><td colSpan={4} className="py-3 text-gray-400">Belum ada data naungan.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
                <ChartCard title="Pestisida yang digunakan" desc="Jumlah plot per nama pestisida">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                    <th className="py-2 pr-3">Nama pestisida</th>
                                    <th className="py-2 pr-3 text-right">Plot</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {a.pestisida.map((p) => (
                                    <tr key={p.nama}>
                                        <td className="py-2 pr-3 text-gray-700">{p.nama}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(p.jumlah)}</td>
                                    </tr>
                                ))}
                                {a.pestisida.length === 0 && <tr><td colSpan={2} className="py-3 text-gray-400">Belum ada data pestisida.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </ChartCard>
            </div>
        </main>
    );
}
