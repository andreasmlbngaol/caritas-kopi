// app/(main)/desa/yes-no.tsx
"use client";

import { useState, type ReactNode } from "react";
import { inputCls } from "./ui";

function Segmented({
                       name, value, onChange, labels = ["Ya", "Tidak"],
                   }: {
    name: string;
    value: boolean;
    onChange: (v: boolean) => void;
    labels?: [string, string];
}) {
    return (
        <>
            <input type="hidden" name={name} value={String(value)} />
            <div data-segmented className="inline-flex shrink-0 rounded-xl bg-gray-100 p-1 ring-1 ring-inset ring-gray-200">
                {[true, false].map((v, i) => (
                    <button
                        key={String(v)}
                        type="button"
                        onClick={() => onChange(v)}
                        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                            value === v
                                ? v
                                    ? "bg-jade-800 text-white shadow-sm"
                                    : "bg-gray-900 text-white shadow-sm"
                                : "text-gray-500 hover:text-gray-900"
                        }`}
                    >
                        {labels[i]}
                    </button>
                ))}
            </div>
        </>
    );
}

// Untuk bagian E — textfield reveal saat "Ya"
export function YesNoField({
                               name, label, revealName, revealPlaceholder, defaultValue = false, revealDefault,
                           }: {
    name: string;
    label: string;
    revealName?: string;
    revealPlaceholder?: string;
    defaultValue?: boolean;    // ← untuk prefill edit
    revealDefault?: string;    // ← untuk prefill textfield lokasi
}) {
    const [value, setValue] = useState(defaultValue);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200">
                <span className="text-sm text-gray-700">{label}</span>
                <Segmented name={name} value={value} onChange={setValue} />
            </div>
            {value && revealName && (
                <input
                    name={revealName}
                    placeholder={revealPlaceholder}
                    defaultValue={revealDefault}
                    autoFocus={!revealDefault}
                    className={inputCls}
                />
            )}
        </div>
    );
}

// Untuk bagian B — baris: label | Ada/Tidak | keterangan
export function YesNoRow({
                             name, label, labels, children, defaultValue = false,
                         }: {
    name: string;
    label: string;
    labels?: [string, string];
    children?: ReactNode;
    defaultValue?: boolean;    // ← untuk prefill edit
}) {
    const [value, setValue] = useState(defaultValue);  // ← bukan useState(false)
    return (
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <span className="text-sm text-gray-700">{label}</span>
            <Segmented name={name} value={value} onChange={setValue} labels={labels} />
            {children}
        </div>
    );
}