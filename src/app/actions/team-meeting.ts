"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const STAFF_ROLES = ["ADMIN", "AM", "MARKETING_MANAGER", "MODERATOR", "CONTENT_TEAM", "CONTENT_LEADER",
    "ART_TEAM", "ART_LEADER", "SEO_TEAM", "SEO_LEAD", "HR_MANAGER"];

export async function getStaffUsers() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") throw new Error("Unauthorized");

    return prisma.user.findMany({
        where: { role: { in: STAFF_ROLES } },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        orderBy: [{ role: "asc" }, { firstName: "asc" }],
    });
}

export async function getTeamMeetings() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") throw new Error("Unauthorized");

    return prisma.teamMeeting.findMany({
        where: {
            OR: [
                { organizerId: session.user.id },
                { attendees: { some: { userId: session.user.id } } },
            ],
        },
        include: {
            organizer: { select: { id: true, firstName: true, lastName: true, role: true } },
            attendees: {
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, role: true } },
                },
            },
        },
        orderBy: { scheduledAt: "asc" },
    });
}

export async function createTeamMeeting(data: {
    title: string;
    description?: string;
    scheduledAt: string;
    attendeeIds: string[];
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") throw new Error("Unauthorized");

    const { title, description, scheduledAt, attendeeIds } = data;

    // Get all attendees (including their emails for Google Calendar)
    const attendeeUsers = await prisma.user.findMany({
        where: { id: { in: attendeeIds } },
        select: { id: true, email: true, firstName: true, lastName: true },
    });

    let meetLink: string | null = null;
    let googleEventId: string | null = null;

    // Create Google Calendar event if organizer has Google token
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
                        summary: title,
                        description: description || "",
                        start: { dateTime: start.toISOString() },
                        end: { dateTime: end.toISOString() },
                        attendees: attendeeUsers.map((u) => ({ email: u.email })),
                        conferenceData: {
                            createRequest: {
                                requestId: `team-${Date.now()}`,
                                conferenceSolutionKey: { type: "hangoutsMeet" },
                            },
                        },
                        guestsCanModifyEvent: false,
                    }),
                }
            );

            if (res.ok) {
                const event = await res.json();
                meetLink =
                    event.hangoutLink ||
                    event.conferenceData?.entryPoints?.find(
                        (ep: any) => ep.entryPointType === "video"
                    )?.uri || null;
                googleEventId = event.id || null;
            }
        } catch {}
    }

    // Create the meeting in DB
    const meeting = await prisma.teamMeeting.create({
        data: {
            title,
            description,
            scheduledAt: new Date(scheduledAt),
            meetLink,
            googleEventId,
            organizerId: session.user.id,
            attendees: {
                create: attendeeIds.map((userId) => ({ userId })),
            },
        },
    });

    // Send notifications to attendees
    const dateStr = new Date(scheduledAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    });
    const organizerName = session.user.name || session.user.email;

    for (const attendee of attendeeUsers) {
        if (attendee.id === session.user.id) continue;
        await prisma.notification.create({
            data: {
                userId: attendee.id,
                title: "New Team Meeting",
                message: `${organizerName} scheduled a meeting: "${title}" on ${dateStr}${meetLink ? " — Meet link ready" : ""}`,
                type: "SYSTEM",
                link: "/admin/meetings",
            },
        });
    }

    revalidatePath("/admin/meetings");
    revalidatePath("/am/meetings");
    return meeting;
}
