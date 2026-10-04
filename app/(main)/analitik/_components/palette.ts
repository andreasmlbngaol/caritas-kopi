// app/(main)/analitik/_components/palette.ts
// Palet kategorikal (urutan jade-first) - lolos validator dataviz pada
// surface terang untuk semua gate adjacency. Jangan acak urutannya.
export const SERIES = ["#1f8a64", "#2a78d6", "#eb6834", "#4a3aa7", "#e87ba4"] as const;

export const ACCENT = "#1f8a64"; // jade-500
export const ACCENT_STRONG = "#0f5c42"; // jade-700
export const GRID = "#e1e0d9";
export const AXIS = "#c3c2b7";
export const MUTED = "#6b6a64"; // label/axis - kontras >= 4.5:1 di atas putih
export const INK = "#0b0b0b";

// Untuk bar seri tunggal (magnitudo) - satu hue, lebih tua = lebih besar.
export const SEQ_JADE = ["#93c9b4", "#5aab8c", "#1f8a64", "#147051", "#0c4a36"] as const;

export function seriesColor(i: number): string {
    return SERIES[i % SERIES.length];
}
