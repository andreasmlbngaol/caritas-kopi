// app/(main)/petani/gap-fields.tsx
"use client";

import { useState } from "react";
import { Segmented } from "../_components/yes-no";
import { inputCls } from "../_components/ui";
import { GAP_GROUPS, GAP_OPTIONS } from "./constants";

const blankStr = (v: string | null | undefined) => (v == null || v === "-" ? "" : v);

export type GapDefaults = Record<string, { jawaban: string | null; keterangan: string }>;

function GapRow({
                    jenis, label, defaultValue, defaultKet,
                }: {
    jenis: string; label: string; defaultValue: string; defaultKet?: string;
}) {
    const [value, setValue] = useState(defaultValue);
    return (
        <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <span className="text-sm text-gray-700">{label}</span>
            <Segmented
                name={`gap_${jenis}`} value={value} options={[...GAP_OPTIONS]}
                onChange={setValue} clearable
            />
            <input
                name={`gap_${jenis}_ket`} placeholder="Keterangan"
                data-skip-check
                defaultValue={defaultKet} className={inputCls}
            />
        </div>
    );
}

export function GapFields({ defaults }: { defaults?: GapDefaults }) {
    return (
        <div className="space-y-6">
            {GAP_GROUPS.map((g) => (
                <div key={g.kelompok}>
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        {g.kelompok}
                    </h3>
                    <div className="space-y-3">
                        {g.items.map((item) => (
                            <GapRow
                                key={item.jenis}
                                jenis={item.jenis}
                                label={item.label}
                                defaultValue={defaults?.[item.jenis]?.jawaban ?? "TIDAK"}
                                defaultKet={blankStr(defaults?.[item.jenis]?.keterangan)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}