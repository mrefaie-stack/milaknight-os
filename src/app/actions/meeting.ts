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

    const existing = await prisma.meetingRequest.findUnique({
        where: { id },
        include: { client: true }
    });
    if (!existing) throw new Error("Meeting not found");
    if (session.user.role === "AM" && existing.client.amId !== session.user.id) throw new Error("Unauthorized Access");

    const meeting = await prisma.meetingRequest.update({
        where: { id },
        data: { status },
        include: { client: true }
    });

    revalidatePath("/am");
    revalidatePath("/admin");
    return meeting;
}

export async function scheduleMeeting(id: string, scheduledAt: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "ADMIN")) throw new Error("Unauthorized");

    const existing = await prisma.meetingRequest.findUnique({
        where: { id },
        include: { client: { include: { accountManager: true } } }
    });
    if (!existing) throw new Error("Meeting not found");
    if (session.user.role === "AM" && existing.client.amId !== session.user.id) throw new Error("Unauthorized Access");

    let meetLink: string | null = null;
    let googleEventId: string | null = null;

    if (session.user.googleAccessToken) {
        try {
            const start = new Date(scheduledAt);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            const res = await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.user.googleAccessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        summary: `Meeting: ${existing.client.name} — ${existing.reason}`,
                        description: `Teams: ${existing.teams}\nRequested via MilaKnight OS`,
                        start: { dateTime: start.toISOString() },
                        end: { dateTime: end.toISOString() },
                        conferenceData: {
                            createRequest: {
                                requestId: id,
                                conferenceSolutionKey: { type: "hangoutsMeet" },
                            },
                        },
                    }),
                }
            );
            if (res.ok) {
                const event = await res.json();
                meetLink = event.hangoutLink ||
                    event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri || null;
                googleEventId = event.id || null;
            }
        } catch {}
    }

    await prisma.meetingRequest.update({
        where: { id },
        data: { status: "SCHEDULED", scheduledAt: new Date(scheduledAt), meetLink, googleEventId },
    });

    const dateStr = new Date(scheduledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    if (existing.client.userId) {
        await prisma.notification.create({
            data: {
                userId: existing.client.userId,
                title: "Meeting Scheduled",
                message: `Your meeting has been scheduled for ${dateStr}${meetLink ? " — Google Meet link is ready" : ""}`,
                type: "SYSTEM",
                link: "/client/meetings",
            },
        });
    }

    const notifyUsers = await prisma.user.findMany({
        where: { role: { in: ["MARKETING_MANAGER", "ADMIN"] } },
    });
    for (const u of notifyUsers) {
        if (u.id === session.user.id) continue;
        await prisma.notification.create({
            data: {
                userId: u.id,
                title: "Meeting Scheduled",
                message: `Meeting with ${existing.client.name} on ${dateStr}${meetLink ? " — Meet link ready" : ""}`,
                type: "SYSTEM",
                link: "/admin/meetings",
            },
        });
        if (meetLink) {
            await sendEmail({
                to: u.email,
                subject: `Meeting Scheduled: ${existing.client.name} — ${dateStr}`,
                html: `<div style="font-family:sans-serif;padding:20px;">
                    <h2>Meeting Scheduled</h2>
                    <p><strong>Client:</strong> ${existing.client.name}</p>
                    <p><strong>Reason:</strong> ${existing.reason}</p>
                    <p><strong>Date:</strong> ${dateStr}</p>
                    <p><strong>Google Meet:</strong> <a href="${meetLink}">${meetLink}</a></p>
                </div>`,
            });
        }
    }

    if (session.user.role === "ADMIN" && existing.client.amId && existing.client.amId !== session.user.id) {
        await prisma.notification.create({
            data: {
                userId: existing.client.amId,
                title: "Meeting Scheduled",
                message: `Meeting with ${existing.client.name} on ${dateStr}`,
                type: "SYSTEM",
                link: "/am/meetings",
            },
        });
    }

    revalidatePath("/am");
    revalidatePath("/admin");
    revalidatePath("/client");
}
