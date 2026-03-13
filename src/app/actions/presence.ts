"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Room detection from URL path ────────────────────────────────────────────

function getRoomFromPath(pathname: string): { room: string; activity: string } {
    if (!pathname) return { room: "Lounge", activity: "Available" };
    if (pathname.includes("/action-plans")) return { room: "Strategy Room", activity: "Working on Action Plans" };
    if (pathname.includes("/reports") || pathname.includes("/live")) return { room: "Analytics Hub", activity: "Reviewing Reports" };
    if (pathname.includes("/clients")) return { room: "Client Zone", activity: "Managing Clients" };
    if (pathname.includes("/messages")) return { room: "Messaging", activity: "In Messages" };
    if (pathname.includes("/tasks") || pathname.includes("/clickup")) return { room: "Task Board", activity: "Managing Tasks" };
    if (pathname.includes("/meetings")) return { room: "Meeting Room", activity: "Meeting Prep" };
    if (pathname.includes("/approvals")) return { room: "Admin HQ", activity: "Reviewing Approvals" };
    if (pathname.includes("/admin") || pathname.includes("/am") || pathname.includes("/moderator")) return { room: "Admin HQ", activity: "Administration" };
    return { room: "Lounge", activity: "Available" };
}

// ─── Update presence on navigation ───────────────────────────────────────────

export async function updateMyPresence(pathname: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") return;

    const { room, activity } = getRoomFromPath(pathname);

    await (prisma as any).userPresence.upsert({
        where: { userId: session.user.id },
        update: {
            room,
            activity,
            activityUrl: pathname,
            updatedAt: new Date(),
        },
        create: {
            userId: session.user.id,
            status: "ONLINE",
            room,
            activity,
            activityUrl: pathname,
        },
    });
}

// ─── Manual status change ─────────────────────────────────────────────────────

export async function setMyStatus(status: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") return;

    await (prisma as any).userPresence.upsert({
        where: { userId: session.user.id },
        update: { status, updatedAt: new Date() },
        create: {
            userId: session.user.id,
            status,
            room: "Lounge",
            activity: "Available",
        },
    });

    revalidatePath("/office");
}

// ─── Get all team presence (server component / API) ──────────────────────────

export async function getOfficePresence() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") return [];

    return fetchPresenceData();
}

export async function fetchPresenceData() {
    const users = await (prisma as any).user.findMany({
        where: { role: { not: "CLIENT" } },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            presence: true,
        },
        orderBy: { firstName: "asc" },
    });

    const now = Date.now();

    return users.map((user) => {
        const p = (user as any).presence;
        let status: string = p?.status || "OFFLINE";

        if (p) {
            const msSince = now - new Date(p.updatedAt).getTime();
            if (status !== "MEETING" && status !== "DND" && status !== "OFFLINE") {
                if (msSince > 30 * 60 * 1000) status = "OFFLINE";
                else if (msSince > 10 * 60 * 1000) status = "AWAY";
            }
        }

        return {
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            role: user.role,
            status,
            activity: p?.activity || "Available",
            activityUrl: p?.activityUrl || null,
            room: p?.room || "Lounge",
            updatedAt: p?.updatedAt || null,
            isCurrentUser: false, // filled in by caller
        };
    });
}
