// app/(main)/petani/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Data Petani" };

import type { ReactNode } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { pageWide } from "../layout-cls";
import { parseSort, nestedOrderBy } from "../_components/sort";
import { PetaniSelectTable } from "./select-table";

const PER_PAGE_OPTIONS = [10, 20, 40] as const;
const DEFAULT_PER_PAGE = 20;

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
    searchParams: Promise<{
        q?: string; page?: string; sort?: string; dir?: string;
        wilayah?: string; penginput?: string; perPage?: string;
    }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "ADMIN";
    const sp = await searchParams;
    const { q = "", page = "1", wilayah = "", penginput = "" } = sp;
    // Satu filter wilayah: hanya boleh desa ATAU kelompok tani.
    const desaFilter = wilayah.startsWith("desa:") ? wilayah.slice(5) : "";
    const kelompokFilter = wilayah.startsWith("kelompok:") ? wilayah.slice(9) : "";
    const requestedPerPage = Number(sp.perPage);
    const perPage = PER_PAGE_OPTIONS.includes(requestedPerPage as (typeof PER_PAGE_OPTIONS)[number])
        ? requestedPerPage
        : DEFAULT_PER_PAGE;
    const { sort, dir } = parseSort(sp, SORT_COLUMNS, "namaLengkap");

    // Scope dasar: enumerator hanya data miliknya, admin seluruh data.
    const scope: Prisma.PetaniWhereInput = isAdmin ? {} : { createdById: session.user.id };
    const where: Prisma.PetaniWhereInput = {
        ...scope,
        ...(isAdmin && penginput ? { createdById: penginput } : {}),
        ...(desaFilter ? { desaKode: desaFilter } : {}),
        ...(kelompokFilter ? { kelompokTaniId: kelompokFilter } : {}),
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

    // Hitung total + opsi filter dulu agar nomor halaman bisa di-clamp.
    const [total, desaOptions, kelompokOptions, penginputOptions] = await Promise.all([
        prisma.petani.count({ where }),
        prisma.wilayahDesa.findMany({
            where: { petani: { some: scope } },
            select: { kode: true, nama: true, kecamatan: { select: { nama: true } } },
            orderBy: { nama: "asc" },
        }),
        prisma.kelompokTani.findMany({
            where: { petani: { some: scope } },
            select: { id: true, nama: true, kode: true, desa: { select: { nama: true } } },
            orderBy: { nama: "asc" },
        }),
        isAdmin
            ? prisma.user.findMany({
                where: { petani: { some: {} } },
                select: { id: true, fullName: true, username: true },
                orderBy: { fullName: "asc" },
            })
            : Promise.resolve([{
                id: session.user.id,
                fullName: session.user.name ?? "Saya",
                username: "",
            }]),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const pageNum = Math.min(Math.max(1, Number(page) || 1), totalPages);

    const [items, allIds] = await Promise.all([
        prisma.petani.findMany({
            where,
            orderBy: nestedOrderBy<Prisma.PetaniOrderByWithRelationInput>(sort, dir),
            skip: (pageNum - 1) * perPage,
            take: perPage,
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

    // Parameter yang harus ikut dipertahankan saat pindah halaman/sort.
    const filterParams: Record<string, string> = {
        perPage: String(perPage),
        ...(q ? { q } : {}),
        ...(wilayah ? { wilayah } : {}),
        ...(penginput ? { penginput } : {}),
    };
    const pageUrl = (p: number) =>
        `/petani?${new URLSearchParams({ ...filterParams, page: String(p) })}`;
    const sortParams: Record<string, string> = { ...filterParams };
    const hasQueryFilter = Boolean(q || wilayah || penginput);
    const hasFilter = hasQueryFilter || perPage !== DEFAULT_PER_PAGE;

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

            <form action="/petani" className="mt-6 space-y-3">
                <input type="hidden" name="sort" value={sort} />
                <input type="hidden" name="dir" value={dir} />
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            name="q" defaultValue={q} placeholder="Cari nama / kode petani / kode kelompok…"
                            className="w-full rounded-xl bg-white py-2.5 pl-10 pr-3 text-sm ring-1 ring-inset ring-gray-300 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-jade-700"
                        />
                    </div>

                    <div className="w-full sm:w-60">
                        <FilterSelect name="wilayah" value={wilayah} label="Filter desa atau kelompok tani">
                            <option value="">Semua wilayah</option>
                            <optgroup label="Desa">
                                {desaOptions.map((d) => (
                                    <option key={`desa:${d.kode}`} value={`desa:${d.kode}`}>
                                        {d.nama} - {d.kecamatan.nama}
                                    </option>
                                ))}
                            </optgroup>
                            <optgroup label="Kelompok Tani">
                                {kelompokOptions.map((k) => (
                                    <option key={`kelompok:${k.id}`} value={`kelompok:${k.id}`}>
                                        {k.nama}{k.kode ? ` (${k.kode})` : ""} - {k.desa.nama}
                                    </option>
                                ))}
                            </optgroup>
                        </FilterSelect>
                    </div>

                    <div className="w-full sm:w-44">
                        <FilterSelect name="penginput" value={penginput} label="Filter penginput">
                            <option value="">Semua penginput</option>
                            {penginputOptions.map((u) => (
                                <option key={u.id} value={u.id}>{u.fullName ?? u.username}</option>
                            ))}
                        </FilterSelect>
                    </div>

                    <div className="w-full sm:w-36">
                        <FilterSelect name="perPage" value={String(perPage)} label="Jumlah per halaman">
                            {PER_PAGE_OPTIONS.map((n) => (
                                <option key={n} value={n}>{n} / halaman</option>
                            ))}
                        </FilterSelect>
                    </div>

                    <button
                        type="submit"
                        className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                        Terapkan
                    </button>
                    {hasFilter && (
                        <Link
                            href="/petani"
                            className="rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900"
                        >
                            Reset
                        </Link>
                    )}
                </div>
            </form>

            {items.length === 0 ? (
                <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-950/5">
                    <p className="text-sm text-gray-500">
                        {hasQueryFilter ? "Tidak ada hasil untuk filter ini." : "Belum ada data. Mulai dengan tombol \"Input Data\"."}
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
                        sort={sort}
                        dir={dir}
                        sortParams={sortParams}
                    />

                    {totalPages > 1 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                            <span>{total} data - halaman {pageNum} dari {totalPages}</span>
                            <div className="flex items-center gap-2">
                                {pageNum > 1 ? (
                                    <Link href={pageUrl(pageNum - 1)} aria-label="Halaman sebelumnya" className="rounded-lg p-2 transition-colors hover:bg-white hover:text-gray-900">
                                        <ChevronLeft size={16} />
                                    </Link>
                                ) : (
                                    <span className="rounded-lg p-2 text-gray-300" aria-hidden>
                                        <ChevronLeft size={16} />
                                    </span>
                                )}

                                <form action="/petani" className="flex items-center gap-1.5">
                                    {Object.entries({ ...filterParams, sort, dir }).map(([key, value]) => (
                                        <input key={key} type="hidden" name={key} value={value} />
                                    ))}
                                    <label htmlFor="page" className="text-xs">Halaman</label>
                                    <input
                                        id="page" name="page" type="number" inputMode="numeric"
                                        min={1} max={totalPages} defaultValue={pageNum}
                                        className="w-16 rounded-lg bg-white px-2 py-1.5 text-center text-sm ring-1 ring-inset ring-gray-300 outline-none transition focus:ring-2 focus:ring-inset focus:ring-jade-700"
                                    />
                                    <span className="text-xs">/ {totalPages}</span>
                                    <button type="submit" className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800">
                                        Ke
                                    </button>
                                </form>

                                {pageNum < totalPages ? (
                                    <Link href={pageUrl(pageNum + 1)} aria-label="Halaman berikutnya" className="rounded-lg p-2 transition-colors hover:bg-white hover:text-gray-900">
                                        <ChevronRight size={16} />
                                    </Link>
                                ) : (
                                    <span className="rounded-lg p-2 text-gray-300" aria-hidden>
                                        <ChevronRight size={16} />
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}

function FilterSelect({
    name, value, label, children,
}: {
    name: string; value: string; label: string; children: ReactNode;
}) {
    return (
        <div className="relative">
            <select
                name={name}
                defaultValue={value}
                aria-label={label}
                className="w-full appearance-none rounded-xl bg-white py-2.5 pl-3 pr-9 text-sm ring-1 ring-inset ring-gray-300 outline-none transition focus:ring-2 focus:ring-inset focus:ring-jade-700"
            >
                {children}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>
    );
}
