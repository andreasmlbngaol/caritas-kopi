// app/(main)/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <main className="p-8">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-gray-600">
                Selamat datang, <strong>{session.user.name}</strong>.
            </p>
            {/* Ringkasan data baseline nanti di sini */}
        </main>
    );
}