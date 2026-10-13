// app/(main)/petani/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data Petani" };

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { pageWide } from "../layout-cls";
import { parseSort, nestedOrderBy } from "../_components/sort";
import { PetaniSelectTable } from "./select-table";

const PER_PAGE = 20;

// Kolom yang bisa diurutkan + pemetaan ke orderBy Prisma.
const SORT_COLUMNS = [
    "namaLengkap",
    "kodePetani",
    "desa.nama",
    "kelompokTani.nama",
    "createdBy.fullName",
] as const;

export default async function PetaniPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ q?: string; page?: string; sort?: string; dir?: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "ADMIN";
    const sp = await searchParams;
    const { q = "", page = "1" } = sp;
    const pageNum = Math.max(1, Number(page) || 1);
    const { sort, dir } = parseSort(sp, SORT_COLUMNS, "namaLengkap");

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

    const [total, items, allIds] = await Promise.all([
        prisma.petani.count({ where }),
        prisma.petani.findMany({
            where,
            orderBy: nestedOrderBy<Prisma.PetaniOrderByWithRelationInput>(sort, dir),
            skip: (pageNum - 1) * PER_PAGE,
            take: PER_PAGE,
            include: {
                createdBy: { select: { fullName: true, username: true } },
                desa: { include: { kecamatan: true } },
                kelompokTani: true,
            },
        }),
        // Semua id hasil filter (bukan cuma halaman ini) untuk "pilih semua".
        // Batasi 1000 agar payload tetap wajar; export di server juga dibatasi.
        prisma.petani.findMany({ where, select: { id: true }, orderBy: { namaLengkap: "asc" }, take: 1000 }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    const pageUrl = (p: number) =>
        `/petani?${new URLSearchParams({ q, sort, dir, page: String(p) })}`;
    const sortParams = { q };

    return (
        <main className={pageWide}>
            <header className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold tracking-tight">Data Petani</h1>
                    {isAdmin && <p className="mt-1 text-sm text-gray-500">Semua data dari seluruh enumerator.</p>}
                </div>
                <Link
                    href="/petani/baru"
                    className="flex shrink-0 items-center gap-2 rounded-xl bg-jade-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jade-900"
                >
                    <Plus size={16} /> Input Data
                </Link>
            </header>

            <form action="/petani" className="mt-6 flex gap-2">
                <input type="hidden" name="sort" value={sort} />
                <input type="hidden" name="dir" value={dir} />
                <div className="relative flex-1 sm:max-w-sm">
                    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
                    <PetaniSelectTable
                        rows={items.map((p) => ({
                            id: p.id,
                            namaLengkap: p.namaLengkap,
                            kodePetani: p.kodePetani,
                            desaNama: p.desa.nama,
                            kecamatanNama: p.desa.kecamatan.nama,
                            kelompokNama: p.kelompokTani?.nama ?? null,
                            kelompokKode: p.kelompokTani?.kode ?? null,
                            penginput: p.createdBy.fullName ?? p.createdBy.username,
                        }))}
                        allIds={allIds.map((a) => a.id)}
                        isAdmin={isAdmin}
                        sort={sort}
                        dir={dir}
                        sortParams={sortParams}
                    />

                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <span>{total} data - halaman {pageNum} dari {totalPages}</span>
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