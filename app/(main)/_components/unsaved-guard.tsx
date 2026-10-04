// app/(main)/_components/unsaved-guard.tsx
"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lindungi form dari kehilangan data:
 * 1. beforeunload - tutup tab / reload / tutup browser
 * 2. Cegat klik link internal (App Router) - tombol back, nav rail, dll.
 * Dipasang di dalam <form>. Dialog hanya muncul bila form sudah diubah
 * dan tidak sedang dalam proses submit.
 */
export function UnsavedGuard() {
    const dirtyRef = useRef(false);
    const submittingRef = useRef(false);
    const bypassRef = useRef(false);
    const pendingLinkRef = useRef<HTMLAnchorElement | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        function onInput(e: Event) {
            const t = e.target as HTMLElement;
            if (t.closest("form")) dirtyRef.current = true;
        }

        function onSubmit() {
            submittingRef.current = true;
        }

        function onBeforeUnload(e: BeforeUnloadEvent) {
            if (!dirtyRef.current || submittingRef.current) return;
            e.preventDefault();
            e.returnValue = "";
        }

        // Fase capture: jalan sebelum handler React/Next → link internal bisa dicegat
        function onClickCapture(e: MouseEvent) {
            if (bypassRef.current) {
                bypassRef.current = false;
                return;
            }
            if (!dirtyRef.current || submittingRef.current) return;
            if (e.defaultPrevented || e.button !== 0) return;
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // buka tab baru - biarkan

            const anchor = (e.target as HTMLElement).closest("a");
            if (!anchor) return;
            if (anchor.target && anchor.target !== "_self") return;
            const href = anchor.getAttribute("href");
            if (!href || !href.startsWith("/")) return; // hanya link internal

            e.preventDefault();
            e.stopPropagation();
            pendingLinkRef.current = anchor;
            setConfirmOpen(true);
        }

        document.addEventListener("input", onInput, true);
        document.addEventListener("submit", onSubmit, true);
        document.addEventListener("click", onClickCapture, true);
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            document.removeEventListener("input", onInput, true);
            document.removeEventListener("submit", onSubmit, true);
            document.removeEventListener("click", onClickCapture, true);
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, []);

    function leave() {
        const link = pendingLinkRef.current;
        pendingLinkRef.current = null;
        setConfirmOpen(false);
        if (link) {
            bypassRef.current = true; // klik berikutnya dibiarkan lewat
            link.click();
        }
    }

    function stay() {
        pendingLinkRef.current = null;
        setConfirmOpen(false);
    }

    if (!confirmOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
            onClick={stay}
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-sm font-semibold tracking-tight">
                    Tinggalkan halaman ini?
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Perubahan yang belum disimpan akan hilang.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={stay}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                    >
                        Tetap di Sini
                    </button>
                    <button
                        type="button"
                        onClick={leave}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                        Tinggalkan
                    </button>
                </div>
            </div>
        </div>
    );
}