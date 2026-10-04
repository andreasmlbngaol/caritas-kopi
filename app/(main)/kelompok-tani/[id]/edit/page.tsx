// app/(main)/kelompok-tani/[id]/edit/page.tsx
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageForm } from "../../../layout-cls";
import { KelompokTaniForm } from "../../form";
import { updateKelompokTani } from "../../actions";

export default async function EditKelompokTaniPage({
                                                       params,
                                                   }: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const kt = await prisma.kelompokTani.findUnique({ where: { id } });
    if (!kt) notFound();

    const updateWithId = updateKelompokTani.bind(null, id);

    return (
        <main className={pageForm}>
            <header className="flex items-center gap-3">
                <Link href="/kelompok-tani" aria-label="Kembali ke daftar" className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg font-semibold tracking-tight">Edit Kelompok Tani</h1>
            </header>
            <div className="mt-8">
                <KelompokTaniForm action={updateWithId} defaults={kt} />
            </div>
        </main>
    );
}