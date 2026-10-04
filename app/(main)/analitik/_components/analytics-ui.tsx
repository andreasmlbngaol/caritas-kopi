// app/(main)/analitik/_components/analytics-ui.tsx
import type { ReactNode } from "react";

const idNum = new Intl.NumberFormat("id-ID");
export const fmt = (v: number | null | undefined, digits = 0) =>
    v == null ? "-" : idNum.format(Number(v.toFixed?.(digits) ?? v));

// Kartu analitik standar.
export function ChartCard({
    title, desc, children, className = "",
}: {
    title: string; desc?: string; children: ReactNode; className?: string;
}) {
    return (
        <section className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 ${className}`}>
            <div className="mb-4">
                <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
                {desc && <p className="mt-0.5 text-xs text-gray-500">{desc}</p>}
            </div>
            {children}
        </section>
    );
}

// Angka besar (KPI). `highlight` = kartu solid warna utama (jade) untuk
// menandai angka terpenting di halaman - sisanya tetap putih.
export function StatTile({
    label, value, unit, hint, highlight = false,
}: {
    label: string; value: string | number; unit?: string; hint?: string; highlight?: boolean;
}) {
    return (
        <div className={`rounded-2xl p-5 shadow-sm ${
            highlight ? "bg-jade-800 text-white" : "bg-white ring-1 ring-gray-950/5"
        }`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${
                highlight ? "text-jade-200" : "text-gray-400"
            }`}>{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
                {typeof value === "number" ? idNum.format(value) : value}
                {unit && <span className={`ml-1 text-base font-medium ${highlight ? "text-jade-200" : "text-gray-400"}`}>{unit}</span>}
            </p>
            {hint && <p className={`mt-1 text-xs ${highlight ? "text-jade-100/80" : "text-gray-400"}`}>{hint}</p>}
        </div>
    );
}

// Meter satu rasio (0-100%).
export function Meter({ label, value, right }: { label: string; value: number; right?: string }) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div>
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-gray-700">{label}</span>
                <span className="shrink-0 font-medium tabular-nums text-gray-900">{right ?? `${fmt(pct)}%`}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-jade-50">
                <div className="h-full rounded-full bg-jade-600" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// Daftar peringkat berlabel: nomor + nama + bar + jumlah.
export function RankList({
    items, unit = "", max: maxOverride,
}: {
    items: { nama: string; jumlah: number }[];
    unit?: string;
    max?: number;
}) {
    if (items.length === 0) return <p className="text-sm text-gray-400">Tidak ada data.</p>;
    const max = maxOverride ?? Math.max(...items.map((i) => i.jumlah), 1);
    return (
        <ol className="space-y-3">
            {items.map((i, idx) => (
                <li key={i.nama} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jade-50 text-[11px] font-semibold text-jade-800">
                        {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-gray-700">{i.nama}</span>
                            <span className="shrink-0 font-medium tabular-nums text-gray-900">
                                {fmt(i.jumlah)}{unit && <span className="ml-0.5 text-xs font-normal text-gray-400">{unit}</span>}
                            </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-jade-600" style={{ width: `${(i.jumlah / max) * 100}%` }} />
                        </div>
                    </div>
                </li>
            ))}
        </ol>
    );
}
