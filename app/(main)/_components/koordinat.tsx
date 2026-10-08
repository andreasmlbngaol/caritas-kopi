// app/(main)/_components/koordinat.tsx
"use client";

import { useState } from "react";
import { inputCls } from "./ui";
import { Segmented } from "./yes-no";

type Kind = "lat" | "lng";

// Arah dipilih lewat dropdown, default N (lat) dan E (lng).
// Nilai tersimpan selalu derajat desimal (S/W = negatif), jadi server menerima
// satu angka seperti sebelumnya.
const DIRS: Record<Kind, { pos: string; neg: string }> = {
    lat: { pos: "N", neg: "S" },
    lng: { pos: "E", neg: "W" },
};
const DEG_MAX: Record<Kind, number> = { lat: 90, lng: 180 };

const round = (n: number) => Math.round(n * 1e8) / 1e8;

// Terima "59.6" maupun "59,6".
const parseNum = (v: string) => {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
};
// Hanya izinkan angka, titik, koma (minus opsional, hanya di awal).
const onlyNumeric = (v: string, allowMinus = false) => {
    let s = v.replace(allowMinus ? /[^0-9.,-]/g : /[^0-9.,]/g, "");
    if (allowMinus) s = s.replace(/(?!^)-/g, "");
    return s;
};

function toDMS(dec: number) {
    const abs = Math.abs(dec);
    let d = Math.floor(abs);
    let m = Math.floor((abs - d) * 60);
    let s = Math.round(((abs - d) * 60 - m) * 60 * 100) / 100;
    if (s >= 60) { s -= 60; m += 1; }
    if (m >= 60) { m -= 60; d += 1; }
    return { d, m, s };
}

// Baris satu koordinat. `value` = derajat desimal (string), sumber kebenaran ada di parent.
// Diberi key={mode} oleh parent agar remount + inisialisasi ulang saat format diganti.
function KoordinatRow({
                          label, kind, mode, value, onChange,
                      }: {
    label: string;
    kind: Kind;
    mode: "desimal" | "dms";
    value: string;
    onChange: (v: string) => void;
}) {
    const dec = parseNum(value);
    const init = toDMS(dec);

    const [d, setD] = useState(value ? String(init.d) : "");
    const [m, setM] = useState(value ? String(init.m) : "");
    const [s, setS] = useState(value ? String(init.s) : "");
    const [dir, setDir] = useState<string>(
        value && dec < 0 ? DIRS[kind].neg : DIRS[kind].pos
    );

    function updateDMS(part: "d" | "m" | "s" | "dir", val: string) {
        let clean = part === "dir" ? val : onlyNumeric(val);
        // Batasi: derajat <= 90 (lat) / 180 (lng), menit & detik <= 60.
        const max = part === "d" ? DEG_MAX[kind] : 60;
        if (part !== "dir" && parseNum(clean) > max) clean = String(max);

        const nd = part === "d" ? clean : d;
        const nm = part === "m" ? clean : m;
        const ns = part === "s" ? clean : s;
        const ndir = part === "dir" ? clean : dir;
        if (part === "d") setD(clean);
        else if (part === "m") setM(clean);
        else if (part === "s") setS(clean);
        else setDir(clean);

        const sign = ndir === DIRS[kind].neg ? -1 : 1;
        onChange(
            nd || nm || ns
                ? String(round(sign * (parseNum(nd) + parseNum(nm) / 60 + parseNum(ns) / 3600)))
                : ""
        );
    }

    return (
        <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>

            {mode === "desimal" ? (
                <input
                    type="text" inputMode="decimal"
                    value={value}
                    onChange={(e) => onChange(onlyNumeric(e.target.value, true))}
                    placeholder={kind === "lat" ? "1.516556" : "99.278667"}
                    aria-label={`${label} (derajat desimal)`}
                    className={inputCls}
                />
            ) : (
                <div className="flex items-center gap-2">
                    <div className="w-16 shrink-0">
                        <select
                            value={dir} onChange={(e) => updateDMS("dir", e.target.value)}
                            aria-label={`${label} arah`} className={inputCls}
                        >
                            <option value={DIRS[kind].pos}>{DIRS[kind].pos}</option>
                            <option value={DIRS[kind].neg}>{DIRS[kind].neg}</option>
                        </select>
                    </div>
                    <div className="min-w-0 flex-1">
                        <input
                            type="text" inputMode="decimal"
                            value={d} onChange={(e) => updateDMS("d", e.target.value)}
                            placeholder="Derajat" aria-label={`${label} derajat`} className={inputCls}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <input
                            type="text" inputMode="decimal"
                            value={m} onChange={(e) => updateDMS("m", e.target.value)}
                            placeholder="Menit" aria-label={`${label} menit`} className={inputCls}
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <input
                            type="text" inputMode="decimal"
                            value={s} onChange={(e) => updateDMS("s", e.target.value)}
                            placeholder="Detik" aria-label={`${label} detik`} className={inputCls}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Sepasang latitude + longitude dengan SATU pilihan format untuk keduanya.
export function KoordinatPair({
                                  latLabel = "Latitude", lngLabel = "Longitude",
                                  latName, lngName, latDefault, lngDefault,
                              }: {
    latLabel?: string; lngLabel?: string;
    latName: string; lngName: string;
    latDefault?: number | null; lngDefault?: number | null;
}) {
    const [mode, setMode] = useState<"desimal" | "dms">("desimal");
    const [lat, setLat] = useState(latDefault != null ? String(latDefault) : "");
    const [lng, setLng] = useState(lngDefault != null ? String(lngDefault) : "");

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-600">Format Koordinat</span>
                <Segmented
                    name="format_koordinat"
                    value={mode}
                    options={[
                        { value: "desimal", label: "Desimal" },
                        { value: "dms", label: "Derajat Menit Detik" },
                    ]}
                    onChange={(v) => setMode(v as "desimal" | "dms")}
                />
            </div>

            {/* server terima satu angka desimal bertitik */}
            <input type="hidden" name={latName} value={lat.replace(",", ".")} data-label={latLabel} />
            <input type="hidden" name={lngName} value={lng.replace(",", ".")} data-label={lngLabel} />

            <KoordinatRow
                key={`lat-${mode}`} label={latLabel} kind="lat" mode={mode}
                value={lat} onChange={setLat}
            />
            <KoordinatRow
                key={`lng-${mode}`} label={lngLabel} kind="lng" mode={mode}
                value={lng} onChange={setLng}
            />

            <p className="text-[11px] text-gray-500">
                {mode === "desimal"
                    ? "Derajat desimal, mis. 1.516556 (boleh pakai koma)."
                    : "Isi derajat, menit, detik. Otomatis diubah ke derajat desimal."}
            </p>
        </div>
    );
}
