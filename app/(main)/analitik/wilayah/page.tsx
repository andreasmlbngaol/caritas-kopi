// app/(main)/analitik/wilayah/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analitik Wilayah & Kelembagaan" };

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getWilayah } from "../queries";
import { KEBIJAKAN, LEMBAGA } from "../../desa/constants";
import { ChartCard, StatTile, Meter, fmt } from "../_components/analytics-ui";
import { HBarChartX, DonutChartX, BarChartX } from "../_components/charts";

export default async function WilayahPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const w = await getWilayah();
    const lembagaLabel = new Map(LEMBAGA.map((l) => [l.jenis, l.label]));
    const kebijakanLabel = new Map(KEBIJAKAN.map((k) => [k.jenis, k.label]));
    const short = (s: string) => (s.length > 28 ? s.slice(0, 26).trimEnd() + "…" : s);

    const desaData = w.topDesa.map((d) => ({ nama: short(d.nama), petani: d.petani }));
    const genderData = [
        { nama: "Laki-laki", petani: w.gender.L },
        { nama: "Perempuan", petani: w.gender.P },
        { nama: "Tidak diisi", petani: w.gender.null },
    ].filter((g) => g.petani > 0);

    const totalGender = w.gender.L + w.gender.P;
    const pctP = totalGender ? (w.gender.P / totalGender) * 100 : 0;

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Analitik Wilayah & Kelembagaan</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Sebaran petani, demografi, kelembagaan desa, dan kebijakan pendukung.
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatTile label="Desa terdata" value={fmt(w.jumlahDesa)} highlight />
                <StatTile label="Total penduduk" value={fmt(w.totalPenduduk)} />
                <StatTile label="Luas areal kopi" value={fmt(w.totalArealKopi)} unit="ha" />
                <StatTile label="Petani kopi (desa)" value={fmt(w.totalPetaniKopi)} hint={`${fmt(pctP, 1)}% petani perempuan`} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Top 10 desa - jumlah petani" desc="Berdasarkan data petani terinput">
                    <HBarChartX data={desaData} yKey="nama" xKey="petani" unit="petani" valueLabel="Petani" height={360} />
                </ChartCard>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <ChartCard title="Jenis kelamin petani">
                        <DonutChartX data={genderData} nameKey="nama" valueKey="petani" height={300} />
                    </ChartCard>
                    <ChartCard title="Kelompok usia petani">
                        <BarChartX data={w.usia} xKey="label" yKey="jumlah" unit="orang" valueLabel="Petani" height={300} />
                    </ChartCard>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Kelembagaan desa" desc="Total unit dari seluruh baseline desa">
                    <div className="space-y-4">
                        {w.lembaga.map((l) => (
                            <Meter key={l.jenis} label={lembagaLabel.get(l.jenis) ?? l.jenis}
                                value={l.jumlah} right={fmt(l.jumlah)} />
                        ))}
                        {w.lembaga.length === 0 && <p className="text-sm text-gray-500">Belum ada data kelembagaan.</p>}
                    </div>
                </ChartCard>

                <ChartCard title="Kebijakan pendukung kopi" desc="Jumlah desa yang memiliki kebijakan">
                    <div className="space-y-4">
                        {w.kebijakan.map((k) => (
                            <Meter key={k.jenis} label={kebijakanLabel.get(k.jenis) ?? k.jenis}
                                value={w.jumlahDesa ? (k.desa / w.jumlahDesa) * 100 : 0}
                                right={`${fmt(k.desa)} desa`} />
                        ))}
                        {w.kebijakan.length === 0 && <p className="text-sm text-gray-500">Belum ada data kebijakan.</p>}
                    </div>
                </ChartCard>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Karakteristik wilayah desa" desc="Frekuensi atribut antar desa">
                    <div className="space-y-5">
                        <FreqBlock title="Topografi" items={w.topografi} />
                        <FreqBlock title="Jenis tanah" items={w.jenisTanah} />
                        <FreqBlock title="Akses jalan" items={w.aksesJalan} />
                    </div>
                    <p className="mt-4 text-xs text-gray-500">
                        Rata-rata ketinggian {fmt(w.rataKetinggian)} mdpl · suhu {fmt(w.rataSuhu, 1)} °C.
                    </p>
                </ChartCard>

                <ChartCard title="Bisnis kopi desa" desc="Pembeli, eksportir & industri pengolahan">
                    <div className="space-y-5">
                        <FreqBlock title="Pembeli utama" items={w.pembeliUtama} />
                        <FreqBlock title="Eksportir" items={w.eksportir} />
                        <FreqBlock title="Industri pengolahan" items={w.industri} />
                        <FreqBlock title="Permasalahan utama" items={w.permasalahan} />
                    </div>
                </ChartCard>
            </div>

            <div className="mt-6">
                <ChartCard title="Rincian desa" desc="Data wilayah dari baseline desa">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-sm">
                            <thead>
                                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                    <th className="py-2 pr-3">Desa</th>
                                    <th className="py-2 pr-3">Kecamatan</th>
                                    <th className="py-2 pr-3 text-right">Petani terdata</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {w.topDesa.map((d) => (
                                    <tr key={d.nama}>
                                        <td className="py-2 pr-3 font-medium text-gray-900">{d.nama}</td>
                                        <td className="py-2 pr-3 text-gray-500">{d.kecamatan}</td>
                                        <td className="py-2 pr-3 text-right tabular-nums">{fmt(d.petani)}</td>
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

// Daftar frekuensi rapi: titik warna + nama + jumlah (bukan chip).
function FreqBlock({ title, items, color = "#1f8a64" }: { title: string; items: { nama: string; jumlah: number }[]; color?: string }) {
    if (items.length === 0) return null;
    return (
        <div>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {items.map((i) => (
                    <span key={i.nama} className="flex items-center gap-1.5 text-sm text-gray-700">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        {i.nama}
                        <span className="text-xs font-medium text-gray-500">{fmt(i.jumlah)}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
