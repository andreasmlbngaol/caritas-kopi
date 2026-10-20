// app/(main)/analitik/_components/charts.tsx
"use client";

import {
    ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    LineChart, Line, PieChart, Pie, Legend,
} from "recharts";
import { ACCENT, SERIES, chartTheme } from "./palette";
import { useIsDark } from "@/app/_components/theme-toggle";

const idNum = new Intl.NumberFormat("id-ID");
const fmtNum = (v: unknown) => (typeof v === "number" ? idNum.format(v) : String(v ?? ""));

// Gaya tooltip chart. `dark` menentukan surface/teks agar tetap terbaca
// (tooltip selalu berlatar putih di mode terang, gelap di mode gelap).
function tooltipStyle(dark: boolean) {
    const t = chartTheme(dark);
    return {
        borderRadius: 12,
        border: `1px solid ${t.BORDER}`,
        boxShadow: "0 6px 20px rgba(11,11,11,0.08)",
        fontSize: 12,
        padding: "8px 12px",
        backgroundColor: t.SURFACE,
        color: t.INK,
    } as const;
}

// Recharts mewarisi `color` ke item tooltip lewat entry.color (warna seri);
// set itemStyle agar teks tetap terbaca di atas surface.
const tooltipItemStyle = (dark: boolean) => ({ color: chartTheme(dark).INK });

// ---------- Kolom vertikal (magnitudo, satu seri) ----------
export function BarChartX({
    data, xKey, yKey, height = 280, unit = "", color = ACCENT, valueLabel = "Nilai",
}: {
    data: Record<string, unknown>[];
    xKey: string; yKey: string; height?: number; unit?: string;
    color?: string; valueLabel?: string;
}) {
    const dark = useIsDark();
    const t = chartTheme(dark);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={t.GRID} />
                <XAxis dataKey={xKey} tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={{ stroke: t.AXIS }} tickLine={false} />
                <YAxis tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={56} />
                <Tooltip
                    cursor={{ fill: "rgba(31,138,100,0.06)" }}
                    contentStyle={tooltipStyle(dark)}
                    itemStyle={tooltipItemStyle(dark)}
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
    const dark = useIsDark();
    const t = chartTheme(dark);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke={t.GRID} />
                <XAxis type="number" tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={{ stroke: t.AXIS }} tickLine={false} tickFormatter={fmtNum} />
                <YAxis type="category" dataKey={yKey} tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={false} tickLine={false} width={168} />
                <Tooltip
                    cursor={{ fill: "rgba(31,138,100,0.06)" }}
                    contentStyle={tooltipStyle(dark)}
                    itemStyle={tooltipItemStyle(dark)}
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
    const dark = useIsDark();
    const t = chartTheme(dark);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={t.GRID} />
                <XAxis dataKey={xKey} tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={{ stroke: t.AXIS }} tickLine={false} />
                <YAxis tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={56} />
                <Tooltip cursor={{ fill: "rgba(31,138,100,0.06)" }} contentStyle={tooltipStyle(dark)}
                    itemStyle={tooltipItemStyle(dark)}
                    formatter={(v, n) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, n]} />
                <Legend wrapperStyle={{ fontSize: 12, color: t.INK }} />
                {keys.map((k, i) => (
                    <Bar key={k.key} dataKey={k.key} name={k.label} stackId="a"
                        fill={k.color ?? SERIES[i % SERIES.length]} maxBarSize={40} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
}

// ---------- Bar berkelompok bertumpuk ----------
// Dipakai untuk produksi per desa: tiap desa punya beberapa bar (tahun),
// dan tiap bar ditumpuk per jenis olahan.
type StackSeries = { key: string; label: string; color?: string };

function StackTip({
    active, payload, groups, series, unit,
}: {
    active?: boolean;
    payload?: { dataKey?: string | number; name?: string; payload?: Record<string, unknown> }[];
    groups: { key: string; label: string }[];
    series: StackSeries[];
    unit: string;
}) {
    const dark = useIsDark();
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload ?? {};
    const rawKey = String(payload[0]?.dataKey ?? "");
    const rawName = String(payload[0]?.name ?? "");
    const group = groups.find((g) => g.key === rawKey.split("_")[0])
        ?? groups.find((g) => rawName.startsWith(`${g.label} ·`));
    if (!group) return null;
    const entries = series.map((s, i) => ({
        ...s,
        color: s.color ?? SERIES[i % SERIES.length],
        value: Number(row[`${group.key}_${s.key}`]) || 0,
    }));
    const total = entries.reduce((sum, e) => sum + e.value, 0);
    return (
        <div style={tooltipStyle(dark)}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
                {String(row.nama ?? "")} · {group.label}
            </div>
            {entries.map((e) => (
                <div key={e.key} style={{ display: "flex", alignItems: "center", gap: 6, lineHeight: 1.7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: e.color, display: "inline-block" }} />
                    <span style={{ flex: 1 }}>{e.label}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {fmtNum(e.value)}{unit ? ` ${unit}` : ""}
                    </span>
                </div>
            ))}
            <div style={{
                marginTop: 4, borderTop: `1px solid ${chartTheme(dark).GRID}`, paddingTop: 4,
                display: "flex", justifyContent: "space-between", gap: 12,
            }}>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                    {fmtNum(total)}{unit ? ` ${unit}` : ""}
                </span>
            </div>
        </div>
    );
}

function CategoryLegend({ series }: { series: StackSeries[] }) {
    const dark = useIsDark();
    return (
        <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px",
            fontSize: 12, color: chartTheme(dark).INK,
        }}>
            {series.map((s, i) => (
                <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                        width: 9, height: 9, borderRadius: 2, display: "inline-block",
                        background: s.color ?? SERIES[i % SERIES.length],
                    }} />
                    {s.label}
                </span>
            ))}
        </div>
    );
}

export function GroupedStackedBarChartX({
    data, xKey, groups, series, height = 360, unit = "", rotateLabels = false, minWidth, spread = false,
}: {
    data: Record<string, unknown>[];
    xKey: string;
    groups: { key: string; label: string }[];
    series: StackSeries[];
    height?: number; unit?: string;
    rotateLabels?: boolean;
    minWidth?: number;
    spread?: boolean;
}) {
    const dark = useIsDark();
    const t = chartTheme(dark);
    return (
        <div style={minWidth ? { minWidth } : undefined}>
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, left: -8, bottom: rotateLabels ? 8 : 0 }}
                    barGap={spread ? 12 : 2}
                    barCategoryGap={spread ? "40%" : "16%"}
                >
                    <CartesianGrid vertical={false} stroke={t.GRID} />
                    <XAxis
                        dataKey={xKey}
                        interval={0}
                        tick={{ fill: t.MUTED, fontSize: 11 }}
                        axisLine={{ stroke: t.AXIS }}
                        tickLine={false}
                        angle={rotateLabels ? -90 : 0}
                        textAnchor={rotateLabels ? "end" : "middle"}
                        height={rotateLabels ? 120 : 30}
                    />
                    <YAxis tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={fmtNum} width={56} />
                    <Tooltip
                        shared={false}
                        cursor={{ fill: "rgba(31,138,100,0.06)" }}
                        content={<StackTip groups={groups} series={series} unit={unit} />}
                    />
                    <Legend content={<CategoryLegend series={series} />} />
                    {groups.flatMap((g) =>
                        series.map((s, i) => (
                            <Bar
                                key={`${g.key}_${s.key}`}
                                dataKey={`${g.key}_${s.key}`}
                                name={`${g.label} · ${s.label}`}
                                stackId={g.key}
                                fill={s.color ?? SERIES[i % SERIES.length]}
                                maxBarSize={spread ? 56 : 18}
                                radius={i === series.length - 1 ? [3, 3, 0, 0] : undefined}
                            />
                        )),
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
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
    const dark = useIsDark();
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const total = PROP_KEYS.reduce((s, k) => s + (Number(row[k.key]) || 0), 0);
    return (
        <div style={tooltipStyle(dark)}>
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
    const dark = useIsDark();
    const t = chartTheme(dark);
    const h = height ?? Math.max(160, data.length * heightPerRow);

    return (
        <ResponsiveContainer width="100%" height={h}>
            <BarChart data={data} layout="vertical" stackOffset="expand"
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barCategoryGap="24%">
                <XAxis type="number" hide domain={[0, 1]} />
                <YAxis type="category" dataKey="label" tick={{ fill: t.MUTED, fontSize: 11 }}
                    axisLine={false} tickLine={false} width={190} />
                <Tooltip cursor={{ fill: "rgba(31,138,100,0.06)" }} content={<PropTip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: t.INK }} />
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
    data, xKey, lines, height = 300, unit = "", scale = "linear",
}: {
    data: Record<string, unknown>[];
    xKey: string;
    lines: { key: string; label: string; color?: string }[];
    height?: number; unit?: string;
    // "sqrt" agar seri bernilai jauh lebih kecil tetap terlihat (mis. green bean
    // di samping cherry) tanpa celah garis yang ditimbulkan skala log pada nilai 0.
    scale?: "linear" | "sqrt";
}) {
    const dark = useIsDark();
    const t = chartTheme(dark);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={t.GRID} />
                <XAxis dataKey={xKey} tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={{ stroke: t.AXIS }} tickLine={false} />
                <YAxis
                    tick={{ fill: t.MUTED, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={fmtNum} width={56} scale={scale}
                />
                <Tooltip contentStyle={tooltipStyle(dark)}
                    itemStyle={tooltipItemStyle(dark)}
                    formatter={(v, n) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, n]} />
                {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: t.INK }} />}
                {lines.map((l, i) => (
                    <Line key={l.key} type="monotone" dataKey={l.key} name={l.label}
                        stroke={l.color ?? SERIES[i % SERIES.length]} strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2, stroke: t.SURFACE }} activeDot={{ r: 5 }} />
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
    const dark = useIsDark();
    const t = chartTheme(dark);
    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%"
                    innerRadius="55%" outerRadius="82%" paddingAngle={2} stroke={t.SURFACE} strokeWidth={2}>
                    {data.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle(dark)}
                    itemStyle={tooltipItemStyle(dark)}
                    formatter={(v, n) => [`${fmtNum(v)}${unit ? " " + unit : ""}`, n]} />
                <Legend wrapperStyle={{ fontSize: 12, color: t.INK }} />
            </PieChart>
        </ResponsiveContainer>
    );
}
