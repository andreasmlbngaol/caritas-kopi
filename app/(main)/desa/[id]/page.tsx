import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, FileDown, FileText, Pencil } from "lucide-react";
import { getBaselineDesaFull } from "../queries";
import { buildDesaExportModel } from "../export-model";
import { DeleteButton } from "../delete-button";

const thCls =
    "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400";
const labelCls = "bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-500";
const valueCls = "whitespace-pre-line px-4 py-2.5 text-sm";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="mb-4 text-sm font-semibold tracking-tight">{title}</h2>
            {children}
        </section>
    );
}

function KVTable({ rows }: { rows: [string, string][] }) {
    return (
        <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
            {rows.map(([k, v]) => (
                <tr key={k}>
                    <td className={`${labelCls} w-[55%]`}>{k}</td>
                    <td className={valueCls}>{v}</td>
                </tr>
            ))}
            </tbody>
        </table>
    );
}

function TickCell({ on }: { on: boolean }) {
    return (
        <td className="px-4 py-2.5">
      <span className="flex justify-center">
        {on ? (
            <Check size={15} className="text-jade-700" strokeWidth={3} />
        ) : (
            <span className="text-gray-300">-</span>
        )}
      </span>
        </td>
    );
}

export default async function DesaDetailPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const baseline = await getBaselineDesaFull(id);
    if (!baseline) notFound();
    if (session.user.role !== "ADMIN" && baseline.createdById !== session.user.id) notFound();

    const m = buildDesaExportModel(baseline);
    const isAdmin = session.user.role === "ADMIN";

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
            <header className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/desa"
                        title="Kembali ke daftar"
                        className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            {baseline.wilayah.nama}
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Kecamatan {baseline.wilayah.kecamatan.nama} · Tahun {baseline.tahunPendataan}
                            {isAdmin && ` · Diinput oleh ${m.meta.penginput}`}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <a
                        href={`/desa/${id}/export/pdf`}
                        title="Unduh PDF"
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                    >
                        <FileDown size={16} />
                    </a>
                    <a
                        href={`/desa/${id}/export/docx`}
                        title="Unduh Word"
                        className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                    >
                        <FileText size={16} />
                    </a>
                    <Link
                        href={`/desa/${id}/edit`}
                        title="Edit"
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-jade-800"
                    >
                        <Pencil size={16} />
                    </Link>
                    <DeleteButton id={id} namaDesa={baseline.wilayah.nama} />
                </div>
            </header>

            <div className="mt-8 space-y-6">
                {/* A - 4 kolom seperti formulir */}
                <Card title="A - Data Desa / Wilayah">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-sm">
                            <tbody className="divide-y divide-gray-100">
                            {m.sectionA.map((p, i) => (
                                <tr key={i}>
                                    <td className={`${labelCls} w-[21%]`}>{p.left[0]}</td>
                                    <td className={`${valueCls} w-[29%]`}>{p.left[1]}</td>
                                    <td className={`${labelCls} w-[21%]`}>{p.right[0]}</td>
                                    <td className={`${valueCls} w-[29%]`}>{p.right[1]}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* B - Kebijakan Lokal */}
                <Card title="B - Kebijakan Lokal">
                    <table className="w-full text-sm">
                        <thead>
                        <tr>
                            <th className={thCls}>Kebijakan Lokal</th>
                            <th className={`${thCls} w-16 text-center`}>Ada</th>
                            <th className={`${thCls} w-16 text-center`}>Tidak</th>
                            <th className={thCls}>Keterangan</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {m.sectionB.map((r) => (
                            <tr key={r.label}>
                                <td className="px-4 py-2.5 text-sm">{r.label}</td>
                                <TickCell on={r.ada} />
                                <TickCell on={!r.ada} />
                                <td className="px-4 py-2.5 text-sm text-gray-600">{r.keterangan}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </Card>

                {/* C - Kelembagaan */}
                <Card title="C - Kelembagaan">
                    <table className="w-full text-sm">
                        <thead>
                        <tr>
                            <th className={thCls}>Lembaga</th>
                            <th className={`${thCls} w-28 text-center`}>Jumlah</th>
                            <th className={thCls}>Kondisi</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {m.sectionC.map((r) => (
                            <tr key={r.label}>
                                <td className="px-4 py-2.5 text-sm font-medium">{r.label}</td>
                                <td className="px-4 py-2.5 text-center text-sm">{r.jumlah}</td>
                                <td className="px-4 py-2.5 text-sm text-gray-600">{r.kondisi}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </Card>

                {/* D & E berdampingan di layar lebar */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card title="D - Kondisi Bisnis Kopi Saat Ini">
                        <KVTable rows={m.sectionD} />
                    </Card>
                    <Card title="E - Kondisi Konservasi">
                        <KVTable rows={m.sectionE} />
                    </Card>
                </div>
            </div>
        </main>
    );
}