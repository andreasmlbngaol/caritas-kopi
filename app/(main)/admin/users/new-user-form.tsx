"use client";

import { useRef, useState, useTransition } from "react";
import { createEnumerator } from "./actions";
import { CredentialsDialog } from "./credentials-dialog";

type Credentials = { username: string; password: string };

export function NewUserForm() {
    const [error, setError] = useState<string | null>(null);
    const [credentials, setCredentials] = useState<Credentials | null>(null);
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await createEnumerator(null, formData);
            if (result?.error) {
                setError(result.error);
            } else if (result?.credentials) {
                setCredentials(result.credentials);
                formRef.current?.reset();
            }
        });
    }

    return (
        <>
            <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                        name="username"
                        placeholder="Username"
                        required
                        className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-gray-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-inset focus:ring-jade-700"
                    />
                    <input
                        name="fullName"
                        placeholder="Nama lengkap"
                        required
                        className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-gray-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-inset focus:ring-jade-700"
                    />
                </div>

                {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <div className="flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-fit rounded-xl bg-jade-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jade-900 disabled:opacity-50"
                    >
                        {isPending ? "Menyimpan..." : "Tambah"}
                    </button>
                    <p className="text-xs text-gray-500">
                        Password dibuat otomatis setelah disimpan.
                    </p>
                </div>
            </form>

            {credentials && (
                <CredentialsDialog credentials={credentials} onClose={() => setCredentials(null)} />
            )}
        </>
    );
}