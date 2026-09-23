"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteBaselineDesa } from "./actions";

export function DeleteButton({ id, namaDesa }: { id: string; namaDesa: string }) {
    const [open, setOpen] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirmDelete() {
        setPending(true);
        setError(null);
        try {
            await deleteBaselineDesa(id);
            // action me-redirect ke /desa — baris ini hanya jalan sebagai fallback
            setOpen(false);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Gagal menghapus data");
            setPending(false);
        }
    }

    return (
        <>
            <button
                type="button"
                title="Hapus"
                onClick={() => setOpen(true)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
                <Trash2 size={16} />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4"
                    onClick={() => !pending && setOpen(false)}
                >
                    <div
                        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-sm font-semibold tracking-tight">
                            Hapus data baseline?
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Data baseline Desa <strong>{namaDesa}</strong> beserta data kebijakan
                            dan kelembagaannya akan dihapus permanen dan tidak bisa dikembalikan.
                        </p>

                        {error && (
                            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                                {error}
                            </p>
                        )}

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={pending}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={pending}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                {pending ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}