"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

async function requireAdmin() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Forbidden: hanya admin");
    }
    return session;
}

// Password acak dari alfabet tanpa karakter ambigu (O/0, I/l/1, dst.)
// dan tanpa simbol — aman di-copy ke chat tanpa masalah formatting
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function generatePassword(length = 10): string {
    const bytes = crypto.randomBytes(length);
    return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

const createUserSchema = z.object({
    username: z
        .string()
        .min(3, "Username minimal 3 karakter")
        .max(30)
        .regex(/^[a-z0-9_.]+$/, "Username hanya huruf kecil, angka, titik, underscore"),
    fullName: z.string().min(1, "Nama wajib diisi").max(100),
});

export type CreateUserResult = {
    error?: string;
    credentials?: { username: string; password: string };
} | null;

export async function createEnumerator(
    _prev: CreateUserResult,
    formData: FormData
): Promise<CreateUserResult> {
    await requireAdmin();

    const parsed = createUserSchema.safeParse({
        username: formData.get("username"),
        fullName: formData.get("fullName"),
    });
    if (!parsed.success) {
        return { error: parsed.error.issues[0].message };
    }

    const existing = await prisma.user.findUnique({
        where: { username: parsed.data.username },
    });
    if (existing) return { error: "Username sudah dipakai" };

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
        data: {
            username: parsed.data.username,
            fullName: parsed.data.fullName,
            passwordHash,
            role: "ENUMERATOR",
        },
    });

    revalidatePath("/admin/users");
    return { credentials: { username: parsed.data.username, password } };
}

export type ResetResult = {
    error?: string;
    credentials?: { username: string; password: string };
} | null;

export async function resetUserPassword(
    _prev: ResetResult,
    formData: FormData
): Promise<ResetResult> {
    await requireAdmin();

    const userId = formData.get("userId");
    if (typeof userId !== "string" || !userId) return { error: "User tidak valid" };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User tidak ditemukan" };

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });

    return { credentials: { username: user.username, password } };
}

export async function toggleUserActive(userId: string) {
    const session = await requireAdmin();

    if (userId === session.user.id) return;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    await prisma.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
    });

    revalidatePath("/admin/users");
}