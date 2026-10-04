// app/(main)/_components/yes-no.tsx
"use client";

import { useState, type ReactNode } from "react";
import { inputCls } from "./ui";

type SegmentedOption = { value: string; label: string };

export function Segmented({
                              name,
                              value,
                              options,
                              onChange,
                              clearable = false,
                          }: {
    name: string;
    value: string; // "" = tidak terpilih
    options: SegmentedOption[];
    onChange: (v: string) => void;
    clearable?: boolean; // true → klik opsi aktif lagi untuk batal pilih (nilai jadi "")
}) {
    return (
        <>
            <input
                type="hidden"
                name={name}
                value={value}
                data-skip-check={clearable ? "" : undefined}
            />
            <div data-segmented className="inline-flex shrink-0 rounded-xl bg-gray-100 p-1 ring-1 ring-inset ring-gray-200">
                {options.map((o, i) => {
                    const active = value === o.value;
                    return (
                        <button
                            key={o.value}
                            type="button"
                            onClick={() => onChange(clearable && active ? "" : o.value)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                                active
                                    ? i === 0
                                        ? "bg-jade-800 text-white shadow-sm"
                                        : "bg-gray-900 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            {o.label}
                        </button>
                    );
                })}
            </div>
        </>
    );
}

// Untuk bagian E desa - textfield reveal saat "Ya"
export function YesNoField({
                               name, label, revealName, revealPlaceholder, defaultValue = false, revealDefault,
                           }: {
    name: string;
    label: string;
    revealName?: string;
    revealPlaceholder?: string;
    defaultValue?: boolean;
    revealDefault?: string;
}) {
    const [value, setValue] = useState(defaultValue);
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-inset ring-gray-200">
                <span className="text-sm text-gray-700">{label}</span>
                <Segmented
                    name={name}
                    value={String(value)}
                    options={[{ value: "true", label: "Ya" }, { value: "false", label: "Tidak" }]}
                    onChange={(v) => setValue(v === "true")}
                />
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

// Untuk bagian B desa / F petani - baris: label | segmented | keterangan
export function YesNoRow({
                             name, label, labels, children, defaultValue = false,
                         }: {
    name: string;
    label: string;
    labels?: [string, string];
    children?: ReactNode;
    defaultValue?: boolean;
}) {
    const [value, setValue] = useState(defaultValue);
    const [l1, l2] = labels ?? ["Ya", "Tidak"];
    return (
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <span className="text-sm text-gray-700">{label}</span>
            <Segmented
                name={name}
                value={String(value)}
                options={[{ value: "true", label: l1 }, { value: "false", label: l2 }]}
                onChange={(v) => setValue(v === "true")}
            />
            {children}
        </div>
    );
}