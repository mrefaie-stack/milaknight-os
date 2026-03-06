import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const hashedPassword = await bcrypt.hash("password123", 10);

        const user = await prisma.user.upsert({
            where: { email: "admin@milaknight.com" },
            update: {
                password: hashedPassword,
                role: "ADMIN",
            },
            create: {
                email: "admin@milaknight.com",
                password: hashedPassword,
                role: "ADMIN",
                firstName: "System",
                lastName: "Admin",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Production Admin user has been synchronized successfully.",
            user: user.email
        });
    } catch (error: any) {
        console.error("Admin setup error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
