import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import {Role} from "@/app/generated/prisma/enums";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                const username = credentials?.username as string;
                const password = credentials?.password as string;
                if(!username || !password) return null;

                const user = await prisma.user.findUnique({
                    where: { username }
                });
                if(!user || !user.isActive) return null;

                const valid = await bcrypt.compare(password, user.passwordHash);
                if(!valid) return null;

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        lastLoginAt: new Date()
                    },
                });

                return {
                    id: user.id,
                    name: user.fullName ?? user.username,
                    role: user.role,
                };
            }
        })
    ],
    callbacks: {
        ...authConfig.callbacks,
        jwt({ token, user }) {
            if(user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        session({ session, token }) {
            if(token) {
                session.user.id = token.id as string;
                session.user.role = token.role as Role;
            }
            return session;
        }
    }
});