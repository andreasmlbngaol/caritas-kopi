// app/(main)/petani/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, FileDown, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { pageWide } from "../layout-cls";
import { DeleteButton } from "./delete-button";

const PER_PAGE = 20;

export default async function PetaniPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ q?: string; page?: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "ADMIN";
    const { q = "", page = "1" } = await searchParams;
    const pageNum = Math.max(1, Number(page) || 1);

    const where = {
        ...(isAdmin ? {} : { createdById: session.user.id }),
        ...(q
            ? {
                OR: [
                    { namaLengkap: { contains: q, mode: "insensitive" as const } },
                    { kodePetani: { contains: q, mode: "insensitive" as const } },
                    { kelompokTani: { kode: { contains: q, mode: "insensitive" as const } } },
                ],
            }
            : {}),
    };

    const [total, items] = await Promise.all([
        prisma.petani.count({ where }),
        prisma.petani.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (pageNum - 1) * PER_PAGE,
            take: PER_PAGE,
            include: {
                createdBy: { select: { fullName: true, username: true } },
                desa: { include: { kecamatan: true } },
                kelompokTani: true,
            },
        }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const pageUrl = (p: number) => `/petani?q=${encodeURIComponent(q)}&page=${p}`;

    return (
        <main className={pageWide}>
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">Data Baseline Petani</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {isAdmin ? "Semua data dari seluruh enumerator." : "Data yang Anda inputkan."}
                    </p>
                </div>
                <Link
                    href="/petani/baru"
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-jade-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jade-900"
                >
                    <Plus size={16} /> Input Data
                </Link>
            </header>

            <form action="/petani" className="mt-6 flex gap-2">
                <div className="relative flex-1 sm:max-w-sm">
                    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        name="q" defaultValue={q} placeholder="Cari nama / kode petani / kode kelompok…"
                        className="w-full rounded-xl bg-white py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-gray-300 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-jade-700"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    Cari
                </button>
            </form>

            {items.length === 0 ? (
                <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">
                        {q ? "Tidak ada hasil untuk pencarian ini." : "Belum ada data. Mulai dengan tombol \"Input Data\"."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead>
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                <th className="px-5 py-3.5">Nama</th>
                                <th className="px-5 py-3.5">Kode Petani</th>
                                <th className="px-5 py-3.5">Desa</th>
                                <th className="px-5 py-3.5">Kelompok</th>
                                {isAdmin && <th className="px-5 py-3.5">Penginput</th>}
                                <th className="px-5 py-3.5">Tanggal Input</th>
                                <th className="px-5 py-3.5 text-right">Aksi</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {items.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                                    <td className="px-5 py-3.5 font-medium">
                                        <Link
                                            href={`/petani/${p.id}`}
                                            className="text-gray-900 underline-offset-2 transition-colors hover:text-jade-800 hover:underline"
                                        >
                                            {p.namaLengkap}
                                        </Link>
                                    </td>
                                    <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">{p.kodePetani ?? "-"}</td>
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {p.desa.nama}
                                        <span className="block text-xs text-gray-400">Kec. {p.desa.kecamatan.nama}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {p.kelompokTani ? p.kelompokTani.nama : "-"}
                                        {p.kelompokTani?.kode && (
                                            <span className="block text-xs text-gray-400">{p.kelompokTani.kode}</span>
                                        )}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-5 py-3.5 text-gray-500">
                                            {p.createdBy.fullName ?? p.createdBy.username}
                                        </td>
                                    )}
                                    <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">
                                        {p.createdAt.toLocaleDateString("id-ID")}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={`/petani/${p.id}/export/pdf`}
                                                title="Unduh PDF"
                                                className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                                            >
                                                <FileDown size={16} />
                                            </a>
                                            <a
                                                href={`/petani/${p.id}/export/docx`}
                                                title="Unduh Word"
                                                className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                                            >
                                                <FileText size={16} />
                                            </a>
                                    <Link
                                                href={`/petani/${p.id}/edit`} title="Edit"
                                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-jade-800"
                                            >
                                                <Pencil size={16} />
                                            </Link>
                                            <DeleteButton
                                                id={p.id} nama={p.namaLengkap} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <span>{total} data — halaman {pageNum} dari {totalPages}</span>
                            <div className="flex gap-1">
                                {pageNum > 1 && (
                                    <Link href={pageUrl(pageNum - 1)} className="rounded-lg p-2 transition-colors hover:bg-white hover:text-gray-900">
                                        <ChevronLeft size={16} />
                                    </Link>
                                )}
                                {pageNum < totalPages && (
                                    <Link href={pageUrl(pageNum + 1)} className="rounded-lg p-2 transition-colors hover:bg-white hover:text-gray-900">
                                        <ChevronRight size={16} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}