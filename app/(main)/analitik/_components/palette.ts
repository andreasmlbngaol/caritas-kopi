// app/(main)/analitik/_components/palette.ts
// Palet kategorikal (urutan jade-first) - lolos validator dataviz pada
// surface terang untuk semua gate adjacency. Jangan acak urutannya.
export const SERIES = ["#1f8a64", "#2a78d6", "#eb6834", "#4a3aa7", "#e87ba4"] as const;

export const ACCENT = "#1f8a64"; // jade-500
export const ACCENT_STRONG = "#0f5c42"; // jade-700

// Untuk bar seri tunggal (magnitudo) - satu hue, lebih tua = lebih besar.
export const SEQ_JADE = ["#93c9b4", "#5aab8c", "#1f8a64", "#147051", "#0c4a36"] as const;

export function seriesColor(i: number): string {
    return SERIES[i % SERIES.length];
}

// Warna struktural chart (grid, axis, teks, surface). Nilai ini dipakai sebagai
// atribut SVG recharts (bukan kelas Tailwind), jadi tidak ikut remap token di
// globals.css - harus dipilih per tema lewat useIsDark().
export type ChartTheme = {
    SURFACE: string; INK: string; MUTED: string; GRID: string; AXIS: string; BORDER: string;
};

const LIGHT: ChartTheme = {
    SURFACE: "#ffffff",
    INK: "#0b0b0b",
    MUTED: "#6b6a64", // kontras >= 4.5:1 di atas putih
    GRID: "#e1e0d9",
    AXIS: "#c3c2b7",
    BORDER: "rgba(11, 11, 11, 0.10)",
};

const DARK: ChartTheme = {
    SURFACE: "#1e1f22",
    INK: "#f3f4f6",
    MUTED: "#a6aab2",
    GRID: "#2f3237",
    AXIS: "#4a4d53",
    BORDER: "rgba(255, 255, 255, 0.12)",
};

export function chartTheme(dark: boolean): ChartTheme {
    return dark ? DARK : LIGHT;
}
