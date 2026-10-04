// app/(main)/analitik/gap/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getGapAdoption } from "../queries";
import { GAP_GROUPS } from "../../petani/constants";
import { ChartCard, StatTile, Meter, fmt } from "../_components/analytics-ui";
import { ProportionBarX } from "../_components/charts";

export default async function GapPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const { totalPetani, items, adopsiKeseluruhan } = await getGapAdoption();
    const labelOf = new Map(GAP_GROUPS.flatMap((g) => g.items).map((i) => [i.jenis, i.label]));
    const itemOf = new Map(items.map((i) => [i.jenis, i]));

    const ranked = [...items].sort((a, b) => b.pctYa - a.pctYa);
    const terbaik = ranked.slice(0, 5);
    const terendah = ranked.slice(-5).reverse();

    const short = (s: string) => (s.length > 40 ? s.slice(0, 38).trimEnd() + "…" : s);
    const groupCharts = GAP_GROUPS.map((g) => ({
        kelompok: g.kelompok,
        data: g.items
            .map((it) => {
                const r = itemOf.get(it.jenis);
                return {
                    label: short(it.label),
                    ya: r?.ya ?? 0,
                    kadang: r?.kadang ?? 0,
                    tidak: r?.tidak ?? 0,
                };
            })
            .sort((a, b) => (b.ya / (b.ya + b.kadang + b.tidak || 1)) - (a.ya / (a.ya + a.kadang + a.tidak || 1))),
    }));

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Analitik GAP</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Tingkat adopsi 21 praktik Good Agricultural Practices pada {fmt(totalPetani)} petani.
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatTile label="Adopsi keseluruhan" value={`${fmt(adopsiKeseluruhan, 1)}%`} hint="Rata-rata jawaban 'Ya'" highlight />
                <StatTile label="Praktik teradopsi tertinggi" value={`${fmt(terbaik[0]?.pctYa ?? 0, 1)}%`} hint={labelOf.get(terbaik[0]?.jenis ?? "") ?? "-"} />
                <StatTile label="Praktik terendah" value={`${fmt(terendah[0]?.pctYa ?? 0, 1)}%`} hint={labelOf.get(terendah[0]?.jenis ?? "") ?? "-"} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {groupCharts.map((g) => (
                    <ChartCard key={g.kelompok} title={`Adopsi - ${g.kelompok}`} desc="Proporsi jawaban Ya / Kadang / Tidak per praktik">
                        <ProportionBarX data={g.data} height={Math.max(160, g.data.length * 40)} />
                    </ChartCard>
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="5 praktik terbaik">
                    <div className="space-y-4">
                        {terbaik.map((i) => (
                            <Meter key={i.jenis} label={labelOf.get(i.jenis) ?? i.jenis} value={i.pctYa}
                                right={`${fmt(i.pctYa, 1)}% · ${i.ya}/${i.total}`} />
                        ))}
                    </div>
                </ChartCard>
                <ChartCard title="5 praktik terendah" desc="Prioritas pendampingan">
                    <div className="space-y-4">
                        {terendah.map((i) => (
                            <Meter key={i.jenis} label={labelOf.get(i.jenis) ?? i.jenis} value={i.pctYa}
                                right={`${fmt(i.pctYa, 1)}% · ${i.ya}/${i.total}`} />
                        ))}
                    </div>
                </ChartCard>
            </div>

            <div className="mt-6 space-y-6">
                {GAP_GROUPS.map((g) => (
                    <ChartCard key={g.kelompok} title={g.kelompok}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        <th className="py-2 pr-3">Praktik</th>
                                        <th className="py-2 pr-3 text-right">Ya</th>
                                        <th className="py-2 pr-3 text-right">Kadang</th>
                                        <th className="py-2 pr-3 text-right">Tidak</th>
                                        <th className="py-2 pr-3 text-right">Adopsi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {g.items.map((item) => {
                                        const r = itemOf.get(item.jenis);
                                        return (
                                            <tr key={item.jenis}>
                                                <td className="py-2 pr-3 text-gray-700">{item.label}</td>
                                                <td className="py-2 pr-3 text-right tabular-nums">{fmt(r?.ya ?? 0)}</td>
                                                <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(r?.kadang ?? 0)}</td>
                                                <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{fmt(r?.tidak ?? 0)}</td>
                                                <td className="py-2 pr-3 text-right font-medium tabular-nums">{fmt(r?.pctYa ?? 0, 1)}%</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                ))}
            </div>
        </main>
    );
}
