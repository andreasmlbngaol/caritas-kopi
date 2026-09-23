// app/(main)/desa/baru/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DesaForm } from "../form";
import { createBaselineDesa } from "../actions";

export default async function DesaBaruPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
            <header className="flex items-center gap-3">
                <Link href="/desa" title="Kembali ke daftar" className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg font-semibold tracking-tight">Formulir Data Baseline Desa</h1>
            </header>
            <div className="mt-8">
                <DesaForm action={createBaselineDesa} />
            </div>
        </main>
    );
}