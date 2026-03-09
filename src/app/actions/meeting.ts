"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";

export async function requestMeeting(data: { reason: string, teams: string[] }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        include: { accountManager: true }
    });

    if (!client) throw new Error("Client profile not found");

    const meeting = await prisma.meetingRequest.create({
        data: {
            clientId: client.id,
            reason: data.reason,
            teams: data.teams.join(", "),
            status: "PENDING"
        }
    });

    // Notify AM
    if (client.amId) {
        await prisma.notification.create({
            data: {
                userId: client.amId,
                title: "New Meeting Request",
                message: `${client.name} has requested a meeting regarding: ${data.reason}`,
                type: "SYSTEM",
                link: "/am/meetings" // We'll need to create this or point to dashboard
            }
        });

        if (client.accountManager?.email) {
            await sendEmail({
                to: client.accountManager.email,
                subject: `New Meeting Request from ${client.name}`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2>Meeting Request</h2>
                        <p><strong>Client:</strong> ${client.name}</p>
                        <p><strong>Reason:</strong> ${data.reason}</p>
                        <p><strong>Required Teams:</strong> ${data.teams.join(", ")}</p>
                        <br/>
                        <p>Please check the system to coordinate.</p>
                    </div>
                `
            });
        }
    }

    // Also notify Admins
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
        await prisma.notification.create({
            data: {
                userId: admin.id,
                title: "Client Meeting Request",
                message: `${client.name} requested a meeting (AM: ${client.accountManager?.firstName || 'None'})`,
                type: "SYSTEM"
            }
        });

        await sendEmail({
            to: admin.email,
            subject: `Alert: Meeting Request - ${client.name}`,
            html: `<p><strong>${client.name}</strong> requested a meeting. Reason: ${data.reason}</p>`
        });
    }

    revalidatePath("/client");
    return meeting;
}

export async function getMeetingRequests() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    let where = {};
    if (session.user.role === "AM") {
        where = { client: { amId: session.user.id } };
    } else if (session.user.role === "CLIENT") {
        const client = await prisma.client.findUnique({ where: { userId: session.user.id } });
        where = { clientId: client?.id };
    }

    return prisma.meetingRequest.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: "desc" }
    });
}

export async function updateMeetingStatus(id: string, status: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) throw new Error("Unauthorized");

    const meeting = await prisma.meetingRequest.update({
        where: { id },
        data: { status },
        include: { client: true }
    });

    revalidatePath("/am");
    revalidatePath("/admin");
    return meeting;
}
