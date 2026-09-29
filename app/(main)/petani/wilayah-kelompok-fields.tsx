// app/(main)/petani/wilayah-kelompok-fields.tsx
"use client";

import { useEffect, useState } from "react";
import { WilayahSelect } from "../_components/wilayah-select";
import { Combobox } from "../_components/combobox";
import { inputCls } from "../_components/ui";

type KelompokOpt = { id: string; nama: string; kode: string | null };

export function WilayahKelompokFields({
                                          defaultDesaKode,
                                          defaultKelompokTaniId,
                                          defaultKodePetani,
                                      }: {
    defaultDesaKode?: string;
    defaultKelompokTaniId?: string;
    defaultKodePetani?: string | null;
}) {
    const [desaKode, setDesaKode] = useState(defaultDesaKode ?? "");
    const [fetched, setFetched] = useState<{ desa: string; data: KelompokOpt[] } | null>(null);
    const kelompok = desaKode && fetched?.desa === desaKode ? fetched.data : [];

    const [mode, setMode] = useState<"pilih" | "baru">("pilih");
    const [kelompokTaniId, setKelompokTaniId] = useState(defaultKelompokTaniId ?? "");

    // Kode petani: pecah "CAR-BM-001" → 3 segmen (segmen terakhir menampung sisa bila ada "-" berlebih)
    const seg = defaultKodePetani?.split("-") ?? [];
    const [kp1, setKp1] = useState(seg[0] ?? "CAR");
    const [kp2, setKp2] = useState(seg[1] ?? "");
    const [kp3, setKp3] = useState(seg.slice(2).join("-"));

    // Kode kelompok (mode buat baru)
    const [ktKode1, setKtKode1] = useState("");
    const [ktKode2, setKtKode2] = useState("");

    useEffect(() => {
        if (!desaKode) return;

        let cancelled = false;
        fetch(`/api/kelompok-tani?desa=${encodeURIComponent(desaKode)}`)
            .then((r) => r.json())
            .then((data) => {
                if (!cancelled) setFetched({ desa: desaKode, data });
            })
            .catch(() => {
                if (!cancelled) setFetched({ desa: desaKode, data: [] });
            });

        return () => {
            cancelled = true;
        };
    }, [desaKode]);

    function onDesaChange(kode: string) {
        setDesaKode(kode);
        setKelompokTaniId(""); // pilihan kelompok tidak berlaku lintas desa
    }

    // Prefix kode kelompok → nilai DEFAULT segmen tengah kode petani (hanya bila masih kosong;
    // setelah itu independen — mengubah kode kelompok tidak mengubah kode petani)
    function onKtKode1(raw: string) {
        const v = raw.toUpperCase();
        setKtKode1(v);
        setKp2((prev) => (prev === "" ? v : prev));
    }

    return (
        <div className="space-y-6">
            <WilayahSelect defaultDesaKode={defaultDesaKode} onDesaChange={onDesaChange} />

            <div>
                <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Kode diisi oleh petugas/koordinator koperasi. Boleh dikosongkan dulu dan dilengkapi lewat edit.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Kelompok tani — terkunci sampai desa dipilih */}
                    <div>
                        {!desaKode ? (
                            <div>
                                <span className="mb-1.5 block text-xs font-medium text-gray-600">Kelompok Tani</span>
                                <div className={`${inputCls} flex items-center text-gray-400`}>
                                    Pilih desa terlebih dahulu…
                                </div>
                            </div>
                        ) : mode === "pilih" ? (
                            <div>
                                <Combobox
                                    label="Kelompok Tani"
                                    name="kelompokTaniId"
                                    placeholder={kelompok.length ? "Pilih kelompok tani" : "Belum ada kelompok di desa ini"}
                                    options={kelompok.map((k) => ({
                                        value: k.id,
                                        label: k.kode ? `${k.nama} (${k.kode})` : k.nama,
                                    }))}
                                    value={kelompokTaniId}
                                    onChange={setKelompokTaniId}
                                />
                                <button
                                    type="button"
                                    onClick={() => setMode("baru")}
                                    className="mt-1.5 text-xs font-medium text-jade-700 hover:underline"
                                >
                                    + Buat kelompok tani baru
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label htmlFor="kt_nama" className="mb-1.5 block text-xs font-medium text-gray-600">
                                        Nama Kelompok Tani (baru) <span className="text-red-500">*</span>
                                    </label>
                                    <input id="kt_nama" name="kt_nama" required placeholder="Kelompok Tani [Nama]" className={inputCls} />
                                </div>
                                <div>
                                    <span className="mb-1.5 block text-xs font-medium text-gray-600">Kode Kelompok Tani</span>
                                    <div className="flex items-center gap-2">
                                        <div>
                                            <input
                                                name="kt_kode_1" value={ktKode1} onChange={(e) => onKtKode1(e.target.value)}
                                                placeholder="KR" data-label="Kode kelompok bagian 1" className={`${inputCls} w-24`}
                                            />
                                            <p className="mt-1 text-[11px] text-gray-400">Kode wilayah</p>
                                        </div>
                                        <span className="pb-5 text-gray-400">–</span>
                                        <div>
                                            <input
                                                name="kt_kode_2" value={ktKode2} onChange={(e) => setKtKode2(e.target.value.toUpperCase())}
                                                placeholder="KR01" data-label="Kode kelompok bagian 2" className={`${inputCls} w-28`}
                                            />
                                            <p className="mt-1 text-[11px] text-gray-400">Nomor urut</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMode("pilih")}
                                    className="text-xs font-medium text-gray-500 hover:underline"
                                >
                                    ← Pilih kelompok yang sudah ada
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Kode petani: 3 textfield, semua editable, boleh kosong semua */}
                    <div>
                        <span className="mb-1.5 block text-xs font-medium text-gray-600">Kode Petani / ID Petani</span>
                        <div className="flex items-center gap-2">
                            <div>
                                <input
                                    name="kp1" value={kp1} onChange={(e) => setKp1(e.target.value.toUpperCase())}
                                    placeholder="CAR" data-label="Kode petani bagian 1" className={`${inputCls} w-20`}
                                />
                                <p className="mt-1 text-[11px] text-gray-400">Lembaga</p>
                            </div>
                            <span className="pb-5 text-gray-400">–</span>
                            <div>
                                <input
                                    name="kp2" value={kp2} onChange={(e) => setKp2(e.target.value.toUpperCase())}
                                    placeholder="KR" data-label="Kode petani bagian 2" className={`${inputCls} w-24`}
                                />
                                <p className="mt-1 text-[11px] text-gray-400">Kode wilayah</p>
                            </div>
                            <span className="pb-5 text-gray-400">–</span>
                            <div>
                                <input
                                    name="kp3" value={kp3} onChange={(e) => setKp3(e.target.value.toUpperCase())}
                                    placeholder="001" data-label="Kode petani bagian 3" className={`${inputCls} w-24`}
                                />
                                <p className="mt-1 text-[11px] text-gray-400">Nomor urut</p>
                            </div>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">Contoh: CAR-KR-001</p>
                    </div>
                </div>
            </div>
        </div>
    );
}