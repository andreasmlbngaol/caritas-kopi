// app/(main)/_components/date-picker.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { BULAN_ID } from "../petani/constants";

const HARI = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"]; // Senin pertama
const HARI_PENUH = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// "2026-06-15" → { y, m, d } lokal (tanpa masalah timezone)
function parseISO(v: string): { y: number; m: number; d: number } | null {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Indeks hari dalam seminggu, Senin = 0
const dayIdx = (y: number, m: number, d: number) => (new Date(y, m, d).getDay() + 6) % 7;

export function DatePicker({
                               name,
                               label,
                               required,
                               defaultValue,
                               yearRange,
                               placeholder = "Pilih tanggal…",
                           }: {
    name: string;
    label: string;
    required?: boolean;
    defaultValue?: string; // "YYYY-MM-DD"
    yearRange?: [number, number]; // bila diisi → dropdown tahun muncul
    placeholder?: string;
}) {
    const today = new Date();
    const parsed = defaultValue ? parseISO(defaultValue) : null;

    const [value, setValue] = useState(defaultValue ?? "");
    const [open, setOpen] = useState(false);
    const [view, setView] = useState({
        y: parsed?.y ?? today.getFullYear(),
        m: parsed?.m ?? today.getMonth(),
    });
    const ref = useRef<HTMLDivElement>(null);

    // Tutup saat klik di luar
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    function pick(d: number) {
        const iso = toISO(view.y, view.m, d);
        setValue(iso);
        setOpen(false);
    }

    function prevMonth() {
        setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { ...v, m: v.m - 1 }));
    }
    function nextMonth() {
        setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { ...v, m: v.m + 1 }));
    }

    const selected = value ? parseISO(value) : null;
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const firstOffset = dayIdx(view.y, view.m, 1);

    const isToday = (d: number) =>
        view.y === today.getFullYear() && view.m === today.getMonth() && d === today.getDate();
    const isSelected = (d: number) =>
        selected !== null && selected.y === view.y && selected.m === view.m && selected.d === d;

    const display = selected
        ? `${HARI_PENUH[dayIdx(selected.y, selected.m, selected.d)]}, ${selected.d} ${BULAN_ID[selected.m]} ${selected.y}`
        : "";

    const years: number[] = [];
    if (yearRange) {
        for (let y = yearRange[1]; y >= yearRange[0]; y--) years.push(y);
    }

    return (
        <div ref={ref} className="relative">
            <label htmlFor={`dp_${name}`} className="mb-1.5 block text-xs font-medium text-gray-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="hidden" name={name} value={value}
                data-label={label}
                data-required={required ? "" : undefined}
            />
            <div className="relative">
                <button
                    type="button"
                    id={`dp_${name}`}
                    onClick={() => setOpen((o) => !o)}
                    className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-left text-sm ring-1 ring-inset ring-gray-300 outline-none transition focus:ring-2 focus:ring-inset focus:ring-jade-700"
                >
                    <span className={display ? "text-gray-900" : "text-gray-500"}>
                        {display || placeholder}
                    </span>
                    <Calendar size={15} className="shrink-0 text-gray-500" />
                </button>
                {value && !required && (
                    <button
                        type="button"
                        title="Hapus tanggal"
                        onClick={() => setValue("")}
                        className="absolute right-9 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-300 transition-colors hover:text-gray-500"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {open && (
                <div className="absolute z-50 mt-1.5 w-72 rounded-xl bg-white p-3 shadow-lg ring-1 ring-gray-950/5">
                    {/* Header: navigasi bulan + dropdown tahun */}
                    <div className="mb-2 flex items-center justify-between gap-1">
                        <button
                            type="button" onClick={prevMonth}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            <div className="relative">
                                <select
                                    value={view.m}
                                    onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}
                                    className="select-flat cursor-pointer appearance-none rounded-md bg-transparent py-0.5 pl-1.5 pr-5 text-sm font-semibold text-gray-900 outline-none hover:bg-gray-100"
                                >
                                    {BULAN_ID.map((nama, i) => (
                                        <option key={nama} value={i}>{nama}</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-500" />
                            </div>
                            {yearRange ? (
                                <div className="relative">
                                    <select
                                        value={view.y}
                                        onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
                                        className="select-flat cursor-pointer appearance-none rounded-md bg-transparent py-0.5 pl-1.5 pr-5 text-sm font-semibold text-gray-900 outline-none hover:bg-gray-100"
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={12} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-500" />
                                </div>
                            ) : (
                                <span className="text-sm font-semibold text-gray-900">{view.y}</span>
                            )}
                        </div>
                        <button
                            type="button" onClick={nextMonth}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Nama hari */}
                    <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-gray-500">
                        {HARI.map((h) => (
                            <span key={h} className="py-1">{h}</span>
                        ))}
                    </div>

                    {/* Grid tanggal */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: firstOffset }).map((_, i) => (
                            <span key={`x${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const d = i + 1;
                            return (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => pick(d)}
                                    className={`rounded-lg py-1.5 text-sm transition-colors ${
                                        isSelected(d)
                                            ? "bg-jade-800 font-semibold text-white"
                                            : isToday(d)
                                                ? "bg-jade-50 font-medium text-jade-800"
                                                : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {d}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-2 flex justify-between border-t border-gray-100 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                const iso = toISO(today.getFullYear(), today.getMonth(), today.getDate());
                                setValue(iso);
                                setView({ y: today.getFullYear(), m: today.getMonth() });
                                setOpen(false);
                            }}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-jade-700 transition-colors hover:bg-jade-50"
                        >
                            Hari ini
                        </button>
                        {!required && value && (
                            <button
                                type="button"
                                onClick={() => { setValue(""); setOpen(false); }}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
                            >
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}