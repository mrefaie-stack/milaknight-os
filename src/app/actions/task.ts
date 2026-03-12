"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";

export async function createInternalTask(data: {
    title: string;
    description?: string;
    type: string;
    clientId: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized");
    }

    const client = await prisma.client.findUnique({
        where: { id: data.clientId },
        include: { marketingManager: true }
    });

    if (!client) throw new Error("Client not found");
    if (!client.mmId) throw new Error("No Marketing Manager assigned to this client");

    const task = await prisma.internalTask.create({
        data: {
            title: data.title,
            description: data.description,
            type: data.type,
            clientId: data.clientId,
            senderId: session.user.id,
            receiverId: client.mmId,
            status: "PENDING",
        },
        include: {
            client: true,
            receiver: true,
        }
    });

    await logActivity(`created internal task: ${data.title} for ${client.name}`, "InternalTask", task.id);

    // Notify Receiver
    await prisma.notification.create({
        data: {
            userId: client.mmId,
            title: "New Task Assigned",
            message: `You have a new task for ${client.name}: ${data.title}`,
            type: "SYSTEM",
            link: "/tasks"
        }
    });

    revalidatePath("/tasks");
    return task;
}

export async function getInternalTasks() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    let where: any = {};
    if (session.user.role === "AM") {
        where = { senderId: session.user.id };
    } else if (session.user.role === "MARKETING_MANAGER") {
        where = { receiverId: session.user.id };
    } else if (session.user.role !== "ADMIN") {
        // Clients/Moderators don't see internal tasks
        return [];
    }

    return prisma.internalTask.findMany({
        where,
        include: {
            client: true,
            sender: true,
            receiver: true,
        },
        orderBy: { createdAt: "desc" }
    });
}

export async function updateTaskStatus(taskId: string, status: string) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const task = await prisma.internalTask.findUnique({
        where: { id: taskId },
        include: { client: true }
    });

    if (!task) throw new Error("Task not found");

    // Only receiver (MM) can update status to IN_PROGRESS or COMPLETED
    if (session.user.role === "MARKETING_MANAGER" && task.receiverId !== session.user.id) {
        throw new Error("Unauthorized Access");
    }

    const updatedTask = await prisma.internalTask.update({
        where: { id: taskId },
        data: { status, feedback: null }, // Clear feedback when status changes
    });

    // Notify Sender
    await prisma.notification.create({
        data: {
            userId: task.senderId,
            title: "Task Status Updated",
            message: `Task for ${task.client.name} "${task.title}" is now ${status}`,
            type: "SYSTEM",
            link: "/tasks"
        }
    });

    revalidatePath("/tasks");
    return updatedTask;
}

export async function requestTaskFix(taskId: string, feedback: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MARKETING_MANAGER") {
        throw new Error("Unauthorized");
    }

    const task = await prisma.internalTask.findUnique({
        where: { id: taskId },
        include: { client: true }
    });

    if (!task || task.receiverId !== session.user.id) throw new Error("Unauthorized Access");

    const updatedTask = await prisma.internalTask.update({
        where: { id: taskId },
        data: {
            status: "NEED_FIX",
            feedback
        }
    });

    // Notify Sender (AM)
    await prisma.notification.create({
        data: {
            userId: task.senderId,
            title: "Fix Requested on Task",
            message: `Marketing Manager requested fixes for task "${task.title}": ${feedback}`,
            type: "SYSTEM",
            link: "/tasks"
        }
    });

    revalidatePath("/tasks");
    return updatedTask;
}

export async function editInternalTask(taskId: string, data: {
    title: string;
    description?: string;
    type: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    const task = await prisma.internalTask.findUnique({
        where: { id: taskId }
    });

    if (!task || (task.senderId !== session.user.id && session.user.role !== "ADMIN")) {
        throw new Error("Unauthorized Access");
    }

    const updatedTask = await prisma.internalTask.update({
        where: { id: taskId },
        data: {
            title: data.title,
            description: data.description,
            type: data.type,
            status: "PENDING", // Reset to pending if edited
            feedback: null
        },
        include: {
            client: true
        }
    });

    // Notify Receiver (MM)
    await prisma.notification.create({
        data: {
            userId: task.receiverId,
            title: "Task Updated",
            message: `Task for ${updatedTask.client.name} "${updatedTask.title}" has been updated.`,
            type: "SYSTEM",
            link: "/tasks"
        }
    });

    revalidatePath("/tasks");
    return updatedTask;
}
