"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getGlobalServices() {
    return prisma.globalService.findMany({
        orderBy: { nameEn: "asc" }
    });
}

export async function createGlobalService(data: FormData) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const nameAr = data.get("nameAr") as string;
    const nameEn = data.get("nameEn") as string;
    const descriptionAr = data.get("descriptionAr") as string;
    const descriptionEn = data.get("descriptionEn") as string;
    const icon = data.get("icon") as string;

    if (!nameAr || !nameEn) {
        throw new Error("Names are required");
    }

    await prisma.globalService.create({
        data: {
            nameAr,
            nameEn,
            descriptionAr,
            descriptionEn,
            icon: icon || "Zap",
        }
    });

    revalidatePath("/admin/services");
    return { success: true };
}

export async function updateGlobalService(id: string, data: any) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.globalService.update({
        where: { id },
        data: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            descriptionAr: data.descriptionAr,
            descriptionEn: data.descriptionEn,
            icon: data.icon,
        }
    });

    revalidatePath("/admin/services");
    return { success: true };
}

export async function deleteGlobalService(id: string) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.globalService.delete({
        where: { id }
    });

    revalidatePath("/admin/services");
    return { success: true };
}
