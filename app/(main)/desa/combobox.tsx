// app/(main)/desa/combobox.tsx
"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { inputCls } from "./ui";

type Option = { value: string; label: string };

export function Combobox({
                             name, label, placeholder = "Pilih…", options, value, onChange, disabled, required,
                         }: {
    name?: string;
    label?: string;
    placeholder?: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean; // ← BARU
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [hi, setHi] = useState(0);

    const selected = options.find((o) => o.value === value);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const all = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
        return all.slice(0, 100);
    }, [options, query]);

    function pick(opt: Option) {
        onChange(opt.value);
        setOpen(false);
        setQuery("");
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            if (open && filtered[hi]) pick(filtered[hi]);
            else setOpen(true);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) setOpen(true);
            else setHi((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
        } else if (e.key === "Escape" || e.key === "Tab") {
            setOpen(false);
        }
    }

    return (
        <div className="relative">
            {label && (
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    {label} {required && <span className="text-red-500">*</span>}  {/* ← BARU: asterisk */}
                </label>
            )}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value}
                    data-label={label}                              // ← BARU
                    data-required={required ? "" : undefined}       // ← BARU
                />
            )}

            <div className="relative">
                <input
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    value={open ? query : selected?.label ?? ""}
                    placeholder={open ? "Ketik untuk mencari…" : placeholder}
                    onFocus={() => { setOpen(true); setQuery(""); setHi(0); }}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); setHi(0); }}
                    onKeyDown={onKeyDown}
                    className={`${inputCls} pr-9`}
                />
                <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
            </div>

            {open && !disabled && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl bg-white p-1 shadow-lg ring-1 ring-gray-950/5">
                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</p>
                        ) : (
                            filtered.map((o, i) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => pick(o)}
                                    onMouseEnter={() => setHi(i)}
                                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                                        i === hi ? "bg-gray-100" : ""
                                    } ${o.value === value ? "font-medium text-jade-800" : "text-gray-700"}`}
                                >
                                    <span className="truncate">{o.label}</span>
                                    {o.value === value && <Check size={14} className="shrink-0 text-jade-700" />}
                                </button>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}