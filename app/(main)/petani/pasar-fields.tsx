// app/(main)/petani/pasar-fields.tsx
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Segmented, YesNoRow } from "../_components/yes-no";
import { inputCls } from "../_components/ui";
import { PASAR } from "./constants";

const blankNum = (v: number | null | undefined) => (v == null || v === 0 ? "" : v);
const blankStr = (v: string | null | undefined) => (v == null || v === "-" ? "" : v);

export type PasarDefaults = {
    kategori: string;
    labelCustom: string | null;
    aktif: boolean;
    persentase: number | null;
    profilPenjual: string | null;
}[];

type CustomRow = {
    key: string;
    defaults?: { nama: string; aktif: boolean; persentase: number | null; profil: string | null };
};

let counter = 0;
const nextKey = () => `ps${++counter}`;

// Dua input berlabel di kolom kanan baris tetap
function PasarInputs({ kategori, defaults }: { kategori: string; defaults?: { persentase: number | null; profilPenjual: string | null } }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            <div>
                <label htmlFor={`ps_${kategori}_persen`} className="mb-1 block text-[11px] text-gray-500">
                    Persentase (%)
                </label>
                <input
                    id={`ps_${kategori}_persen`} name={`ps_${kategori}_persen`}
                    type="number" step="any" min={0} inputMode="decimal"
                    data-requires={`ps_${kategori}`} data-label="Persentase"
                    defaultValue={blankNum(defaults?.persentase)} className={inputCls}
                />
            </div>
            <div>
                <label htmlFor={`ps_${kategori}_profil`} className="mb-1 block text-[11px] text-gray-500">
                    Profil Penjual
                </label>
                <input
                    id={`ps_${kategori}_profil`} name={`ps_${kategori}_profil`}
                    placeholder="pengepul, pabrik, ekspor…"
                    data-requires={`ps_${kategori}`} data-label="Profil Penjual"
                    defaultValue={blankStr(defaults?.profilPenjual)} className={inputCls}
                />
            </div>
        </div>
    );
}

// Baris "Lainnya" sebagai kartu berlabel
function LainnyaCard({
                         index, entry, onRemove,
                     }: {
    index: number; entry: CustomRow; onRemove: () => void;
}) {
    const [aktif, setAktif] = useState(entry.defaults?.aktif ? "true" : "false");
    return (
        <div className="rounded-xl bg-gray-50/60 p-4 ring-1 ring-inset ring-gray-200">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Pasar Lainnya {index + 1}</span>
                <button
                    type="button" onClick={onRemove} title="Hapus"
                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <X size={14} />
                </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <div>
                    <label htmlFor={`psl_${index}_nama`} className="mb-1 block text-xs font-medium text-gray-600">
                        Kategori Pasar
                    </label>
                    <input
                        id={`psl_${index}_nama`} name={`psl_${index}_nama`}
                        placeholder="mis. Pasar lokal" data-label={`Kategori pasar lainnya ${index + 1}`}
                        defaultValue={blankStr(entry.defaults?.nama)} className={inputCls}
                    />
                </div>
                <div>
                    <span className="mb-1 block text-xs font-medium text-gray-600">Aktif?</span>
                    <Segmented
                        name={`psl_${index}_aktif`} value={aktif}
                        options={[{ value: "true", label: "Ya" }, { value: "false", label: "Tidak" }]}
                        onChange={setAktif}
                    />
                </div>
                <div>
                    <label htmlFor={`psl_${index}_persen`} className="mb-1 block text-xs font-medium text-gray-600">
                        Persentase (%)
                    </label>
                    <input
                        id={`psl_${index}_persen`} name={`psl_${index}_persen`}
                        type="number" step="any" min={0} inputMode="decimal"
                        data-requires={`psl_${index}_aktif`} data-label={`Persentase pasar lainnya ${index + 1}`}
                        defaultValue={blankNum(entry.defaults?.persentase)} className={inputCls}
                    />
                </div>
                <div>
                    <label htmlFor={`psl_${index}_profil`} className="mb-1 block text-xs font-medium text-gray-600">
                        Profil Penjual
                    </label>
                    <input
                        id={`psl_${index}_profil`} name={`psl_${index}_profil`}
                        placeholder="pengepul, pabrik, ekspor…"
                        data-requires={`psl_${index}_aktif`} data-label={`Profil penjual pasar lainnya ${index + 1}`}
                        defaultValue={blankStr(entry.defaults?.profil)} className={inputCls}
                    />
                </div>
            </div>
        </div>
    );
}

export function PasarFields({ defaults }: { defaults?: PasarDefaults }) {
    const fixed = (kategori: string) => defaults?.find((d) => d.kategori === kategori);

    const [lainnya, setLainnya] = useState<CustomRow[]>(() => {
        const custom = defaults?.filter((d) => d.kategori === "LAINNYA") ?? [];
        return custom.map((d) => ({
            key: nextKey(),
            defaults: {
                nama: d.labelCustom ?? "",
                aktif: d.aktif,
                persentase: d.persentase,
                profil: d.profilPenjual,
            },
        }));
    });

    return (
        <div className="space-y-3">
            {PASAR.map((p) => (
                <YesNoRow
                    key={p.kategori} name={`ps_${p.kategori}`} label={p.label}
                    defaultValue={fixed(p.kategori)?.aktif ?? false}
                >
                    <PasarInputs kategori={p.kategori} defaults={fixed(p.kategori)} />
                </YesNoRow>
            ))}

            {lainnya.map((e, i) => (
                <LainnyaCard
                    key={e.key} index={i} entry={e}
                    onRemove={() => setLainnya((s) => s.filter((x) => x.key !== e.key))}
                />
            ))}

            <div>
                <button
                    type="button"
                    onClick={() => setLainnya((s) => [...s, { key: nextKey() }])}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50"
                >
                    <Plus size={13} /> Tambah Pasar Lainnya
                </button>
            </div>
        </div>
    );
}