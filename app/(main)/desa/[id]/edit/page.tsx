import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getBaselineDesa } from "../../queries";
import { updateBaselineDesa } from "../../actions";
import { DesaForm } from "../../form";

export default async function EditDesaPage({
                                               params,
                                           }: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const baseline = await getBaselineDesa(id);

    // 404 untuk dua kasus: tidak ada, atau bukan miliknya (agar tidak bocor info)
    if (!baseline) notFound();
    if (session.user.role !== "ADMIN" && baseline.createdById !== session.user.id) notFound();

    const updateWithId = updateBaselineDesa.bind(null, id);

    return (
        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8">
            <header className="flex items-center gap-3">
                <Link href="/desa" aria-label="Kembali ke daftar" className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg font-semibold tracking-tight">Edit Data Baseline Desa</h1>
            </header>
            <div className="mt-8">
                <DesaForm action={updateWithId} defaults={baseline} />
            </div>
        </main>
    );
}