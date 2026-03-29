"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendReminder } from "@/app/actions/notification";

const HR_ROLES = ["ADMIN", "MARKETING_MANAGER", "HR_MANAGER"];
function requireAdmin(): never { throw new Error("Unauthorized"); }

// ─── Employee Directory ───────────────────────────────────────────────────────

export async function getEmployees() {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    return prisma.user.findMany({
        where: { role: { not: "CLIENT" } },
        select: {
            id: true, firstName: true, lastName: true, email: true, role: true,
            createdAt: true, hireDate: true, birthday: true, phone: true,
            department: true, contractType: true, salary: true,
            presence: { select: { status: true, activity: true, updatedAt: true } },
            leaveRequests: {
                where: { status: "PENDING" },
                select: { id: true },
            },
            performanceReviews: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { score: true, period: true, createdAt: true },
            },
        } as any,
        orderBy: { firstName: "asc" },
    });
}

export async function getEmployee(userId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true, firstName: true, lastName: true, email: true, role: true,
            createdAt: true, hireDate: true, birthday: true, phone: true,
            department: true, contractType: true, salary: true,
            presence: { select: { status: true, activity: true, room: true, updatedAt: true } },
            leaveRequests: {
                orderBy: { createdAt: "desc" },
                include: { reviewedBy: { select: { firstName: true, lastName: true } } },
            },
            performanceReviews: {
                orderBy: { createdAt: "desc" },
                include: { reviewer: { select: { firstName: true, lastName: true } } },
            },
            hrNotes: {
                orderBy: { createdAt: "desc" },
                include: { author: { select: { firstName: true, lastName: true } } },
            },
        } as any,
    });
}

export async function updateEmployeeProfile(userId: string, data: {
    hireDate?: string | null;
    birthday?: string | null;
    phone?: string | null;
    department?: string | null;
    contractType?: string | null;
    salary?: number | null;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    await prisma.user.update({
        where: { id: userId },
        data: {
            hireDate: data.hireDate ? new Date(data.hireDate) : null,
            birthday: data.birthday ? new Date(data.birthday) : null,
            phone: data.phone ?? null,
            department: data.department ?? null,
            contractType: data.contractType ?? null,
            salary: data.salary ?? null,
        } as any,
    });

    revalidatePath(`/admin/hr/${userId}`);
}

// ─── Leave Requests ───────────────────────────────────────────────────────────

export async function getMyLeaves() {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");

    return (prisma as any).leaveRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { reviewedBy: { select: { firstName: true, lastName: true } } },
    });
}

export async function getAllLeaves(status?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    return (prisma as any).leaveRequest.findMany({
        where: status ? { status } : {},
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, firstName: true, lastName: true, role: true, department: true } },
            reviewedBy: { select: { firstName: true, lastName: true } },
        },
    });
}

export async function createLeaveRequest(data: {
    type: string;
    startDate: string;
    endDate: string;
    reason?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") throw new Error("Unauthorized");

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const req = await (prisma as any).leaveRequest.create({
        data: {
            userId: session.user.id,
            type: data.type,
            startDate: start,
            endDate: end,
            days,
            reason: data.reason ?? null,
        },
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "HR_MANAGER"] } }, select: { id: true } });
    const name = session.user.name || "A team member";
    for (const admin of admins) {
        await sendReminder(admin.id, `📅 طلب إجازة جديد`, `${name} طلب إجازة من ${data.startDate} إلى ${data.endDate}`, "/admin/hr");
    }

    revalidatePath("/hr/leaves");
    return req;
}

export async function reviewLeave(id: string, status: "APPROVED" | "REJECTED", reviewNote?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    const leave = await (prisma as any).leaveRequest.update({
        where: { id },
        data: { status, reviewedById: session!.user.id, reviewNote: reviewNote ?? null },
        include: { user: { select: { id: true, firstName: true } } },
    });

    // Notify employee
    const emoji = status === "APPROVED" ? "✅" : "❌";
    await sendReminder(
        leave.user.id,
        `${emoji} طلب إجازتك ${status === "APPROVED" ? "تمت الموافقة عليه" : "تم رفضه"}`,
        reviewNote ? `ملاحظة: ${reviewNote}` : "تحقق من تفاصيل الطلب.",
        "/hr/leaves"
    );

    revalidatePath("/admin/hr");
    revalidatePath("/hr/leaves");
}

// ─── Performance Reviews ──────────────────────────────────────────────────────

export async function addPerformanceReview(userId: string, data: {
    period: string;
    score: number;
    strengths?: string;
    improvements?: string;
    goals?: string;
    notes?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    const review = await (prisma as any).performanceReview.create({
        data: {
            userId,
            reviewerId: session.user.id,
            period: data.period,
            score: data.score,
            strengths: data.strengths ?? null,
            improvements: data.improvements ?? null,
            goals: data.goals ?? null,
            notes: data.notes ?? null,
        },
    });

    await sendReminder(
        userId,
        "📊 تقييم أداء جديد",
        `تم إضافة تقييم أداء للفترة ${data.period} بدرجة ${data.score}/5.`,
        "/hr/leaves"
    );

    revalidatePath(`/admin/hr/${userId}`);
    return review;
}

// ─── HR Notes (private) ───────────────────────────────────────────────────────

export async function addHRNote(userId: string, content: string) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    await (prisma as any).hrNote.create({
        data: { userId, authorId: session.user.id, content },
    });

    revalidatePath(`/admin/hr/${userId}`);
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function createAnnouncement(data: {
    title: string;
    content: string;
    targetRoles?: string;
}) {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    const ann = await (prisma as any).hRAnnouncement.create({
        data: {
            title: data.title,
            content: data.content,
            authorId: session.user.id,
            targetRoles: data.targetRoles ?? "ALL",
        },
    });

    // Notify all team members (excluding the sender)
    const targets = await prisma.user.findMany({
        where: { role: { not: "CLIENT" }, id: { not: session.user.id } },
        select: { id: true },
    });
    for (const t of targets) {
        await sendReminder(t.id, `📢 ${data.title}`, data.content.slice(0, 120), "/hr/leaves");
    }

    revalidatePath("/admin/hr");
    return ann;
}

export async function getAnnouncements() {
    return (prisma as any).hRAnnouncement.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { firstName: true, lastName: true } } },
    });
}

// ─── HR Stats ─────────────────────────────────────────────────────────────────

export async function getHRStats() {
    const session = await getServerSession(authOptions);
    if (!session || !HR_ROLES.includes(session.user.role)) requireAdmin();

    const [totalEmployees, pendingLeaves, approvedThisMonth, avgScore] = await Promise.all([
        prisma.user.count({ where: { role: { not: "CLIENT" } } }),
        (prisma as any).leaveRequest.count({ where: { status: "PENDING" } }),
        (prisma as any).leaveRequest.count({
            where: {
                status: "APPROVED",
                createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
        }),
        (prisma as any).performanceReview.aggregate({ _avg: { score: true } }),
    ]);

    return {
        totalEmployees,
        pendingLeaves,
        approvedThisMonth,
        avgScore: Math.round((avgScore._avg?.score ?? 0) * 10) / 10,
    };
}
