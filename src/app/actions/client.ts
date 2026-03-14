"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function getAccountManagers() {
    return prisma.user.findMany({
        where: { OR: [{ role: "AM" }, { role: "ACCOUNT_MANAGER" }] },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" }
    });
}

export async function getMarketingManagers() {
    return prisma.user.findMany({
        where: { role: "MARKETING_MANAGER" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" }
    });
}

export async function getClients() {
    const session = await getServerSession(authOptions);
    const ALLOWED = ["ADMIN", "AM", "MODERATOR", "MARKETING_MANAGER", "ART_LEADER", "CONTENT_LEADER", "SEO_LEAD"];
    if (!session || !ALLOWED.includes(session.user.role)) {
        throw new Error("Unauthorized");
    }

    const where = (session.user.role === "AM") 
        ? { amId: session.user.id } 
        : (session.user.role === "MARKETING_MANAGER")
            ? { mmId: session.user.id }
            : {};

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
            marketingManager: {
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

    // New fields (Bilingual)
    const briefAr = data.get("briefAr") as string || "";
    const briefEn = data.get("briefEn") as string || "";
    const deliverablesAr = data.get("deliverablesAr") as string || "";
    const deliverablesEn = data.get("deliverablesEn") as string || "";

    // Legacy/Combined fallback (optional, for backward compatibility during transition)
    const brief = data.get("brief") as string || (briefAr || briefEn);
    const deliverables = data.get("deliverables") as string || (deliverablesAr || deliverablesEn);

    // Social Links
    const facebook = data.get("facebook") as string || "";
    const instagram = data.get("instagram") as string || "";
    const linkedin = data.get("linkedin") as string || "";
    const tiktok = data.get("tiktok") as string || "";
    const twitter = data.get("twitter") as string || "";
    const snapchat = data.get("snapchat") as string || "";
    const youtube = data.get("youtube") as string || "";
    const website = data.get("website") as string || "";

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
    const mmId = data.get("mmId") as string;
    const servicesInput = data.get("services") as string; // comma separated globalServiceIds

    // Create the Client Record
    const client = await prisma.client.create({
        data: {
            name,
            industry,
            accountManager: amId && amId !== "none" ? { connect: { id: amId } } : undefined,
            marketingManager: mmId && mmId !== "none" ? { connect: { id: mmId } } : undefined,
            user: { connect: { id: user.id } }, // Link the user
            package: clientPackage,
            activeServices: activeServices,
            briefAr,
            briefEn,
            deliverablesAr,
            deliverablesEn,
            brief,
            deliverables,
            facebook,
            instagram,
            linkedin,
            tiktok,
            twitter,
            snapchat,
            youtube,
            website,
            ...(Number(data.get("seoScore")) ? { seoScore: Number(data.get("seoScore")) } : {}),
            ...(Number(data.get("monthlyFee")) ? { monthlyFee: Number(data.get("monthlyFee")) } : {}),
            services: {
                create: servicesInput ? servicesInput.split(",").filter(id => id.trim()).map(id => ({
                    globalService: { connect: { id: id.trim() } }
                })) : []
            }
        }
    });

    await logActivity(`added new client: ${client.name}`, "User", user.id);

    revalidatePath("/admin/clients");
    return { success: true };
}
export async function updateClient(clientId: string, data: any) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
            name: data.name,
            industry: data.industry,
            accountManager: data.amId && data.amId !== "none" ? { connect: { id: data.amId } } : { disconnect: true },
            marketingManager: data.mmId && data.mmId !== "none" ? { connect: { id: data.mmId } } : { disconnect: true },
            package: data.package,
            activeServices: data.activeServices,
            briefAr: data.briefAr,
            briefEn: data.briefEn,
            deliverablesAr: data.deliverablesAr,
            deliverablesEn: data.deliverablesEn,
            brief: data.brief,
            deliverables: data.deliverables,
            facebook: data.facebook,
            instagram: data.instagram,
            linkedin: data.linkedin,
            tiktok: data.tiktok,
            twitter: data.twitter,
            snapchat: data.snapchat,
            youtube: data.youtube,
            website: data.website,
            seoScore: Number(data.seoScore) || 0,
            monthlyFee: Number(data.monthlyFee) || 0,
            services: data.serviceIds ? {
                deleteMany: {},
                create: data.serviceIds.map((id: string) => ({
                    globalService: { connect: { id } }
                }))
            } : undefined
        }
    });

    await logActivity(`updated profile for client: ${updatedClient.name}`, "User", updatedClient.userId || clientId);

    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${clientId}`);
    return { success: true };
}

export async function deleteClient(clientId: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { userId: true, name: true }
    });

    if (!client) {
        throw new Error("Client not found");
    }

    // Deleting the user will cascade delete the client due to onDelete: Cascade in schema
    if (client.userId) {
        await prisma.user.delete({
            where: { id: client.userId }
        });
    } else {
        await prisma.client.delete({
            where: { id: clientId }
        });
    }

    await logActivity(`deleted client: ${client.name}`, "User", session.user.id);

    revalidatePath("/admin/clients");
    return { success: true };
}
