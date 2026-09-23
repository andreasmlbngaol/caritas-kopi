import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, FileDown, Pencil } from "lucide-react";
import { DeleteButton } from "./delete-button";

export default async function DesaPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "ADMIN";

    const items = await prisma.baselineDesa.findMany({
        where: isAdmin ? {} : { createdById: session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            createdBy: { select: { fullName: true, username: true } },
            wilayah: { include: { kecamatan: true } },
        },
    });

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">Data Baseline Desa</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isAdmin ? "Semua data dari seluruh enumerator." : "Data yang Anda inputkan."}
                    </p>
                </div>
                <Link
                    href="/desa/baru"
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-jade-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jade-900"
                >
                    <Plus size={16} /> Input Data
                </Link>
            </header>

            {items.length === 0 ? (
                <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">
                        Belum ada data. Mulai dengan tombol &#34;Input Data&#34;.
                    </p>
                </div>
            ) : (
                <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                    <table className="w-full min-w-[560px] text-sm">
                        <thead>
                        <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                            <th className="px-5 py-3.5">Desa</th>
                            <th className="px-5 py-3.5">Kecamatan</th>
                            {isAdmin && <th className="px-5 py-3.5">Penginput</th>}
                            <th className="px-5 py-3.5">Tanggal Input</th>
                            <th className="px-5 py-3.5 text-right">Aksi</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                        {items.map((d) => (
                            <tr key={d.id} className="transition-colors hover:bg-gray-50/50">
                                <td className="px-5 py-3.5 font-medium">
                                    <Link
                                        href={`/desa/${d.id}`}
                                        className="text-gray-900 underline-offset-2 transition-colors hover:text-jade-800 hover:underline"
                                    >
                                        {d.wilayah.nama}
                                    </Link>
                                </td>
                                <td className="px-5 py-3.5 text-gray-500">{d.wilayah.kecamatan.nama}</td>
                                {isAdmin && (
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {d.createdBy.fullName ?? d.createdBy.username}
                                    </td>
                                )}
                                <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">
                                    {d.createdAt.toLocaleDateString("id-ID")}
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center justify-end gap-1">
                                        <a
                                            href={`/desa/${d.id}/export/pdf`}
                                            title="Unduh PDF"
                                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                                        >
                                            <FileDown size={16} />
                                        </a>
                                        <a
                                            href={`/desa/${d.id}/export/docx`}
                                            title="Unduh Word"
                                            className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                                        >
                                            <FileText size={16} />
                                        </a>
                                        <Link
                                            href={`/desa/${d.id}/edit`}
                                            title="Edit"
                                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-jade-800"
                                        >
                                            <Pencil size={16} />
                                        </Link>
                                        <DeleteButton id={d.id} namaDesa={d.wilayah.nama} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </main>
    );
}