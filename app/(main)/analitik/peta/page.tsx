// app/(main)/analitik/peta/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Peta Sebaran" };

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { pageWide } from "../../layout-cls";
import { getLokasi } from "../queries";
import { ChartCard, StatTile, fmt } from "../_components/analytics-ui";
import { MapView } from "../_components/map";

export default async function PetaPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (session.user.role !== "ADMIN") redirect("/");

    const { desa, plot } = await getLokasi();
    const totalLuas = desa.reduce((s, d) => s + d.luasArealKopiHa, 0);

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Peta Sebaran</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Lokasi desa (lingkaran jade, ukuran = luas areal kopi) dan plot petani (oranye) yang memiliki koordinat foto.
                </p>
            </header>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatTile label="Desa terpetakan" value={fmt(desa.length)} highlight />
                <StatTile label="Plot berkoordinat" value={fmt(plot.length)} />
                <StatTile label="Luas areal kopi (desa)" value={fmt(totalLuas)} unit="ha" />
            </div>

            <div className="mt-6">
                {desa.length === 0 && plot.length === 0 ? (
                    <ChartCard title="Peta">
                        <p className="py-10 text-center text-sm text-gray-500">
                            Belum ada data koordinat. Isi latitude/longitude pada formulir desa, atau unggah foto plot dengan lokasi GPS.
                        </p>
                    </ChartCard>
                ) : (
                    <ChartCard title="Sebaran lokasi" desc="Klik penanda untuk detail">
                        <MapView desa={desa} plot={plot} />
                    </ChartCard>
                )}
            </div>

            {desa.length > 0 && (
                <div className="mt-6">
                    <ChartCard title="Daftar desa terpetakan">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[560px] text-sm">
                                <thead>
                                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                        <th className="py-2 pr-3">Desa</th>
                                        <th className="py-2 pr-3">Kecamatan</th>
                                        <th className="py-2 pr-3 text-right">Koordinat</th>
                                        <th className="py-2 pr-3 text-right">Luas kopi (ha)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {desa.map((d) => (
                                        <tr key={d.nama}>
                                            <td className="py-2 pr-3 font-medium text-gray-900">{d.nama}</td>
                                            <td className="py-2 pr-3 text-gray-500">{d.kecamatan}, {d.kabupaten}</td>
                                            <td className="py-2 pr-3 text-right tabular-nums text-gray-500">{d.lat.toFixed(4)}, {d.lng.toFixed(4)}</td>
                                            <td className="py-2 pr-3 text-right tabular-nums">{fmt(d.luasArealKopiHa)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </div>
            )}
        </main>
    );
}
