"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { login } from "./actions";
import Image from "next/image";
import { Sprout, MapPin, TrendingUp, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/app/_components/theme-toggle";

const FEATURES = [
    { icon: Sprout, title: "Data petani & GAP" },
    { icon: MapPin, title: "Peta sebaran desa & plot" },
    { icon: TrendingUp, title: "Analitik produksi" },
    { icon: ShieldCheck, title: "Konservasi & wilayah" },
];

function LoginForm() {
    const [error, formAction, isPending] = useActionState(login, null);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
    );
}

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
            <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-950/5 lg:grid-cols-2">
                {/* Toggle tema di pojok kanan atas kartu */}
                <div className="absolute right-3 top-3 z-10">
                    <ThemeToggle collapsed />
                </div>

                {/* Kiri: brand + daftar fitur */}
                <aside className="hidden bg-jade-900 p-10 text-white lg:flex lg:flex-col">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/caritas_icon.webp" alt="Logo Caritas" width={44} height={44} priority
                            className="h-11 w-11 rounded-xl object-contain"
                        />
                        <span className="text-base font-semibold tracking-tight">Database Kopi</span>
                    </div>

                    <p className="mt-8 text-sm text-jade-100/80">Fitur utama:</p>
                    <ul className="mt-3 space-y-3">
                        {FEATURES.map((f) => (
                            <li key={f.title} className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                                    <f.icon size={16} className="text-jade-200" />
                                </span>
                                <span className="text-sm font-medium">{f.title}</span>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Kanan: form */}
                <div className="p-8 sm:p-10">
                    <div className="mb-6 flex items-center gap-3 lg:hidden">
                        <Image
                            src="/caritas_icon.webp" alt="Logo Caritas" width={40} height={40} priority
                            className="h-10 w-10 rounded-xl object-contain"
                        />
                        <span className="text-base font-semibold tracking-tight">Database Kopi</span>
                    </div>

                    <h1 className="text-xl font-semibold tracking-tight">Masuk</h1>
                    <p className="mt-1 text-sm text-gray-500">Gunakan akun yang diberikan admin.</p>

                    <div className="mt-6">
                        <Suspense>
                            <LoginForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </main>
    );
}
