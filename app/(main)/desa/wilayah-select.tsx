// app/(main)/desa/wilayah-select.tsx
"use client";

import { useEffect, useState } from "react";
import { Combobox } from "./combobox";

type Option = { value: string; label: string };
const LABELS = ["Provinsi", "Kabupaten/Kota", "Kecamatan", "Desa"];

const toOptions = (rows: { kode: string; nama: string }[]): Option[] =>
    rows.map((r) => ({ value: r.kode, label: r.nama }));

// "11.01.02.2001" → ["11", "11.01", "11.01.02", "11.01.02.2001"]
function deriveLevels(desaKode: string): string[] {
    const p = desaKode.split(".");
    return [p[0], p.slice(0, 2).join("."), p.slice(0, 3).join("."), desaKode];
}

export function WilayahSelect({ defaultDesaKode }: { defaultDesaKode?: string }) {
    const [options, setOptions] = useState<Option[][]>([[], [], [], []]);
    const [selected, setSelected] = useState<string[]>(
        defaultDesaKode ? deriveLevels(defaultDesaKode) : ["", "", "", ""]
    );

    useEffect(() => {
        if (!defaultDesaKode) {
            fetch("/api/wilayah")
                .then((r) => r.json())
                .then((data) => setOptions((o) => [toOptions(data), o[1], o[2], o[3]]));
            return;
        }
        // Mode edit: preload opsi keempat level sekaligus
        const [prov, kab, kec] = deriveLevels(defaultDesaKode);
        Promise.all([
            fetch("/api/wilayah").then((r) => r.json()),
            fetch(`/api/wilayah?parent=${prov}`).then((r) => r.json()),
            fetch(`/api/wilayah?parent=${kab}`).then((r) => r.json()),
            fetch(`/api/wilayah?parent=${kec}`).then((r) => r.json()),
        ]).then(([p, kb, kc, ds]) =>
            setOptions([toOptions(p), toOptions(kb), toOptions(kc), toOptions(ds)])
        );
    }, [defaultDesaKode]);

    async function handleChange(level: number, kode: string) {
        setSelected((s) => s.map((v, i) => (i === level ? kode : i > level ? "" : v)));
        setOptions((o) => o.map((opts, i) => (i > level ? [] : opts)));

        if (kode && level < 3) {
            const res = await fetch(`/api/wilayah?parent=${encodeURIComponent(kode)}`);
            const data = await res.json();
            setOptions((o) => o.map((opts, i) => (i === level + 1 ? toOptions(data) : opts)));
        }
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {LABELS.map((label, i) => (
                <Combobox
                    key={label}
                    label={label}
                    placeholder={`Pilih ${label}`}
                    name={i === 3 ? "desaKode" : undefined}
                    required={i === 3}
                    options={options[i]}
                    value={selected[i]}
                    onChange={(v) => handleChange(i, v)}
                    disabled={i > 0 && !selected[i - 1]}
                />
            ))}
        </div>
    );
}