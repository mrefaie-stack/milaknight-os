"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSeoHistory() {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const history = await (prisma as any).seoAnalysisHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 30
    });

    return history.map((h: any) => ({
        id: h.id,
        url: h.url,
        metaTitle: h.metaTitle,
        metaDesc: h.metaDesc,
        niche: h.niche,
        audience: h.audience,
        keywordsData: h.keywordsData,
        createdAt: h.createdAt.toISOString()
    }));
}
