// app/(main)/petani/[id]/edit/page.tsx
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { pageForm } from "../../../layout-cls";
import { getPetani } from "../../queries";
import { updatePetani } from "../../actions";
import { PetaniForm } from "../../form";

export default async function EditPetaniPage({
                                                 params,
                                             }: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { id } = await params;
    const petani = await getPetani(id);

    // 404 untuk dua kasus: tidak ada, atau bukan miliknya (agar tidak bocor info)
    if (!petani) notFound();
    if (session.user.role !== "ADMIN" && petani.createdById !== session.user.id) notFound();

    const updateWithId = updatePetani.bind(null, id);

    return (
        <main className={pageForm}>
            <header className="flex items-center gap-3">
                <Link href="/petani" title="Kembali ke daftar" className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white hover:text-gray-900 hover:shadow-sm hover:ring-1 hover:ring-gray-950/5">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg font-semibold tracking-tight">Edit Data Baseline Petani</h1>
            </header>
            <div className="mt-8">
                <PetaniForm action={updateWithId} defaults={petani} />
            </div>
        </main>
    );
}