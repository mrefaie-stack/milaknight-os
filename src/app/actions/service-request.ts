"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createServiceRequest(globalServiceId: string, notes?: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") {
        throw new Error("Unauthorized");
    }

    const client = await prisma.client.findFirst({
        where: { userId: session.user.id }
    });

    if (!client) {
        throw new Error("Client profile not found");
    }

    // Check if a pending request already exists for this service
    const existing = await prisma.serviceRequest.findFirst({
        where: {
            clientId: client.id,
            globalServiceId,
            status: "PENDING"
        }
    });

    if (existing) {
        throw new Error("You already have a pending request for this service.");
    }

    // Check if client already has this service
    const hasService = await prisma.service.findFirst({
        where: {
            clientId: client.id,
            globalServiceId
        }
    });

    if (hasService) {
        throw new Error("You already have this service active.");
    }

    const request = await prisma.serviceRequest.create({
        data: {
            clientId: client.id,
            globalServiceId,
            notes,
            status: "PENDING"
        }
    });

    revalidatePath("/client/services");
    revalidatePath("/client");

    return request;
}

export async function getClientRequests() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") {
        throw new Error("Unauthorized");
    }

    const client = await prisma.client.findFirst({
        where: { userId: session.user.id }
    });

    if (!client) return [];

    return prisma.serviceRequest.findMany({
        where: { clientId: client.id },
        include: { globalService: true },
        orderBy: { createdAt: "desc" }
    });
}

export async function getAllServiceRequests() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "AM")) {
        throw new Error("Unauthorized");
    }

    return prisma.serviceRequest.findMany({
        include: {
            globalService: true,
            client: true
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function updateRequestStatus(requestId: string, status: "APPROVED" | "REJECTED", adminNotes?: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "AM")) {
        throw new Error("Unauthorized");
    }

    const request = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: { client: true, globalService: true }
    });

    if (!request) throw new Error("Request not found");

    const updated = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: {
            status,
            adminNotes
        }
    });

    // If approved, add the service to the client
    if (status === "APPROVED") {
        await prisma.service.create({
            data: {
                clientId: request.clientId,
                globalServiceId: request.globalServiceId
            }
        });
    }

    revalidatePath("/admin/requests");
    revalidatePath("/client/services");

    return updated;
}
