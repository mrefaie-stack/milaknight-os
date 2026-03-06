"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getAccountManagers() {
    return prisma.user.findMany({
        where: { role: "AM" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" }
    });
}

export async function getClients() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "AM")) {
        throw new Error("Unauthorized");
    }

    const where = session.user.role === "AM" ? { amId: session.user.id } : {};

    return prisma.client.findMany({
        where,
        include: {
            accountManager: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            user: {
                select: {
                    id: true,
                    email: true,
                }
            },
            services: true,
            actionPlans: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
            reports: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function createClient(data: FormData) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const name = data.get("name") as string;
    const industry = data.get("industry") as string;
    const adminEmail = data.get("email") as string;
    const adminPassword = data.get("password") as string;
    const clientPackage = data.get("package") as string || "BASIC";
    const activeServices = data.get("activeServices") as string || ""; // e.g. "Facebook,Instagram"

    if (!name || !adminEmail || !adminPassword) {
        throw new Error("Missing required fields");
    }

    // Create the Client User first
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.create({
        data: {
            email: adminEmail,
            password: hashedPassword,
            role: "CLIENT",
            firstName: name, // generic placeholder
            lastName: "Client",
        }
    });

    const amId = data.get("amId") as string;
    const servicesInput = data.get("services") as string; // comma separated "SEO, Social Media"

    // Create the Client Record
    await prisma.client.create({
        data: {
            name,
            industry,
            accountManager: amId ? { connect: { id: amId } } : undefined,
            user: { connect: { id: user.id } }, // Link the user
            package: clientPackage,
            activeServices: activeServices,
            services: {
                create: servicesInput ? servicesInput.split(",").map(s => ({
                    name: s.trim(),
                    details: "{}" // generic details fallback
                })) : []
            }
        }
    });

    revalidatePath("/admin/clients");
    return { success: true };
}
export async function updateClient(clientId: string, data: any) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.client.update({
        where: { id: clientId },
        data: {
            name: data.name,
            industry: data.industry,
            accountManager: data.amId && data.amId !== "none" ? { connect: { id: data.amId } } : { disconnect: true },
            package: data.package,
            activeServices: data.activeServices,
        }
    });

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true };
}
