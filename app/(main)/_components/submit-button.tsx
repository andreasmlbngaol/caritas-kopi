// app/(main)/_components/submit-button.tsx
"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type Missing = { required: string[]; optional: string[] };

function labelFor(
    el: HTMLInputElement | HTMLSelectElement,
    form: HTMLFormElement
): string {
    if (el.dataset.label) return el.dataset.label;
    if (el.id) {
        const l = form.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        const text = l?.textContent?.replace("*", "").trim();
        if (text) return text;
    }
    return el.name;
}

export function SubmitButton({ label = "Simpan Data" }: { label?: string }) {
    const { pending } = useFormStatus(); // harus dirender di dalam <form>
    const [missing, setMissing] = useState<Missing | null>(null);
    const formRef = useRef<HTMLFormElement | null>(null);

    function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
        const form = e.currentTarget.closest("form");
        if (!form) return;

        e.preventDefault();
        if (!form.reportValidity()) return;
        formRef.current = form;

        const required: string[] = [];
        const optional: string[] = [];
        const doneGroups = new Set<string>();

        form
            .querySelectorAll<HTMLInputElement | HTMLSelectElement>(
                "input[name], select[name]"
            )
            .forEach((el) => {
                if (el.name.startsWith("$ACTION_")) return;
                if (el.dataset.skipCheck !== undefined) return;
                if (el.closest("[data-segmented]")) return;

                const requires = el.dataset.requires;
                if (requires) {
                    const dep = form.querySelector<HTMLInputElement>(`[name="${requires}"]`);
                    if (!dep || dep.value !== "true") return;
                }

                const requiresValue = el.dataset.requiresValue;
                if (requiresValue) {
                    const dep = form.querySelector<HTMLInputElement>(`[name="${requiresValue}"]`);
                    if (!dep || !dep.value) return;
                }

                const groupEl = el.closest<HTMLElement>("[data-group]");
                if (groupEl) {
                    const gname = groupEl.dataset.group!;
                    if (doneGroups.has(gname)) return;
                    const inputs = Array.from(
                        groupEl.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
                            "input[name], select[name]"
                        )
                    );
                    if (inputs.every((i) => !i.value)) {
                        doneGroups.add(gname);
                        optional.push(gname);
                        return;
                    }
                    if (el.value) return;
                    optional.push(`${gname} – ${el.dataset.label ?? labelFor(el, form)}`);
                    return;
                }

                if (el.value) return;
                const label = labelFor(el, form);
                if (el.required || el.dataset.required !== undefined) required.push(label);
                else optional.push(label);
            });

        if (required.length === 0 && optional.length === 0) {
            form.requestSubmit();
        } else {
            setMissing({ required, optional });
        }
    }

    function confirmSubmit() {
        setMissing(null);
        formRef.current?.requestSubmit();
    }

    const hasRequired = (missing?.required.length ?? 0) > 0;

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={pending}
                className="rounded-xl bg-jade-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jade-900 disabled:opacity-50"
            >
                {pending ? "Menyimpan..." : label}
            </button>

            {missing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
                    onClick={() => setMissing(null)}
                >
                    <div
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-sm font-semibold tracking-tight">
                            {hasRequired
                                ? `${missing.required.length} kolom wajib belum diisi`
                                : `${missing.optional.length} kolom belum terisi`}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            {hasRequired
                                ? "Lengkapi kolom wajib terlebih dahulu."
                                : "Kolom yang kosong akan disimpan sebagai 0 atau \"-\"."}
                        </p>

                        {hasRequired && (
                            <div className="mt-3">
                                <p className="text-xs font-semibold text-red-600">Wajib diisi:</p>
                                <ul className="mt-1 max-h-32 space-y-1 overflow-auto rounded-xl bg-red-50 p-3 text-xs text-red-700">
                                    {missing.required.map((m) => (
                                        <li key={m}>• {m}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {missing.optional.length > 0 && (
                            <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-500">
                                    Opsional — akan disimpan sebagai 0 / &#34;-&#34;:
                                </p>
                                <ul className="mt-1 max-h-48 space-y-1 overflow-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                                    {missing.optional.map((m) => (
                                        <li key={m}>• {m}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setMissing(null)}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                            >
                                Periksa Lagi
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmit}
                                disabled={hasRequired}
                                className="rounded-xl bg-jade-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-jade-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {hasRequired ? "Lengkapi Dulu" : "Ya, Simpan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}