"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const CLICKUP_API = "https://api.clickup.com/api/v2";

// ─── Helper ───────────────────────────────────────────────────────────────────

async function clickupFetch(path: string, token: string) {
    const res = await fetch(`${CLICKUP_API}${path}`, {
        headers: { Authorization: token },
        cache: "no-store",
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`ClickUp API error ${res.status}: ${text}`);
    }
    return res.json();
}

async function getStoredToken(): Promise<{ token: string; teamId: string; userId: number } | null> {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clickupToken: true, clickupTeamId: true },
    });
    if (!user?.clickupToken || !user?.clickupTeamId) return null;

    // Get ClickUp user ID from token
    try {
        const data = await clickupFetch("/user", user.clickupToken);
        return { token: user.clickupToken, teamId: user.clickupTeamId, userId: data.user.id };
    } catch {
        return null;
    }
}

// ─── Connect / Disconnect ─────────────────────────────────────────────────────

export async function getClickupAuthUrl(): Promise<string> {
    const clientId = process.env.CLICKUP_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUri = encodeURIComponent(`${baseUrl}/api/clickup/callback`);
    return `https://app.clickup.com/api?client_id=${clientId}&redirect_uri=${redirectUri}`;
}

export async function connectClickup(token: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        throw new Error("Unauthorized");
    }

    // Validate token by fetching user
    let clickupUser: any;
    try {
        const data = await clickupFetch("/user", token);
        clickupUser = data.user;
    } catch {
        throw new Error("Invalid ClickUp token. Please check and try again.");
    }

    // Get primary team/workspace
    const teamsData = await clickupFetch("/team", token);
    const team = teamsData.teams?.[0];
    if (!team) throw new Error("No ClickUp workspaces found for this token.");

    // Save to DB
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            clickupToken: token,
            clickupTeamId: team.id,
        },
    });

    revalidatePath("/clickup");
    return { success: true, user: clickupUser, team };
}

export async function disconnectClickup() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    await prisma.user.update({
        where: { id: session.user.id },
        data: { clickupToken: null, clickupTeamId: null },
    });

    revalidatePath("/clickup");
    return { success: true };
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function getClickupStatus() {
    const session = await getServerSession(authOptions);
    if (!session) return { connected: false };

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clickupToken: true, clickupTeamId: true },
    });

    if (!user?.clickupToken || !user?.clickupTeamId) return { connected: false };

    try {
        const [userData, teamsData] = await Promise.all([
            clickupFetch("/user", user.clickupToken),
            clickupFetch("/team", user.clickupToken),
        ]);
        const team = teamsData.teams?.find((t: any) => t.id === user.clickupTeamId) || teamsData.teams?.[0];
        return {
            connected: true,
            clickupUser: userData.user,
            team,
            teamId: user.clickupTeamId,
        };
    } catch {
        return { connected: false };
    }
}

// ─── Spaces / Folders / Lists ─────────────────────────────────────────────────

export async function getClickupSpaces() {
    const ctx = await getStoredToken();
    if (!ctx) return [];

    try {
        const data = await clickupFetch(`/team/${ctx.teamId}/space?archived=false`, ctx.token);
        return data.spaces || [];
    } catch {
        return [];
    }
}

export async function getClickupFolders(spaceId: string) {
    const ctx = await getStoredToken();
    if (!ctx) return [];

    try {
        const data = await clickupFetch(`/space/${spaceId}/folder?archived=false`, ctx.token);
        return data.folders || [];
    } catch {
        return [];
    }
}

export async function getClickupLists(folderId: string) {
    const ctx = await getStoredToken();
    if (!ctx) return [];

    try {
        const data = await clickupFetch(`/folder/${folderId}/list?archived=false`, ctx.token);
        return data.lists || [];
    } catch {
        return [];
    }
}

export async function getClickupFolderlessLists(spaceId: string) {
    const ctx = await getStoredToken();
    if (!ctx) return [];

    try {
        const data = await clickupFetch(`/space/${spaceId}/list?archived=false`, ctx.token);
        return data.lists || [];
    } catch {
        return [];
    }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getClickupTasks({
    spaceId,
    listId,
    page = 0,
    filter,
}: {
    spaceId?: string;
    listId?: string;
    page?: number;
    filter?: "overdue" | "in_progress" | "all";
} = {}) {
    const ctx = await getStoredToken();
    if (!ctx) return { tasks: [], last_page: true };

    try {
        let url: string;

        if (listId) {
            url = `/list/${listId}/task?assignees[]=${ctx.userId}&include_closed=false&page=${page}`;
        } else {
            url = `/team/${ctx.teamId}/task?assignees[]=${ctx.userId}&include_closed=false&page=${page}&order_by=due_date`;
            if (spaceId) url += `&space_ids[]=${spaceId}`;
        }

        if (filter === "overdue") {
            url += `&due_date_lt=${Date.now()}`;
        } else if (filter === "in_progress") {
            url += `&statuses[]=in progress&statuses[]=in%20progress`;
        }

        const data = await clickupFetch(url, ctx.token);
        return { tasks: data.tasks || [], last_page: data.last_page ?? true };
    } catch {
        return { tasks: [], last_page: true };
    }
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function getClickupGoals() {
    const ctx = await getStoredToken();
    if (!ctx) return [];

    try {
        const data = await clickupFetch(`/team/${ctx.teamId}/goal`, ctx.token);
        return data.goals || [];
    } catch {
        return [];
    }
}

// ─── Overdue count (for sidebar badge) ───────────────────────────────────────

export async function getClickupOverdueCount(): Promise<number> {
    const session = await getServerSession(authOptions);
    if (!session) return 0;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clickupToken: true, clickupTeamId: true },
    });
    if (!user?.clickupToken || !user?.clickupTeamId) return 0;

    try {
        const userData = await clickupFetch("/user", user.clickupToken);
        const userId = userData.user.id;
        const url = `/team/${user.clickupTeamId}/task?assignees[]=${userId}&due_date_lt=${Date.now()}&include_closed=false&page=0`;
        const data = await clickupFetch(url, user.clickupToken);
        return (data.tasks || []).length;
    } catch {
        return 0;
    }
}

// ─── Due Today (for dashboard widget) ────────────────────────────────────────

export async function getClickupDueTodayTasks() {
    const ctx = await getStoredToken();
    if (!ctx) return null; // null = not connected

    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const endOfDay = startOfDay + 86400000 - 1;

        const url = `/team/${ctx.teamId}/task?assignees[]=${ctx.userId}&due_date_gt=${startOfDay}&due_date_lt=${endOfDay}&include_closed=false&page=0`;
        const data = await clickupFetch(url, ctx.token);
        return data.tasks || [];
    } catch {
        return null;
    }
}

// ─── Single task by URL (for action plan item badge) ─────────────────────────

export async function getClickupTaskByUrl(taskUrl: string) {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { clickupToken: true },
    });
    if (!user?.clickupToken) return null;

    try {
        // Extract task ID from URL: https://app.clickup.com/t/TASKID or /t/WORKSPACE/TASKID
        const match = taskUrl.match(/\/t\/(?:[^/]+\/)?([a-zA-Z0-9]+)$/);
        if (!match) return null;
        const taskId = match[1];

        const data = await clickupFetch(`/task/${taskId}`, user.clickupToken);
        return {
            id: data.id,
            name: data.name,
            status: data.status,
            priority: data.priority,
            url: data.url,
        };
    } catch {
        return null;
    }
}

// ─── Link ClickUp task to content item ───────────────────────────────────────

export async function linkClickupTask(itemId: string, taskUrl: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        throw new Error("Unauthorized");
    }

    const itemToSync = await prisma.contentItem.findUnique({
        where: { id: itemId },
        include: { plan: { include: { client: true } } }
    });
    
    if (!itemToSync) throw new Error("Item not found");
    if (session.user.role === "AM" && itemToSync.plan.client.amId !== session.user.id) throw new Error("Unauthorized Access");
    if (session.user.role === "MARKETING_MANAGER" && itemToSync.plan.client.mmId !== session.user.id) throw new Error("Unauthorized Access");

    const item = await prisma.contentItem.update({
        where: { id: itemId },
        data: { clickupTaskUrl: taskUrl || null },
    });

    revalidatePath(`/am/action-plans/${item.planId}`);
    return { success: true };
}
