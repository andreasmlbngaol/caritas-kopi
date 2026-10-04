// app/(main)/_components/modal.tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal dasar: fokus awal, focus trap, tutup dengan Escape, kembalikan fokus ke
// pemicu saat ditutup, dan ARIA yang benar. Semua dialog lain memakai ini.
export function Modal({
    open,
    onClose,
    title,
    children,
    closeOnBackdrop = true,
    labelledById,
    panelClassName = "max-w-sm",
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    closeOnBackdrop?: boolean;
    labelledById?: string;
    panelClassName?: string;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const restoreRef = useRef<HTMLElement | null>(null);
    const titleId = labelledById ?? "modal-title";

    // Simpan elemen pemicu, lalu pindahkan fokus ke panel saat dibuka.
    useEffect(() => {
        if (!open) return;
        restoreRef.current = document.activeElement as HTMLElement | null;

        const panel = panelRef.current;
        const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
        (first ?? panel)?.focus();

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== "Tab" || !panel) return;
            const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
                (el) => el.offsetParent !== null
            );
            if (items.length === 0) return;
            const firstEl = items[0];
            const lastEl = items[items.length - 1];
            if (e.shiftKey && document.activeElement === firstEl) {
                e.preventDefault();
                lastEl.focus();
            } else if (!e.shiftKey && document.activeElement === lastEl) {
                e.preventDefault();
                firstEl.focus();
            }
        }

        document.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
            restoreRef.current?.focus?.();
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
            onClick={() => closeOnBackdrop && onClose()}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={`w-full rounded-2xl bg-white p-6 shadow-xl outline-none ${panelClassName}`}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id={titleId} className="text-sm font-semibold tracking-tight">
                    {title}
                </h2>
                {children}
            </div>
        </div>
    );
}
