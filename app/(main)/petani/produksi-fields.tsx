// app/(main)/petani/produksi-fields.tsx
"use client";

import { useState } from "react";
import { inputCls } from "../_components/ui";
import { SATUAN_PRODUKSI, TAHUN_ESTIMASI, TAHUN_PRODUKSI } from "./constants";

const blankNum = (v: number | null | undefined) => (v == null || v === 0 ? "" : v);
const idNum = new Intl.NumberFormat("id-ID");

export type ProduksiDefaults = {
    tahun: number;
    satuan: string | null;
    cherry: number | null;
    gabahBasah: number | null;
    gabahKering: number | null;
    greenBean: number | null;
    produktivitas: number | null;
}[];

function YearCard({ tahun, d }: { tahun: number; d?: ProduksiDefaults[number] }) {
    const [vals, setVals] = useState({
        cherry: d?.cherry ?? 0,
        gabahBasah: d?.gabahBasah ?? 0,
        gabahKering: d?.gabahKering ?? 0,
        greenBean: d?.greenBean ?? 0,
    });

    const total = vals.cherry + vals.gabahBasah + vals.gabahKering + vals.greenBean;

    function numField(f: keyof typeof vals, label: string) {
        const nm = `prod_${tahun}_${f}`;
        return (
            <div>
                <label htmlFor={nm} className="mb-1 block text-xs font-medium text-gray-600">
                    {label}
                </label>
                <input
                    id={nm} name={nm} type="number" step="any" min={0} inputMode="decimal"
                    data-label={label}
                    defaultValue={blankNum(vals[f])}
                    onChange={(e) => setVals((v) => ({ ...v, [f]: Number(e.target.value) || 0 }))}
                    className={inputCls}
                />
            </div>
        );
    }

    return (
        <div
            data-group={`Produksi ${tahun}`}
            className="rounded-xl bg-gray-50/60 p-4 ring-1 ring-inset ring-gray-200"
        >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {tahun}
                {tahun === TAHUN_ESTIMASI && (
                    <span className="ml-1.5 font-normal normal-case text-gray-400">(estimasi)</span>
                )}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                    <label htmlFor={`prod_${tahun}_satuan`} className="mb-1 block text-xs font-medium text-gray-600">
                        Satuan
                    </label>
                    <select
                        id={`prod_${tahun}_satuan`} name={`prod_${tahun}_satuan`}
                        data-label="Satuan" defaultValue={d?.satuan ?? "KG"} className={inputCls}
                    >
                        {SATUAN_PRODUKSI.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
                {numField("cherry", "Cherry")}
                {numField("gabahBasah", "Gabah Basah / Labu")}
                {numField("gabahKering", "Gabah Kering")}
                {numField("greenBean", "Green Bean")}
                <div>
                    <span className="mb-1 block text-xs font-medium text-gray-600">
                        Produktivitas (otomatis)
                    </span>
                    <div
                        aria-live="polite"
                        className="flex h-[42px] items-center rounded-xl bg-jade-50 px-3 text-sm font-semibold text-jade-800 ring-1 ring-inset ring-jade-200"
                    >
                        {idNum.format(total)}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">Total 4 kolom sebelumnya</p>
                </div>
            </div>
        </div>
    );
}

export function ProduksiFields({ defaults }: { defaults?: ProduksiDefaults }) {
    const find = (tahun: number) => defaults?.find((x) => x.tahun === tahun);
    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {TAHUN_PRODUKSI.map((tahun) => (
                <YearCard key={tahun} tahun={tahun} d={find(tahun)} />
            ))}
        </div>
    );
}