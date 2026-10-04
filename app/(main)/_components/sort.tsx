// app/(main)/_components/sort.tsx
// Header kolom tabel yang bisa diklik untuk sorting (server component, murni <Link>).
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

export type SortDir = "asc" | "desc";

// Ubah "desa.nama" + arah jadi objek orderBy Prisma: { desa: { nama: dir } }.
// Tipe target (mis. Prisma.PetaniOrderByWithRelationInput) diberikan di call site.
export function nestedOrderBy<T>(sort: string, dir: SortDir): T {
    const [field, ...rest] = sort.split(".");
    if (rest.length === 0) return { [field]: dir } as T;
    const nested = rest.reduceRight<unknown>((acc, key) => ({ [key]: acc }), dir);
    return { [field]: nested } as T;
}

// Baca sort/dir dari searchParams; jatuh ke fallback bila tidak valid.
export function parseSort<T extends string>(
    params: { sort?: string; dir?: string },
    allowed: readonly T[],
    fallback: T,
    fallbackDir: SortDir = "asc",
): { sort: T; dir: SortDir } {
    const sort = (allowed as readonly string[]).includes(params.sort ?? "")
        ? (params.sort as T)
        : fallback;
    const dir: SortDir =
        params.dir === "asc" || params.dir === "desc" ? params.dir : fallbackDir;
    return { sort, dir };
}

export function SortHeader({
    column,
    label,
    sort,
    dir,
    params,
    basePath,
}: {
    column: string;
    label: string;
    sort: string;
    dir: SortDir;
    params: Record<string, string | undefined>;
    basePath: string;
}) {
    const active = sort === column;
    // Kolom aktif: klik = balik arah. Kolom lain: mulai dari asc.
    const nextDir: SortDir = active && dir === "asc" ? "desc" : "asc";

    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    qs.set("sort", column);
    qs.set("dir", nextDir);

    const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

    return (
        <th
            aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
            className="px-5 py-3.5"
        >
            <Link
                href={`${basePath}?${qs.toString()}`}
                className={`inline-flex items-center gap-1.5 transition-colors hover:text-gray-900 ${
                    active ? "text-gray-900" : ""
                }`}
            >
                {label}
                <Icon size={13} className={active ? "text-jade-800" : "text-gray-400"} aria-hidden />
            </Link>
        </th>
    );
}
