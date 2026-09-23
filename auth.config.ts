import type { NextAuthConfig } from "next-auth";

export default {
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
    providers: [],
    callbacks: {
        authorized({ auth, request }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = request.nextUrl.pathname.startsWith("/login");
            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL("/", request.nextUrl));
                return true;
            }
            if (!isLoggedIn) {
                const url = new URL("/login", request.nextUrl);
                const path = request.nextUrl.pathname + request.nextUrl.search;
                if (path !== "/") url.searchParams.set("callbackUrl", path);
                return Response.redirect(url);
            }
            return true;
        },
    }
} satisfies NextAuthConfig;