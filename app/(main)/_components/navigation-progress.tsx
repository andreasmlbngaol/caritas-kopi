// app/(main)/_components/navigation-progress.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Coffee } from "lucide-react";

export function NavigationProgress() {
    const pathname = usePathname();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const navigatingRef = useRef(false);
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    function clearTimers() {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    }

    function start() {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        clearTimers();
        setVisible(true);
        setProgress(0);
        // Progres semu: cepat di awal, merayap mendekati 90% menunggu server
        timersRef.current.push(setTimeout(() => setProgress(35), 60));
        timersRef.current.push(setTimeout(() => setProgress(55), 500));
        timersRef.current.push(setTimeout(() => setProgress(70), 1400));
        timersRef.current.push(setTimeout(() => setProgress(82), 2800));
        timersRef.current.push(setTimeout(() => setProgress(90), 5000));
        // Pengaman: paksa selesai setelah 10 detik (jaringan sangat lambat)
        timersRef.current.push(setTimeout(done, 10000));
    }

    function done() {
        clearTimers();
        setProgress(100);
        timersRef.current.push(
            setTimeout(() => {
                setVisible(false);
                setProgress(0);
                navigatingRef.current = false;
            }, 400)
        );
    }

    // Selesai saat rute benar-benar berpindah
    useEffect(() => {
        if (navigatingRef.current) done();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;
            if (anchor.target && anchor.target !== "_self") return;

            const href = anchor.getAttribute("href");
            if (!href || !href.startsWith("/")) return;
            if (href.includes("/export/")) return; // link unduh PDF/Word — bukan navigasi
            if (anchor.hasAttribute("data-no-progress")) return;
            // Klik menu halaman yang sedang aktif → tidak ada navigasi
            if (href === window.location.pathname + window.location.search) return;

            start();
        }

        document.addEventListener("click", onClick, true);
        window.addEventListener("popstate", start); // tombol back/forward browser
        return () => {
            document.removeEventListener("click", onClick, true);
            window.removeEventListener("popstate", start);
            clearTimers();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed inset-x-0 top-0 z-[100] transition-opacity duration-300 ${
                visible ? "opacity-100" : "opacity-0"
            }`}
        >
            {/* Bar gradien jade dengan glow */}
            <div className="h-[3px]">
                <div
                    className="h-full rounded-r-full bg-gradient-to-r from-jade-800 via-jade-500 to-jade-300 shadow-[0_0_12px_rgba(21,128,61,0.5)] transition-[width] duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {/* Ikon Coffee menunggangi ujung bar */}
            <div
                className="absolute -top-1.5 -translate-x-1/2 transition-[left] duration-500 ease-out"
                style={{ left: `${progress}%` }}
            >
                <div className="flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-white shadow-md ring-1 ring-jade-200">
                    <Coffee size={13} className="text-jade-700" />
                </div>
            </div>
        </div>
    );
}