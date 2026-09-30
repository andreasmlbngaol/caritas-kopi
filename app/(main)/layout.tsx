import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { NavRail } from "./nav-rail";
import React from "react";
import { NumberWheelGuard } from "./number-wheel-guard";
import { NavigationProgress } from "./_components/navigation-progress";

export default async function MainLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Cookie belum ada → default collapsed (sesuai kebiasaanmu)
    const cookieStore = await cookies();
    const defaultExpanded = cookieStore.get("nav-expanded")?.value === "1";

    return (
        <div className="flex min-h-screen">
            <NavRail
                user={{ name: session.user.name ?? "Pengguna", role: session.user.role }}
                defaultExpanded={defaultExpanded}
            />
            <div className="min-w-0 flex-1">{children}</div>
            <NumberWheelGuard />
            <NavigationProgress />
        </div>
    );
}