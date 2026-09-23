// app/(main)/desa/musim-fields.tsx
"use client";

import { useState } from "react";
import { MonthRange } from "./month-range";

type Range = { start: number; end: number };

// Rentang melingkar (Nov–Mar) → expand jadi daftar indeks bulan
function expand(r: Range): number[] {
    const out: number[] = [];
    for (let i = r.start; ; i = (i + 1) % 12) {
        out.push(i);
        if (i === r.end) break;
    }
    return out;
}

export function MusimFields({
                                defaultHujan, defaultKering,
                            }: {
    defaultHujan?: string | null; defaultKering?: string | null;
}) {
    const [hujan, setHujan] = useState<Range | null>(null);
    const [kering, setKering] = useState<Range | null>(null);

    const overlap =
        hujan && kering
            ? expand(hujan).some((m) => expand(kering).includes(m))
            : false;

    return (
        <>
            <MonthRange name="bulanHujan" label="Bulan Hujan" onChange={setHujan} defaultValue={defaultHujan} />
            <MonthRange name="bulanKering" label="Bulan Kering" onChange={setKering} defaultValue={defaultKering} />
            {overlap && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 sm:col-span-2 lg:col-span-3">
                    Rentang bulan hujan dan bulan kering tidak boleh beririsan — periksa kembali.
                </p>
            )}
        </>
    );
}