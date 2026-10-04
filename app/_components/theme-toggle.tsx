// app/_components/theme-toggle.tsx
"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

// Pantau kelas `dark` pada <html> (diubah skrip pra-paint & tombol ini).
function subscribe(callback: () => void) {
    const observer = new MutationObserver(callback);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}

function getSnapshot() {
    return document.documentElement.classList.contains("dark");
}

// Hook tema gelap: pantau kelas `dark` pada <html> (diubah skrip pra-paint &
// tombol toggle). Dipakai juga oleh chart/map agar warna SVG ikut tema.
export function useIsDark() {
    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

// Tombol ganti tema terang/gelap. Preferensi disimpan di localStorage;
// kelas `dark` diset sebelum paint oleh skrip di root layout.
export function ThemeToggle({
    collapsed = false,
    className = "",
}: {
    collapsed?: boolean;
    className?: string;
}) {
    const dark = useIsDark();

    function toggle() {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        try {
            localStorage.setItem("theme", next ? "dark" : "light");
        } catch {
            // localStorage bisa gagal (mode privat) - abaikan, tema tetap berubah.
        }
    }

    const label = dark ? "Mode terang" : "Mode gelap";

    return (
        <button
            type="button"
            onClick={toggle}
            title={label}
            aria-label={label}
            aria-pressed={dark}
            className={`flex items-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                collapsed ? "justify-center p-2" : "w-full gap-2.5 px-3 py-2 text-sm"
            } ${className}`}
        >
            {dark ? <Sun size={collapsed ? 18 : 16} /> : <Moon size={collapsed ? 18 : 16} />}
            {!collapsed && <span>{label}</span>}
        </button>
    );
}
