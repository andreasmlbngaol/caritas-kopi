import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    const username = process.env.ADMIN_USERNAME!;
    const password = process.env.ADMIN_PASSWORD!;
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { username: username },
        update: {},
        create: {
            username: username,
            passwordHash,
            fullName: "Administrator",
            role: "ADMIN",
        },
    });

    console.log("Admin user ready:", admin.username);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());