"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function getTeamMembers() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    return prisma.user.findMany({
        where: { role: { in: ["AM", "MODERATOR", "MARKETING_MANAGER"] } },
        include: {
            _count: {
                select: { 
                    clients: true,
                    mmClients: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function createTeamMember(data: FormData) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    const email = data.get("email") as string;
    const password = data.get("password") as string;
    const firstName = data.get("firstName") as string;
    const lastName = data.get("lastName") as string;

    if (!email || !password || !firstName || !lastName) {
        throw new Error("Missing fields");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role: data.get("role") as string || "AM"
        }
    });

    await logActivity(`added new team member: ${firstName} ${lastName}`, "User", user.id);

    revalidatePath("/admin/team");
    return { success: true, user };
}

export async function deleteTeamMember(id: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    // Check if AM or MM has assigned clients
    const amClientCount = await prisma.client.count({ where: { amId: id } });
    const mmClientCount = await prisma.client.count({ where: { mmId: id } });
    
    if (amClientCount > 0 || mmClientCount > 0) {
        throw new Error("Cannot delete user with assigned clients. Reassign them first.");
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/team");
    return { success: true };
}
export async function getUser(id: string) {
    return prisma.user.findUnique({
        where: { id },
        select: { id: true, firstName: true, lastName: true, role: true }
    });
}
export async function updateTeamMember(userId: string, data: any) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
        }
    });

    await logActivity(`updated info for team member: ${user.firstName} ${user.lastName}`, "User", userId);

    revalidatePath("/admin/team");
    return { success: true };
}

export async function updateUserCredentials(userId: string, data: { email?: string, password?: string, firstName?: string, lastName?: string, role?: string }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.role) updateData.role = data.role;

    if (data.password && data.password.trim() !== "") {
        updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data: updateData
    });

    revalidatePath("/admin/team");
    revalidatePath("/admin/clients");

    return { success: true, user: { id: user.id, email: user.email } };
}
