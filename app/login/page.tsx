"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { login } from "./actions";
import Image from "next/image";

function LoginForm() {
    const [error, formAction, isPending] = useActionState(login, null);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <form action={formAction} className="flex flex-col gap-4">
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                {/* ...input username & password tidak berubah... */}
                <div>
                    <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Username
                    </label>
                    <input
                        id="username" name="username" type="text" required autoComplete="username"
                        className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-gray-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-inset focus:ring-jade-700"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                        Kata Sandi
                    </label>
                    <input
                        id="password" name="password" type="password" required autoComplete="current-password"
                        className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm ring-1 ring-inset ring-gray-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-inset focus:ring-jade-700"
                    />
                </div>
                {error && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}
                <button
                    type="submit" disabled={isPending}
                    className="mt-1 rounded-xl bg-jade-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-jade-900 disabled:opacity-50"
                >
                    {isPending ? "Memproses..." : "Masuk"}
                </button>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-6 flex flex-col items-center text-center">
                    <Image
                        src="/caritas_icon.webp"
                        alt="Logo Caritas"
                        width={128}
                        height={128}
                        priority
                        className="h-16 w-16 rounded-2xl object-contain"
                    />
                    <h1 className="mt-4 text-lg font-semibold tracking-tight">Database Kopi</h1>
                </div>

                <Suspense>
                    <LoginForm />
                </Suspense>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Hubungi admin jika belum punya akun atau lupa password.
                </p>
            </div>
        </main>
    );
}