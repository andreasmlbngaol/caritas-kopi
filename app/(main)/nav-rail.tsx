// app/(main)/nav-rail.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, UsersRound, MapPin, Users, LogOut,
    PanelLeft, PanelLeftClose, Coffee,
} from "lucide-react";
import { logout } from "./actions";

type NavUser = {
    name: string;
    role: "ADMIN" | "ENUMERATOR";
};

const menus = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/petani", label: "Petani", icon: UsersRound },   // ← dari Sprout
    { href: "/desa", label: "Desa", icon: MapPin },
    { href: "/admin/users", label: "Kelola Pengguna", icon: Users, adminOnly: true },
];

function initials(name: string) {
    return name.split(" ").filter(Boolean).slice(0, 2)
        .map((w) => w[0]).join("").toUpperCase();
}

export function NavRail({ user }: { user: NavUser }) {
    const [expanded, setExpanded] = useState(true);
    const pathname = usePathname();

    const visibleMenus = menus.filter((m) => !m.adminOnly || user.role === "ADMIN");

    return (
        <aside
            className={`sticky top-0 flex h-screen shrink-0 flex-col bg-white transition-[width] duration-300 ease-in-out ${
                expanded ? "w-64" : "w-[72px]"
            }`}
        >
            {/* Header: logo jade + toggle */}
            <div className={`flex h-16 items-center ${expanded ? "justify-between px-4" : "justify-center"}`}>
                {expanded && (
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade-800 text-white">
                            <Coffee size={16} />
                        </div>
                        <span className="text-sm font-semibold tracking-tight">Baseline Kopi</span>
                    </div>
                )}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    aria-label={expanded ? "Ciutkan sidebar" : "Luaskan sidebar"}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                    {expanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 space-y-1 px-3 py-2">
                {expanded && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Menu
                    </p>
                )}
                {visibleMenus.map((menu) => {
                    const active =
                        pathname === menu.href ||
                        (menu.href !== "/" && pathname.startsWith(menu.href));
                    return (
                        <Link
                            key={menu.href}
                            href={menu.href}
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

                            {!expanded && (
                                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {menu.label}
                </span>
                            )}
                        </Link>
                    );
                })}
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