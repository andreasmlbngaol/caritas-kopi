// app/(main)/analitik/_components/map.tsx
"use client";

import dynamic from "next/dynamic";

// Leaflet menyentuh window → render client-side saja.
export const MapView = dynamic(() => import("./map-inner").then((m) => m.MapInner), {
    ssr: false,
    loading: () => (
        <div className="flex h-[520px] items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
            Memuat peta…
        </div>
    ),
});
