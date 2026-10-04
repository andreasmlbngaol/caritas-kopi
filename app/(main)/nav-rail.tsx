// app/(main)/nav-rail.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, LogOut,
    PanelLeft, PanelLeftClose, UserRound, UsersRound, Key,
    Building2, Sprout, TrendingUp, ShoppingCart, Trees, Landmark, Map, Leaf,
} from "lucide-react";
import { logout } from "./actions";
import Image from "next/image";

type NavUser = {
    name: string;
    role: "ADMIN" | "ENUMERATOR";
};

const menus = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/petani", label: "Petani", icon: UserRound },
    { href: "/desa", label: "Desa", icon: Building2 },
    { href: "/kelompok-tani", label: "Kelompok Tani", icon: UsersRound },
    { href: "/admin/users", label: "Kelola Pengguna", icon: Key, adminOnly: true },
];

// Menu analitik - khusus ADMIN, dipisah per kategori domain.
const analyticsMenus = [
    { href: "/analitik/gap", label: "GAP", icon: Sprout },
    { href: "/analitik/agronomi", label: "Agronomi Plot", icon: Leaf },
    { href: "/analitik/produksi", label: "Produksi", icon: TrendingUp },
    { href: "/analitik/pasar", label: "Pasar & Produk", icon: ShoppingCart },
    { href: "/analitik/konservasi", label: "Konservasi", icon: Trees },
    { href: "/analitik/wilayah", label: "Wilayah & Kelembagaan", icon: Landmark },
    { href: "/analitik/peta", label: "Peta Sebaran", icon: Map },
];

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2)
        .map((w) => w[0]).join("").toUpperCase();
}

export function NavRail({ user, defaultExpanded = false }: { user: NavUser; defaultExpanded?: boolean }) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const pathname = usePathname();

    const isAdmin = user.role === "ADMIN";
    const visibleMenus = menus.filter((m) => !m.adminOnly || isAdmin);

    function toggle() {
        const next = !expanded;
        setExpanded(next);
        // Persist lintas navigasi & sesi (1 tahun)
        document.cookie = `nav-expanded=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    }

    function renderItem(menu: { href: string; label: string; icon: typeof LayoutDashboard }) {
        const active =
            pathname === menu.href ||
            (menu.href !== "/" && pathname.startsWith(menu.href));
        return (
            <Link
                key={menu.href}
                href={menu.href}
                title={expanded ? undefined : menu.label}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                        ? "bg-gray-900 font-medium text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                } ${expanded ? "" : "justify-center px-0"}`}
            >
                <menu.icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`shrink-0 ${active ? "text-jade-300" : ""}`}
                />
                {expanded && <span className="truncate">{menu.label}</span>}
            </Link>
        );
    }

    return (
        <aside
            className={`sticky top-0 flex h-screen shrink-0 flex-col bg-white transition-[width] duration-300 ease-in-out ${
                expanded ? "w-64" : "w-18"
            }`}
        >
            {/* Header: logo jade + toggle */}
            <div className={`flex h-16 items-center ${expanded ? "justify-between px-4" : "justify-center"}`}>
                {expanded && (
                    <div className="flex items-center gap-2.5">
                        <Image
                            src="/caritas_icon.webp"
                            alt="Logo Caritas"
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-lg object-contain"
                        />
                        <span className="text-sm font-semibold tracking-tight">Database Kopi</span>
                    </div>
                )}
                <button
                    onClick={toggle}
                    aria-label={expanded ? "Ciutkan sidebar" : "Luaskan sidebar"}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                    {expanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-1 overflow-x-visible overflow-y-auto px-3 py-2">
                {expanded && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Menu
                    </p>
                )}
                {visibleMenus.map((menu) => renderItem(menu))}

                {isAdmin && (
                    <>
                        {expanded ? (
                            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Analitik
                            </p>
                        ) : (
                            <div className="my-3 border-t border-gray-100" />
                        )}
                        {analyticsMenus.map((menu) => renderItem(menu))}
                    </>
                )}
            </nav>

            {/* Footer: kartu user + logout */}
            <div className="p-3">
                <div className={`rounded-xl bg-gray-50 ${expanded ? "p-3" : "p-2"}`}>
                    {expanded ? (
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-jade-100 text-xs font-semibold text-jade-800">
                                {initials(user.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-gray-400">
                                    {user.role === "ADMIN" ? "Admin" : "Enumerator"}
                                </p>
                            </div>
                            <form action={logout}>
                                <button
                                    title="Logout"
                                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                                >
                                    <LogOut size={16} />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form action={logout} className="flex justify-center">
                            <button
                                title="Logout"
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white hover:text-red-600"
                            >
                                <LogOut size={18} />
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </aside>
    );
}