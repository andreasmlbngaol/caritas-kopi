// app/(main)/petani/produk-fields.tsx
"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Segmented, YesNoRow } from "../_components/yes-no";
import { inputCls } from "../_components/ui";
import { PRODUK } from "./constants";

const blankNum = (v: number | null | undefined) => (v == null || v === 0 ? "" : v);
const blankStr = (v: string | null | undefined) => (v == null || v === "-" ? "" : v);

export type ProdukDefaults = {
    jenis: string;
    labelCustom: string | null;
    dijual: boolean;
    volumeKgTahun: number | null;
}[];

type CustomRow = {
    key: string;
    defaults?: { nama: string; dijual: boolean; volume: number | null };
};

let counter = 0;
const nextKey = () => `pd${++counter}`;

// Baris "Lainnya" sebagai kartu berlabel
function LainnyaCard({
                         index, entry, onRemove,
                     }: {
    index: number; entry: CustomRow; onRemove: () => void;
}) {
    const [dijual, setDijual] = useState(entry.defaults?.dijual ? "true" : "false");
    return (
        <div className="rounded-xl bg-gray-50/60 p-4 ring-1 ring-inset ring-gray-200">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Produk Lainnya {index + 1}</span>
                <button
                    type="button" onClick={onRemove} title="Hapus"
                    className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <X size={14} />
                </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <div>
                    <label htmlFor={`pdl_${index}_nama`} className="mb-1 block text-xs font-medium text-gray-600">
                        Jenis Produk
                    </label>
                    <input
                        id={`pdl_${index}_nama`} name={`pdl_${index}_nama`}
                        placeholder="mis. Kopi luwak" data-label={`Jenis produk lainnya ${index + 1}`}
                        defaultValue={blankStr(entry.defaults?.nama)} className={inputCls}
                    />
                </div>
                <div>
                    <span className="mb-1 block text-xs font-medium text-gray-600">Dijual?</span>
                    <Segmented
                        name={`pdl_${index}_dijual`} value={dijual}
                        options={[{ value: "true", label: "Ya" }, { value: "false", label: "Tidak" }]}
                        onChange={setDijual}
                    />
                </div>
                <div>
                    <label htmlFor={`pdl_${index}_vol`} className="mb-1 block text-xs font-medium text-gray-600">
                        Volume (kg/tahun)
                    </label>
                    <input
                        id={`pdl_${index}_vol`} name={`pdl_${index}_vol`}
                        type="number" step="any" min={0} inputMode="decimal"
                        data-requires={`pdl_${index}_dijual`} data-label={`Volume produk lainnya ${index + 1}`}
                        defaultValue={blankNum(entry.defaults?.volume)} className={inputCls}
                    />
                </div>
            </div>
        </div>
    );
}

export function ProdukFields({ defaults }: { defaults?: ProdukDefaults }) {
    const fixed = (jenis: string) => defaults?.find((d) => d.jenis === jenis);

    const [lainnya, setLainnya] = useState<CustomRow[]>(() => {
        const custom = defaults?.filter((d) => d.jenis === "LAINNYA") ?? [];
        return custom.map((d) => ({
            key: nextKey(),
            defaults: { nama: d.labelCustom ?? "", dijual: d.dijual, volume: d.volumeKgTahun },
        }));
    });

    return (
        <div className="space-y-3">
            {PRODUK.map((p) => (
                <YesNoRow
                    key={p.jenis} name={`pd_${p.jenis}`} label={p.label}
                    defaultValue={fixed(p.jenis)?.dijual ?? false}
                >
                    <div>
                        <label htmlFor={`pd_${p.jenis}_vol`} className="mb-1 block text-[11px] text-gray-500">
                            Volume (kg/tahun)
                        </label>
                        <input
                            id={`pd_${p.jenis}_vol`} name={`pd_${p.jenis}_vol`}
                            type="number" step="any" min={0} inputMode="decimal"
                            data-requires={`pd_${p.jenis}`} data-label={`Volume ${p.label}`}
                            defaultValue={blankNum(fixed(p.jenis)?.volumeKgTahun)} className={inputCls}
                        />
                    </div>
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
                    <Plus size={13} /> Tambah Produk Lainnya
                </button>
            </div>
        </div>
    );
}