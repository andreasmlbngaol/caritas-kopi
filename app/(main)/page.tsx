// app/(main)/page.tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {Plus, MapPin, ArrowUpRight, UserRound, UserRoundGroup} from "lucide-react";
import { pageWide } from "./layout-cls";

const idNum = new Intl.NumberFormat("id-ID");

export default async function HomePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const isAdmin = session.user.role === "ADMIN";
    const scope = isAdmin ? {} : { createdById: session.user.id };

    // Admin melihat semua data; enumerator hanya data miliknya [1]
    const [jumlahPetani, jumlahDesa, jumlahKelompok] = await Promise.all([
        prisma.petani.count({ where: scope }),
        prisma.baselineDesa.count({ where: scope }),
        isAdmin
            ? prisma.kelompokTani.count()
            : prisma.kelompokTani.count({
                where: { petani: { some: { createdById: session.user.id } } },
            }),
    ]);

    const stats = [
        { label: "Jumlah Data Petani", value: jumlahPetani, icon: UserRound, href: "/petani" },
        { label: "Jumlah Data Desa", value: jumlahDesa, icon: MapPin, href: "/desa" },
        { label: "Jumlah Kelompok Tani", value: jumlahKelompok, icon: UserRoundGroup, href: "/kelompok-tani" },
    ];

    return (
        <main className={pageWide}>
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Selamat datang, {session.user.name ?? "Pengguna"}
                    {isAdmin ? " — ringkasan seluruh data." : " — ringkasan data yang Anda inputkan."}
                </p>
            </header>

            {/* Dua tombol utama */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                    href="/petani/baru"
                    className="group flex items-center justify-between rounded-2xl bg-jade-800 p-6 text-white shadow-sm transition-colors hover:bg-jade-900"
                >
                    <div>
                        <p className="text-base font-semibold">Input Data Petani</p>
                        <p className="mt-1 text-sm text-jade-100/80">
                            Isi formulir pendataan petani kopi baru
                        </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-transform group-hover:scale-105">
                        <Plus size={22} />
                    </div>
                </Link>
                <Link
                    href="/desa/baru"
                    className="group flex items-center justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 transition-colors hover:ring-jade-700/40"
                >
                    <div>
                        <p className="text-base font-semibold text-gray-900">Input Data Desa</p>
                        <p className="mt-1 text-sm text-gray-500">
                            Isi formulir pendataan desa baru
                        </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors group-hover:bg-jade-50 group-hover:text-jade-800">
                        <Plus size={22} />
                    </div>
                </Link>
            </div>

            {/* Kartu statistik — klik untuk ke menu masing-masing */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((s) => (
                    <Link
                        key={s.label}
                        href={s.href}
                        className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-jade-700/40"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                {s.label}
                            </p>
                            <s.icon size={18} className="text-jade-700" />
                        </div>
                        <p className="mt-2 text-3xl font-semibold tracking-tight">{idNum.format(s.value)}</p>
                        <p className="mt-2 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors group-hover:text-jade-700">
                            Lihat data
                            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </p>
                    </Link>
                ))}
            </div>
        </main>
    );
}