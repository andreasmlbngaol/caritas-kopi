// app/(main)/number-wheel-guard.tsx
"use client";

import { useEffect } from "react";

export function NumberWheelGuard() {
    useEffect(() => {
        function onWheel() {
            const el = document.activeElement;
            if (el instanceof HTMLInputElement && el.type === "number") {
                el.blur();
            }
        }
        document.addEventListener("wheel", onWheel, { passive: true });
        return () => document.removeEventListener("wheel", onWheel);
    }, []);
    return null;
}