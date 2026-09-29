// app/(main)/kelompok-tani/baru/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { pageForm } from "../../layout-cls";
import { KelompokTaniForm } from "../form";
import { createKelompokTani } from "../actions";

export default async function KelompokTaniBaruPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <main className={pageForm}>
            <header className="flex items-center gap-3">
                <Link href="/kelompok-tani" title="Kembali ke daftar" className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg font-semibold tracking-tight">Tambah Kelompok Tani</h1>
            </header>
            <div className="mt-8">
                <KelompokTaniForm action={createKelompokTani} />
            </div>
        </main>
    );
}