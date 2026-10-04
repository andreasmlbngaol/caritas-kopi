// app/(main)/petani/plot-fields.tsx
"use client";

import {useEffect, useRef, useState} from "react";
import {Calendar, ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, X} from "lucide-react";
import { inputCls } from "../_components/ui";
import { Segmented } from "../_components/yes-no";
import {STATUS_KEPEMILIKAN, SISTEM_BUDIDAYA, BULAN_ID} from "./constants";

export type NaunganDefaults = {
    jenis: string | null;
    jumlah: number | null;
    fungsi: string | null;
    pemangkasan: boolean | null;
    produksiPerTahun: string | null;
    tahunTanam: number | null;
};

export type PlotDefaults = {
    namaHamparan: string | null;
    varietas: string | null; // tersimpan digabung ", " - di form dipecah jadi multi-entry
    tahunTanam: number | null;
    kodeGps: string | null;
    elevasiMdpl: number | null;
    kemiringanPersen: number | null;
    luasKopiHa: number | null;
    fotoKey: string | null;
    fotoLatitude: number | null;
    fotoLongitude: number | null;
    statusKepemilikan: string | null;
    sistemBudidaya: string | null;
    areaKonservasi: string | null;
    tanamanBaru: number | null;
    pohonProduktif: number | null;
    pohonTidakProduktif: number | null;
    pestisidaNama: string | null;
    pestisidaBulanTahun: string | null; // "YYYY-MM"
    naungan: NaunganDefaults[];
};

type Entry<T> = { key: string; defaults?: T };

const blankNum = (v: number | null | undefined) => (v == null || v === 0 ? "" : v);
const blankStr = (v: string | null | undefined) => (v == null || v === "-" ? "" : v);

let counter = 0;
const nextKey = () => `k${++counter}`;

function MiniField({
                       label, name, type = "text", placeholder, hint, defaultValue,
                   }: {
    label: string; name: string; type?: string; placeholder?: string; hint?: string;
    defaultValue?: string | number;
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
            <input
                id={name} name={name} type={type}
                step={type === "number" ? "any" : undefined}
                min={type === "number" ? 0 : undefined}
                inputMode={type === "number" ? "decimal" : undefined}
                placeholder={placeholder}
                data-label={label}
                defaultValue={defaultValue}
                className={inputCls}
            />
            {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
        </div>
    );
}

function MiniSelect({
                        label, name, options, defaultValue,
                    }: {
    label: string; name: string;
    options: readonly { value: string; label: string }[];
    defaultValue?: string | null;
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
            <select id={name} name={name} data-label={label} defaultValue={defaultValue ?? ""} className={inputCls}>
                <option value="">- pilih -</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

// Varietas kopi: multi-entry, masing-masing 1 input berlabel
function VarietasFields({ plotIndex, defaults }: { plotIndex: number; defaults?: string | null }) {
    const [rows, setRows] = useState<Entry<string>[]>(() => {
        const list = blankStr(defaults)?.split(", ").filter(Boolean) ?? [];
        return list.length
            ? list.map((v) => ({ key: nextKey(), defaults: v }))
            : [{ key: nextKey() }];
    });

    return (
        <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">Varietas Kopi</span>
            <div className="space-y-2">
                {rows.map((r, k) => (
                    <div key={r.key} className="flex items-center gap-2">
                        <input
                            name={`plot_${plotIndex}_varietas_${k}`}
                            placeholder={`Varietas ${k + 1}, mis. Arabika`}
                            data-label={`Varietas kopi ${k + 1}`}
                            defaultValue={r.defaults ?? ""}
                            className={inputCls}
                        />
                        {rows.length > 1 && (
                            <button
                                type="button" title="Hapus varietas"
                                onClick={() => setRows((s) => s.filter((x) => x.key !== r.key))}
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button
                type="button"
                onClick={() => setRows((s) => [...s, { key: nextKey() }])}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-jade-700 hover:underline"
            >
                <Plus size={12} /> Tambah varietas
            </button>
        </div>
    );
}

function FotoUpload({
                        index, defaultKey, defaultLat, defaultLng,
                    }: {
    index: number; defaultKey?: string | null; defaultLat?: number | null; defaultLng?: number | null;
}) {
    const [key, setKey] = useState(defaultKey ?? "");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        setUploading(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append("file", f);
            const res = await fetch("/api/upload", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Upload gagal");
            setKey(data.key);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload gagal");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">Foto Geotagged</span>
            <input type="hidden" name={`plot_${index}_fotoKey`} value={key} />
            <div className="flex items-start gap-3">
                {key ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={`/api/foto/${key}`} alt={`Foto plot ${index + 1}`}
                        className="h-24 w-24 rounded-xl object-cover ring-1 ring-gray-200"
                    />
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white text-gray-300 ring-1 ring-inset ring-gray-200">
                        <ImagePlus size={22} />
                    </div>
                )}
                <div className="flex-1 space-y-2">
                    <label
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 ${
                            uploading ? "pointer-events-none opacity-60" : ""
                        }`}
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                        {uploading ? "Mengupload…" : key ? "Ganti foto" : "Pilih foto"}
                        <input
                            type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                            className="hidden" onChange={onFile} disabled={uploading}
                        />
                    </label>
                    {error && <p className="text-[11px] text-red-600">{error}</p>}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor={`plot_${index}_fotoLatitude`} className="mb-1 block text-[11px] text-gray-500">Latitude foto</label>
                            <input
                                id={`plot_${index}_fotoLatitude`}
                                name={`plot_${index}_fotoLatitude`} type="number" step="any" inputMode="decimal"
                                placeholder="-7.1234" data-label="Koordinat foto - Latitude"
                                defaultValue={defaultLat ?? ""} className={inputCls}
                            />
                        </div>
                        <div>
                            <label htmlFor={`plot_${index}_fotoLongitude`} className="mb-1 block text-[11px] text-gray-500">Longitude foto</label>
                            <input
                                id={`plot_${index}_fotoLongitude`}
                                name={`plot_${index}_fotoLongitude`} type="number" step="any" inputMode="decimal"
                                placeholder="110.4567" data-label="Koordinat foto - Longitude"
                                defaultValue={defaultLng ?? ""} className={inputCls}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Satu kartu tanaman naungan - field berlabel, tersusun rapi
function NaunganCard({
                         plotIndex, index, entry, onRemove,
                     }: {
    plotIndex: number; index: number; entry: Entry<NaunganDefaults>; onRemove: () => void;
}) {
    const d = entry.defaults;
    const n = (f: string) => `naung_${plotIndex}_${index}_${f}`;
    const [pemangkasan, setPemangkasan] = useState(d?.pemangkasan ? "true" : "false");

    return (
        <div className="rounded-xl bg-white p-4 ring-1 ring-inset ring-gray-200">
            <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Naungan / Sela / Tegakan {index + 1}</span>
                <button
                    type="button" onClick={onRemove} title="Hapus"
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <X size={14} />
                </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MiniField label="Jenis Naungan/Sela/Tegakan" name={n("jenis")} defaultValue={blankStr(d?.jenis)} />
                <MiniField label="Jumlah" name={n("jumlah")} type="number" defaultValue={blankNum(d?.jumlah)} />
                <MiniField label="Fungsi" name={n("fungsi")} placeholder="Naungan, pupuk hijau…" defaultValue={blankStr(d?.fungsi)} />
                <MiniField label="Tahun Tanam" name={n("tahunTanam")} type="number" defaultValue={blankNum(d?.tahunTanam)} />
                <div>
                    <span className="mb-1 block text-xs font-medium text-gray-600">Apakah Dilakukan Pemangkasan</span>
                    <Segmented
                        name={n("pemangkasan")} value={pemangkasan}
                        options={[{ value: "true", label: "Ya" }, { value: "false", label: "Tidak" }]}
                        onChange={setPemangkasan}
                    />
                </div>
                <MiniField label="Produksi/Tahun" name={n("produksiPerTahun")} placeholder="mis. 50 kg" defaultValue={blankStr(d?.produksiPerTahun)} />
            </div>
        </div>
    );
}

// Pemilih bulan-tahun ("YYYY-MM") berbahasa Indonesia
function MonthPicker({
                         label, name, defaultValue,
                     }: {
    label: string; name: string; defaultValue?: string;
}) {
    const today = new Date();
    const parsed = defaultValue?.match(/^(\d{4})-(\d{2})$/);
    const [value, setValue] = useState(defaultValue ?? "");
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(parsed ? Number(parsed[1]) : today.getFullYear());
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, [open]);

    const display = value.match(/^(\d{4})-(\d{2})$/)
        ? `${BULAN_ID[Number(value.split("-")[1]) - 1]} ${value.split("-")[0]}`
        : "";

    return (
        <div ref={ref} className="relative">
            <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
            <input type="hidden" name={name} value={value} data-label={label} />
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2.5 text-left text-sm ring-1 ring-inset ring-gray-300 outline-none transition focus:ring-2 focus:ring-inset focus:ring-jade-700"
            >
                <span className={display ? "text-gray-900" : "text-gray-400"}>
                    {display || "Pilih bulan…"}
                </span>
                <Calendar size={15} className="shrink-0 text-gray-400" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1.5 w-64 rounded-xl bg-white p-3 shadow-lg ring-1 ring-gray-950/5">
                    <div className="mb-2 flex items-center justify-between">
                        <button type="button" onClick={() => setYear((y) => y - 1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold text-gray-900">{year}</span>
                        <button type="button" onClick={() => setYear((y) => y + 1)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {BULAN_ID.map((b, i) => {
                            const iso = `${year}-${String(i + 1).padStart(2, "0")}`;
                            return (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => { setValue(iso); setOpen(false); }}
                                    className={`rounded-lg py-1.5 text-xs transition-colors ${
                                        value === iso
                                            ? "bg-jade-800 font-semibold text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                    }`}
                                >
                                    {b.slice(0, 3)}
                                </button>
                            );
                        })}
                    </div>
                    {value && (
                        <div className="mt-2 border-t border-gray-100 pt-2 text-right">
                            <button
                                type="button"
                                onClick={() => { setValue(""); setOpen(false); }}
                                className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                            >
                                Hapus
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PlotCard({
                      index, entry, onRemove,
                  }: {
    index: number; entry: Entry<PlotDefaults>; onRemove: () => void;
}) {
    const d = entry.defaults;
    const p = (f: string) => `plot_${index}_${f}`;
    const [naungan, setNaungan] = useState<Entry<NaunganDefaults>[]>(() =>
        d?.naungan.length ? d.naungan.map((n) => ({ key: nextKey(), defaults: n })) : []
    );

    return (
        <div data-group={`Plot ${index + 1}`} className="rounded-2xl bg-gray-50/60 p-5 ring-1 ring-inset ring-gray-200">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Plot {index + 1}
                </h3>
                <button
                    type="button" onClick={onRemove} title="Hapus plot"
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                    <X size={15} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MiniField label="Nama / Hamparan" name={p("namaHamparan")} defaultValue={blankStr(d?.namaHamparan)} />
                    <VarietasFields plotIndex={index} defaults={d?.varietas} />
                    <MiniField label="Tahun Tanam" name={p("tahunTanam")} type="number" defaultValue={blankNum(d?.tahunTanam)} />
                    <MiniField label="Kode GPS" name={p("kodeGps")} defaultValue={blankStr(d?.kodeGps)} />
                    <MiniField label="Elevasi (mdpl)" name={p("elevasiMdpl")} type="number" defaultValue={blankNum(d?.elevasiMdpl)} />
                    <MiniField label="Kemiringan (%)" name={p("kemiringanPersen")} type="number" defaultValue={blankNum(d?.kemiringanPersen)} />
                    <MiniField label="Luas Kopi (Ha)" name={p("luasKopiHa")} type="number" defaultValue={blankNum(d?.luasKopiHa)} />
                    <MiniSelect label="Status Kepemilikan Lahan" name={p("statusKepemilikan")} options={STATUS_KEPEMILIKAN} defaultValue={d?.statusKepemilikan} />
                    <MiniSelect label="Sistem Budidaya" name={p("sistemBudidaya")} options={SISTEM_BUDIDAYA} defaultValue={d?.sistemBudidaya} />
                </div>

                <FotoUpload index={index} defaultKey={d?.fotoKey} defaultLat={d?.fotoLatitude} defaultLng={d?.fotoLongitude} />

                <MiniField
                    label="Area Konservasi di Lahan" name={p("areaKonservasi")}
                    placeholder="Sungai, kemiringan terjal, berdekatan hutan lindung…"
                    defaultValue={blankStr(d?.areaKonservasi)}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <MiniField label="Jumlah Tanaman Baru (< 2 tahun)" name={p("tanamanBaru")} type="number" defaultValue={blankNum(d?.tanamanBaru)} />
                    <MiniField label="Jumlah Pohon Produktif" name={p("pohonProduktif")} type="number" defaultValue={blankNum(d?.pohonProduktif)} />
                    <MiniField label="Jumlah Pohon Tidak Produktif" name={p("pohonTidakProduktif")} type="number" defaultValue={blankNum(d?.pohonTidakProduktif)} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MonthPicker
                        label="Bulan & Tahun Pestisida Terakhir"
                        name={p("pestisidaBulanTahun")}
                        defaultValue={d?.pestisidaBulanTahun ?? ""}
                    />
                    <MiniField
                        label="Jenis Pestisida Terakhir" name={p("pestisidaNama")}
                        placeholder="mis. Basmilang" defaultValue={blankStr(d?.pestisidaNama)}
                    />
                </div>

                {/* B.2 - Tanaman naungan/sela/tegakan */}
                <div className="border-t border-gray-200 pt-4">
                    <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Tanaman Naungan / Sela / Tegakan
                    </h4>
                    <div className="space-y-3">
                        {naungan.map((n, j) => (
                            <NaunganCard
                                key={n.key} plotIndex={index} index={j} entry={n}
                                onRemove={() => setNaungan((s) => s.filter((x) => x.key !== n.key))}
                            />
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setNaungan((s) => [...s, { key: nextKey() }])}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50"
                    >
                        <Plus size={13} /> Tambah Naungan
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PlotFields({ defaults }: { defaults?: PlotDefaults[] }) {
    const [plots, setPlots] = useState<Entry<PlotDefaults>[]>(() =>
        defaults?.length
            ? defaults.map((d) => ({ key: nextKey(), defaults: d }))
            : [{ key: nextKey() }]
    );

    return (
        <div className="space-y-4">
            {plots.map((e, i) => (
                <PlotCard
                    key={e.key} index={i} entry={e}
                    onRemove={() => setPlots((s) => s.filter((x) => x.key !== e.key))}
                />
            ))}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setPlots((s) => [...s, { key: nextKey() }])}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                    <Plus size={15} /> Tambah Plot
                </button>
                {plots.length === 0 && (
                    <p className="text-xs text-gray-400">
                        Belum ada plot - klik &#34;Tambah Plot&#34;, atau simpan tanpa plot bila survei menyusul.
                    </p>
                )}
            </div>
        </div>
    );
}