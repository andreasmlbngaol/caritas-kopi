// app/(main)/analitik/_components/map-inner.tsx
"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { ACCENT, SERIES } from "./palette";

const idNum = new Intl.NumberFormat("id-ID");
const fmt = (v: number | null | undefined, digits = 0) =>
    v == null ? "-" : idNum.format(Number(v.toFixed?.(digits) ?? v));

export type DesaPoint = {
    lat: number; lng: number; nama: string; kecamatan: string; kabupaten: string;
    luasArealKopiHa: number; petaniKopi: number; penduduk: number; ketinggian: number | null;
};
export type PlotPoint = {
    lat: number; lng: number; luasKopiHa: number; varietas: string | null; hamparan: string | null;
    petani: string; desa: string;
};

// radius proporsional (akar) supaya area ∝ nilai, dengan lantai minimum
const radius = (v: number, max: number, min = 6, scale = 18) =>
    min + (max > 0 ? Math.sqrt(Math.max(v, 0) / max) * scale : 0);

export function MapInner({ desa, plot }: { desa: DesaPoint[]; plot: PlotPoint[] }) {
    const points = [...desa.map((d) => [d.lat, d.lng]), ...plot.map((p) => [p.lat, p.lng])] as [number, number][];
    const center: [number, number] = points.length
        ? [points.reduce((s, p) => s + p[0], 0) / points.length, points.reduce((s, p) => s + p[1], 0) / points.length]
        : [-2.5, 118];
    const zoom = points.length === 1 ? 12 : points.length ? 8 : 5;
    const maxLuas = Math.max(1, ...desa.map((d) => d.luasArealKopiHa));

    return (
        <div className="isolate">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: 520, width: "100%" }} className="z-0 rounded-2xl">
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {desa.map((d, i) => (
                    <CircleMarker
                        key={`d${i}`}
                        center={[d.lat, d.lng]}
                        radius={radius(d.luasArealKopiHa, maxLuas)}
                        pathOptions={{ color: ACCENT, fillColor: ACCENT, fillOpacity: 0.35, weight: 2 }}
                    >
                        <Tooltip direction="top">{d.nama}</Tooltip>
                        <Popup>
                            <div className="space-y-1 text-xs">
                                <p className="text-sm font-semibold">{d.nama}</p>
                                <p className="text-gray-500">Kec. {d.kecamatan}, {d.kabupaten}</p>
                                <p>Luas areal kopi: <b>{fmt(d.luasArealKopiHa)} ha</b></p>
                                <p>Petani kopi: <b>{fmt(d.petaniKopi)}</b></p>
                                <p>Penduduk: <b>{fmt(d.penduduk)}</b></p>
                                {d.ketinggian != null && <p>Ketinggian: <b>{fmt(d.ketinggian)} mdpl</b></p>}
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
                {plot.map((p, i) => (
                    <CircleMarker
                        key={`p${i}`}
                        center={[p.lat, p.lng]}
                        radius={8}
                        pathOptions={{ color: SERIES[2], fillColor: SERIES[2], fillOpacity: 0.6, weight: 2 }}
                    >
                        <Tooltip direction="top">{p.petani}</Tooltip>
                        <Popup>
                            <div className="space-y-1 text-xs">
                                <p className="text-sm font-semibold">{p.petani}</p>
                                <p className="text-gray-500">{p.desa}{p.hamparan ? ` · ${p.hamparan}` : ""}</p>
                                <p>Luas kopi: <b>{fmt(p.luasKopiHa, 2)} ha</b></p>
                                {p.varietas && <p>Varietas: <b>{p.varietas}</b></p>}
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
