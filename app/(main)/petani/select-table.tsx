// app/(main)/petani/select-table.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, FileDown, Pencil, Loader2, Download, X } from "lucide-react";
import { SortHeader, type SortDir } from "../_components/sort";
import { DeleteButton } from "./delete-button";

export type PetaniRow = {
    id: string;
    namaLengkap: string;
    kodePetani: string | null;
    desaNama: string;
    kecamatanNama: string;
    kelompokNama: string | null;
    kelompokKode: string | null;
    penginput: string;
};

export function PetaniSelectTable({
    rows,
    allIds,
    sort,
    dir,
    sortParams,
}: {
    rows: PetaniRow[];
    allIds: string[];
    sort: string;
    dir: SortDir;
    sortParams: Record<string, string>;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);

    const allFilteredSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
    const someSelected = selected.size > 0 && !allFilteredSelected;

    function toggleAll() {
        setSelected(allFilteredSelected ? new Set() : new Set(allIds));
    }

    function toggleOne(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function exportZip() {
        const ids = [...selected];
        if (ids.length === 0) return;
        setBusy(true);
        try {
            const res = await fetch("/petani/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) {
                alert("Gagal membuat file: " + (await res.text()));
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Data Petani.zip";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } finally {
            setBusy(false);
        }
    }

    const count = selected.size;

    return (
        <>
            {count > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-jade-800 px-4 py-3 text-white">
                    <span className="text-sm font-medium">{count} petani dipilih</span>
                    <div className="ml-auto flex items-center gap-2">
                        <button
                            type="button"
                            onClick={exportZip}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-medium transition-colors hover:bg-white/25 disabled:opacity-60"
                        >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            {busy ? "Menyiapkan…" : "Export PDF (ZIP)"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelected(new Set())}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-jade-100 transition-colors hover:bg-white/10"
                        >
                            <X size={14} /> Bersihkan
                        </button>
                    </div>
                </div>
            )}

            <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                <table className="w-full min-w-[760px] text-sm">
                    <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <th className="w-10 px-5 py-3.5">
                            <input
                                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                type="checkbox"
                                checked={allFilteredSelected}
                                onChange={toggleAll}
                                aria-label="Pilih semua hasil filter"
                                className="h-4 w-4 rounded border-gray-300 accent-jade-800"
                            />
                        </th>
                        <SortHeader column="namaLengkap" label="Nama" sort={sort} dir={dir} params={sortParams} basePath="/petani" />
                        <SortHeader column="kodePetani" label="Kode Petani" sort={sort} dir={dir} params={sortParams} basePath="/petani" />
                        <SortHeader column="desa.nama" label="Desa" sort={sort} dir={dir} params={sortParams} basePath="/petani" />
                        <SortHeader column="kelompokTani.nama" label="Kelompok" sort={sort} dir={dir} params={sortParams} basePath="/petani" />
                        <SortHeader column="createdBy.fullName" label="Penginput" sort={sort} dir={dir} params={sortParams} basePath="/petani" />
                        <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {rows.map((p) => (
                        <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                            <td className="px-5 py-3.5">
                                <input
                                    type="checkbox"
                                    checked={selected.has(p.id)}
                                    onChange={() => toggleOne(p.id)}
                                    aria-label={`Pilih ${p.namaLengkap}`}
                                    className="h-4 w-4 rounded border-gray-300 accent-jade-800"
                                />
                            </td>
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
                                {p.desaNama}
                                <span className="block text-xs text-gray-500">Kec. {p.kecamatanNama}</span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">
                                {p.kelompokNama ?? "-"}
                                {p.kelompokKode && <span className="block text-xs text-gray-500">{p.kelompokKode}</span>}
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">{p.penginput}</td>
                            <td className="px-5 py-3.5">
                                <div className="flex items-center justify-end gap-1">
                                    <a
                                        href={`/petani/${p.id}/export/pdf`}
                                        title="Unduh PDF"
                                        aria-label={`Unduh PDF ${p.namaLengkap}`}
                                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                                    >
                                        <FileDown size={16} />
                                    </a>
                                    <a
                                        href={`/petani/${p.id}/export/docx`}
                                        title="Unduh Word"
                                        aria-label={`Unduh Word ${p.namaLengkap}`}
                                        className="rounded-lg p-2 text-blue-500 transition-colors hover:bg-blue-50"
                                    >
                                        <FileText size={16} />
                                    </a>
                                    <Link
                                        href={`/petani/${p.id}/edit`}
                                        title="Edit"
                                        aria-label={`Edit ${p.namaLengkap}`}
                                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-jade-800"
                                    >
                                        <Pencil size={16} />
                                    </Link>
                                    <DeleteButton id={p.id} nama={p.namaLengkap} />
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
