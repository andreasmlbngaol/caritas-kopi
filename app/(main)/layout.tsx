import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { NavRail } from "./nav-rail";
import React from "react";
import { NumberWheelGuard } from "./number-wheel-guard";

export default async function MainLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    return (
        <div className="flex min-h-screen">
            <NavRail user={{ name: session.user.name ?? "Pengguna", role: session.user.role }} />
            <div className="min-w-0 flex-1">{children}</div>
            <NumberWheelGuard />
        </div>
    );
}