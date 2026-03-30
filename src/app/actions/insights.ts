"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const CACHE_HOURS = 12;

export type InsightType = "INDUSTRY" | "TRENDING" | "COMPETITORS";

function buildPrompt(type: InsightType, client: any): string {
    const name = client.name || "this client";
    const industry = client.industry || "general business";
    const country = client.country || "the region";
    const brief = client.briefEn || client.brief || "";
    const deliverables = client.deliverablesEn || client.deliverables || "";

    const context = `
Client Name: ${name}
Industry: ${industry}
Country: ${country}
Business Brief: ${brief}
Services/Deliverables: ${deliverables}
`.trim();

    if (type === "INDUSTRY") {
        return `${context}

Based on this client's profile, generate 8 relevant industry news and market insights for their sector.
Each item must be a JSON object with these exact keys:
{ "titleAr": "العنوان بالعربي", "titleEn": "Title in English", "summaryAr": "ملخص قصير بالعربي (2-3 جمل واضحة)", "summaryEn": "Short summary in English (2-3 clear sentences)", "tag": "Category tag", "impact": "HIGH", "emoji": "📈" }

impact must be exactly: HIGH, MEDIUM, or LOW
emoji should be a relevant emoji (📈 📊 🚀 💡 🌐 📱 🏆 💰 🔥 ⚡)
Arabic text must be grammatically correct Modern Standard Arabic, clear and professional.
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
    }

    if (type === "TRENDING") {
        return `${context}

Based on this client's profile and industry, generate 10 trending topics, hashtags, and keywords they should leverage in their social media and marketing strategy.
Each item must be a JSON object with these exact keys:
{ "topicEn": "Topic Name", "topicAr": "اسم الموضوع بالعربي", "hashtag": "#HashtagName", "descEn": "Brief description", "descAr": "وصف مختصر بالعربي", "volume": "1.2M", "growth": "+38%", "platform": "Instagram" }

platform must be one of: Instagram, TikTok, Twitter, LinkedIn, YouTube, Facebook
volume and growth should be realistic estimates for the region/industry
Arabic text must be grammatically correct Modern Standard Arabic.
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
    }

    // COMPETITORS — enhanced prompt
    return `${context}

Based on this client's profile, identify 6 real or realistic competitors in their specific market and provide a detailed competitive analysis.
Each item must be a JSON object with these exact keys:
{
  "name": "Competitor Name",
  "descEn": "Detailed 2-sentence description in English",
  "descAr": "وصف مفصل بجملتين بالعربي الفصيح الواضح",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3", "نقطة قوة 4"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3", "نقطة ضعف 4"],
  "socialMedia": {
    "instagram": "@handle or null",
    "twitter": "@handle or null",
    "linkedin": "linkedin.com/company/handle or null",
    "tiktok": "@handle or null",
    "estimatedFollowers": "25K",
    "activity": "HIGH"
  },
  "socialPresence": "HIGH",
  "threat": "MEDIUM"
}

socialPresence, threat, and socialMedia.activity must be exactly: HIGH, MEDIUM, or LOW
strengths and weaknesses arrays must have 4 items each, written in Arabic (فصيح وواضح).
socialMedia handles should be realistic for the competitor's name/market.
estimatedFollowers should be a realistic estimate.
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
}

async function getClientProfile() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        select: {
            id: true, name: true, industry: true, country: true,
            briefAr: true, briefEn: true, brief: true,
            deliverablesAr: true, deliverablesEn: true, deliverables: true,
        },
    });
    if (!client) throw new Error("Client not found");
    return client;
}

export async function getClientInsight(type: InsightType): Promise<{ items: any[]; createdAt: Date }> {
    const client = await getClientProfile();

    const latest = await prisma.clientInsight.findFirst({
        where: { clientId: client.id, type },
        orderBy: { createdAt: "desc" },
    });

    if (latest) {
        try {
            return { items: JSON.parse(latest.content), createdAt: latest.createdAt };
        } catch {
            return { items: [], createdAt: new Date() };
        }
    }

    return { items: [], createdAt: new Date() };
}

// Internal function to be used by the cron job
export async function generateAndSaveClientInsight(clientId: string, type: InsightType) {
    const client = await prisma.client.findUnique({
        where: { id: clientId }
    });
    
    if (!client) throw new Error("Client not found");

    const prompt = buildPrompt(type, client);
    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "You are a business intelligence analyst for a digital marketing agency in the Arab world. Generate structured JSON content based on client profiles. Always use grammatically correct Modern Standard Arabic (فصحى). Always respond with ONLY a valid JSON array. No markdown code blocks, no explanation, no preamble.",
        messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as any).text)
        .join("");

    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any[];
    try {
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Not a valid array");
    } catch {
        throw new Error("AI returned invalid JSON");
    }

    const requiredKeys: Record<InsightType, string[]> = {
        INDUSTRY: ["titleAr", "titleEn", "summaryAr"],
        TRENDING: ["topicEn", "topicAr", "hashtag"],
        COMPETITORS: ["name", "descEn", "strengths"],
    };
    
    const required = requiredKeys[type];
    const isValid = parsed.every((item) =>
        typeof item === "object" && item !== null && required.every((k) => k in item)
    );
    
    if (!isValid) throw new Error("AI returned unexpected data structure");

    const record = await prisma.clientInsight.create({
        data: { clientId: client.id, type, content: JSON.stringify(parsed) },
    });

    return record;
}

export async function requestInsightRefresh(type: InsightType): Promise<{ ok: boolean; remainingMs?: number; error?: string }> {
    try {
        const client = await getClientProfile();

        const latest = await prisma.clientInsight.findFirst({
            where: { clientId: client.id, type },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        });

        if (latest) {
            const ageMs = Date.now() - latest.createdAt.getTime();
            const cacheLimitMs = CACHE_HOURS * 60 * 60 * 1000;
            if (ageMs < cacheLimitMs) {
                return { ok: false, remainingMs: cacheLimitMs - ageMs };
            }
        }

        await generateAndSaveClientInsight(client.id, type);
        return { ok: true };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[requestInsightRefresh]", type, msg);
        return { ok: false, error: msg };
    }
}

export async function getClientInsightHistory(type: InsightType): Promise<{ id: string; items: any[]; createdAt: Date }[]> {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") return [];

    const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });
    if (!client) return [];

    // All records except the most recent (skip=1)
    const records = await prisma.clientInsight.findMany({
        where: { clientId: client.id, type },
        orderBy: { createdAt: "desc" },
        skip: 1,
        take: 20,
    });

    return records.map((r) => {
        try {
            return { id: r.id, items: JSON.parse(r.content), createdAt: r.createdAt };
        } catch {
            return { id: r.id, items: [], createdAt: r.createdAt };
        }
    });
}

export async function getTeamClientInsight(clientId: string, type: InsightType): Promise<{ items: any[]; createdAt: Date | null }> {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    
    // Only allow non-client/non-moderator roles (Admins, AMs, Marketing Managers, Leaders, Teams)
    const allowedRoles = ["ADMIN", "AM", "MARKETING_MANAGER", "CONTENT_LEADER", "CONTENT_TEAM", "ART_LEADER", "ART_TEAM", "SEO_LEAD", "SEO_TEAM"];
    if (!allowedRoles.includes(session.user.role)) {
        throw new Error("Forbidden: Insufficient permissions to view client insights");
    }

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { amId: true, mmId: true }
    });
    if (!client) throw new Error("Client not found");

    if (session.user.role === "AM" && client.amId !== session.user.id) {
        throw new Error("Forbidden: Insufficient permissions to view these client insights");
    }
    if (session.user.role === "MARKETING_MANAGER" && client.mmId !== session.user.id) {
        throw new Error("Forbidden: Insufficient permissions to view these client insights");
    }

    const latest = await prisma.clientInsight.findFirst({
        where: { clientId, type },
        orderBy: { createdAt: "desc" },
    });

    if (latest) {
        try {
            return { items: JSON.parse(latest.content), createdAt: latest.createdAt };
        } catch {
            return { items: [], createdAt: null };
        }
    }

    return { items: [], createdAt: null };
}

export async function getTeamClientInsightHistory(clientId: string, type: InsightType): Promise<{ id: string; items: any[]; createdAt: Date }[]> {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const allowedRoles = ["ADMIN", "AM", "MARKETING_MANAGER", "CONTENT_LEADER", "CONTENT_TEAM", "ART_LEADER", "ART_TEAM", "SEO_LEAD", "SEO_TEAM"];
    if (!allowedRoles.includes(session.user.role)) return [];

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { amId: true, mmId: true }
    });
    if (!client) return [];

    if (session.user.role === "AM" && client.amId !== session.user.id) {
        return [];
    }
    if (session.user.role === "MARKETING_MANAGER" && client.mmId !== session.user.id) {
        return [];
    }

    // All records except the most recent (skip=1)
    const records = await prisma.clientInsight.findMany({
        where: { clientId, type },
        orderBy: { createdAt: "desc" },
        skip: 1,
        take: 20,
    });

    return records.map((r) => {
        try {
            return { id: r.id, items: JSON.parse(r.content), createdAt: r.createdAt };
        } catch {
            return { id: r.id, items: [], createdAt: r.createdAt };
        }
    });
}
