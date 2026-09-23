// app/login/actions.ts
"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function login(
    _prevState: string | null,
    formData: FormData
): Promise<string | null> {
    const callbackUrl = formData.get("callbackUrl");
    // Guard: hanya izinkan path internal, cegah open redirect ke situs luar
    const redirectTo =
        typeof callbackUrl === "string" && callbackUrl.startsWith("/")
            ? callbackUrl
            : "/";

    try {
        await signIn("credentials", {
            username: formData.get("username"),
            password: formData.get("password"),
            redirectTo,
        });
        return null;
    } catch (error) {
        if (error instanceof AuthError) {
            return "Username atau password salah";
        }
        throw error;
    }
}