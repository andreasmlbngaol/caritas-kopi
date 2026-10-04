import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NewUserForm } from "./new-user-form";
import { ResetPasswordButton } from "./reset-password-button";
import { toggleUserActive } from "./actions";

export default async function UsersPage() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") redirect("/");

    const users = await prisma.user.findMany({
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
        },
    });

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
            <header>
                <h1 className="text-lg font-semibold tracking-tight">Manajemen Pengguna</h1>
                <p className="mt-1 text-sm text-gray-500">Tambah dan kelola akun enumerator.</p>
            </header>

            <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
                <h2 className="mb-4 text-sm font-semibold">Tambah Enumerator</h2>
                <NewUserForm />
            </section>

            <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
                <table className="w-full text-sm">
                    <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <th className="px-5 py-3.5">Pengguna</th>
                        <th className="px-5 py-3.5">Role</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Login Terakhir</th>
                        <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                        <tr key={user.id} className="transition-colors hover:bg-gray-50/50">
                            <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-jade-100 text-[11px] font-semibold text-jade-800">
                                        {(user.fullName ?? user.username).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium leading-tight">{user.fullName ?? "-"}</p>
                                        <p className="text-xs text-gray-400">@{user.username}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-3.5">
                  <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          user.role === "ADMIN"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {user.role === "ADMIN" ? "Admin" : "Enumerator"}
                  </span>
                            </td>
                            <td className="px-5 py-3.5">
                  <span className="flex items-center gap-1.5 text-sm">
                    <span
                        className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-jade-600" : "bg-gray-300"
                        }`}
                    />
                      {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                            </td>
                            <td className="px-5 py-3.5 text-gray-500">
                                {user.lastLoginAt
                                    ? user.lastLoginAt.toLocaleString("id-ID")
                                    : "Belum pernah"}
                            </td>
                            <td className="px-5 py-3.5">
                                <div className="flex items-center justify-end gap-1">
                                    <ResetPasswordButton userId={user.id} />
                                    {user.id !== session.user.id && (
                                        <form action={toggleUserActive.bind(null, user.id)}>
                                            <button className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900">
                                                {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>
        </main>
    );
}