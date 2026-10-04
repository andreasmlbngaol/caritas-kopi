// app/(main)/desa/month-range.tsx
"use client";

import {useEffect, useState} from "react";
import { ChevronDown } from "lucide-react";
import { inputCls } from "./ui";

export const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function MonthSelect({
                         value, onChange, placeholder, disabledSet,
                     }: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    disabledSet?: Set<string>;
}) {
    return (
        <div className="relative flex-1">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${inputCls} appearance-none pr-8 ${value ? "" : "text-gray-400"}`}
            >
                <option value="">{placeholder}</option>
                {BULAN.map((b) => (
                    <option key={b} value={b} disabled={disabledSet?.has(b)}>
                        {b}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
        </div>
    );
}

export function MonthRange({
                               name, label, onChange, defaultValue,
                           }: {
    name: string; label: string;
    onChange?: (range: { start: number; end: number } | null) => void;
    defaultValue?: string | null;                       // ← baru
}) {
    const parts = defaultValue?.split(" - ") ?? [];
    const p0 = parts[0] ?? "", p1 = parts[1] ?? "";
    const [dari, setDari] = useState(BULAN.includes(p0) ? p0 : "");
    const [sampai, setSampai] = useState(BULAN.includes(p1) ? p1 : "");

    useEffect(() => {
        if (dari && sampai) {
            onChange?.({ start: BULAN.indexOf(dari), end: BULAN.indexOf(sampai) });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function update(d: string, s: string) {
        setDari(d);
        setSampai(s);
        onChange?.(
            d && s ? { start: BULAN.indexOf(d), end: BULAN.indexOf(s) } : null
        );
    }

    return (
        <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">{label}</label>
            <input
                type="hidden"
                name={name}
                value={dari && sampai ? `${dari} - ${sampai}` : ""}
                data-label={label}
            />
            <div className="flex items-center gap-2">
                <MonthSelect value={dari} onChange={(v) => update(v, sampai)} placeholder="Dari" />
                <span className="text-gray-300">-</span>
                <MonthSelect value={sampai} onChange={(v) => update(dari, v)} placeholder="Sampai" />
            </div>
        </div>
    );
}