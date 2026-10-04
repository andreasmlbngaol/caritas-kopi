// app/(main)/analitik/_components/charts.tsx
"use client";

import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    LineChart, Line, PieChart, Pie, Legend,
} from "recharts";
import { ACCENT, GRID, AXIS, MUTED, INK, SERIES } from "./palette";

const idNum = new Intl.NumberFormat("id-ID");
const fmtNum = (v: unknown) => (typeof v === "number" ? idNum.format(v) : String(v ?? ""));

const tooltipStyle = {
    borderRadius: 12,
    border: "1px solid rgba(11,11,11,0.10)",
    boxShadow: "0 6px 20px rgba(11,11,11,0.08)",
    fontSize: 12,
    padding: "8px 12px",
    backgroundColor: "#ffffff",
};

// ---------- Kolom vertikal (magnitudo, satu seri) ----------
export function BarChartX({
    data, xKey, yKey, height = 280, unit = "", color = ACCENT, valueLabel = "Nilai",
}: {
    data: Record<string, unknown>[];
    xKey: string; yKey: string; height?: number; unit?: string;
    color?: string; valueLabel?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey={xKey} tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={56} />
                <Tooltip
                    cursor={{ fill: "rgba(31,138,100,0.06)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, valueLabel]}
                />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ---------- Bar horizontal (label panjang / peringkat) ----------
export function HBarChartX({
    data, yKey, xKey, height = 320, unit = "", color = ACCENT, valueLabel = "Nilai",
}: {
    data: Record<string, unknown>[];
    yKey: string; xKey: string; height?: number; unit?: string;
    color?: string; valueLabel?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} tickFormatter={fmtNum} />
                <YAxis type="category" dataKey={yKey} tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={168} />
                <Tooltip
                    cursor={{ fill: "rgba(31,138,100,0.06)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, valueLabel]}
                />
                <Bar dataKey={xKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
        </ResponsiveContainer>
    );
}

// ---------- Bar bertingkat (part-to-whole per kategori) ----------
export function StackedBarChartX({
    data, xKey, keys, height = 300, unit = "",
}: {
    data: Record<string, unknown>[];
    xKey: string;
    keys: { key: string; label: string; color?: string }[];
    height?: number; unit?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey={xKey} tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={56} />
                <Tooltip cursor={{ fill: "rgba(31,138,100,0.06)" }} contentStyle={tooltipStyle}
                    formatter={(v, n) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, n]} />
                <Legend wrapperStyle={{ fontSize: 12, color: INK }} />
                {keys.map((k, i) => (
                    <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a"
                        fill={k.color ?? SERIES[i % SERIES.length]} maxBarSize={40} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

// ---------- Bar proporsi (part-to-whole per baris, horizontal 100%) ----------
// data: [{ label, ya, kadang, tidak }]; nilai di-plot sebagai proporsi.
// Urutan sengaja: Tidak, Kadang, Ya - legend & tooltip membaca sama,
// dan batang tersusun kiri→kanan mengikuti urutan ini.
const PROP_KEYS = [
    { key: "tidak", label: "Tidak", color: "#c0392b" },
    { key: "kadang", label: "Kadang", color: "#d98324" },
    { key: "ya", label: "Ya", color: ACCENT },
] as const;

function PropTip({ active, payload }: { active?: boolean; payload?: { payload: Record<string, unknown> }[] }) {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const total = PROP_KEYS.reduce((s, k) => s + (Number(row[k.key]) || 0), 0);
    return (
        <div style={tooltipStyle}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(row.label)}</div>
            {PROP_KEYS.map((k) => {
                const v = Number(row[k.key]) || 0;
                const pct = total ? (v / total) * 100 : 0;
                return (
                    <div key={k.key} style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1.7 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: k.color, display: "inline-block" }} />
                        <span style={{ flex: 1 }}>{k.label}</span>
                        <span style={{ fontVariantNumeric: "tabular-nums" }}>
                            {fmtNum(Math.round(pct))}% ({fmtNum(v)} dari {fmtNum(total)})
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export function ProportionBarX({
    data, height, heightPerRow = 40,
}: {
    data: Record<string, unknown>[];
    height?: number;
    heightPerRow?: number;
}) {
    const h = height ?? Math.max(160, data.length * heightPerRow);

    return (
        <ResponsiveContainer width="100%" height={h}>
            <BarChart data={data} layout="vertical" stackOffset="expand"
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="24%">
                <XAxis type="number" hide domain={[0, 1]} />
                <YAxis type="category" dataKey="label" tick={{ fill: MUTED, fontSize: 11 }}
                    axisLine={false} tickLine={false} width={190} />
                <Tooltip cursor={{ fill: "rgba(31,138,100,0.06)" }} content={<PropTip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: INK }} />
                {PROP_KEYS.map((k) => (
                    <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a" fill={k.color}
                        maxBarSize={20} radius={4} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

// ---------- Garis (tren waktu) ----------
export function LineChartX({
    data, xKey, lines, height = 300, unit = "",
}: {
    data: Record<string, unknown>[];
    xKey: string;
    lines: { key: string; label: string; color?: string }[];
    height?: number; unit?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey={xKey} tick={{ fill: MUTED, fontSize: 11 }} axisLine={{ stroke: AXIS }} tickLine={false} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={56} />
                <Tooltip contentStyle={tooltipStyle}
                    formatter={(v, n) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, n]} />
                {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: INK }} />}
                {lines.map((l, i) => (
                    <Line key={l.key} type="monotone" dataKey={l.key} name={l.label}
                        stroke={l.color ?? SERIES[i % SERIES.length]} strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
}

// ---------- Donut (part-to-whole kategori) ----------
export function DonutChartX({
    data, nameKey, valueKey, height = 300, unit = "",
}: {
    data: Record<string, unknown>[];
    nameKey: string; valueKey: string; height?: number; unit?: string;
}) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%"
                    innerRadius="55%" outerRadius="82%" paddingAngle={2} stroke="#fff" strokeWidth={2}>
                    {data.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle}
                    formatter={(v, n) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, n]} />
                <Legend wrapperStyle={{ fontSize: 12, color: INK }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
