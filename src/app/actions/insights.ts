"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
const CACHE_HOURS = 12;

type InsightType = "INDUSTRY" | "TRENDING" | "COMPETITORS";

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

Based on this client's profile, generate 8 relevant industry news and market updates for their sector.
Each item must be a JSON object with these exact keys:
{ "titleAr": "العنوان بالعربي", "titleEn": "Title in English", "summaryAr": "ملخص قصير بالعربي", "summaryEn": "Short summary in English", "tag": "Category tag", "impact": "HIGH", "emoji": "📈" }

impact must be exactly: HIGH, MEDIUM, or LOW
emoji should be a relevant emoji (📈 📊 🚀 💡 🌐 📱 🏆 💰 🔥 ⚡)
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
    }

    if (type === "TRENDING") {
        return `${context}

Based on this client's profile and industry, generate 10 trending topics, hashtags, and keywords they should know about for their social media and marketing strategy.
Each item must be a JSON object with these exact keys:
{ "topicEn": "Topic Name", "topicAr": "اسم الموضوع", "hashtag": "#HashtagName", "descEn": "Brief description", "descAr": "وصف مختصر", "volume": "1.2M", "growth": "+38%", "platform": "Instagram" }

platform must be one of: Instagram, TikTok, Twitter, LinkedIn, YouTube, Facebook
volume and growth should be realistic estimates
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
    }

    // COMPETITORS
    return `${context}

Based on this client's profile, identify 6 realistic competitors in their market and provide a brief competitive analysis.
Each item must be a JSON object with these exact keys:
{ "name": "Competitor Name", "descEn": "Brief description in English", "descAr": "وصف مختصر بالعربي", "strengths": ["strength 1", "strength 2"], "weaknesses": ["weakness 1", "weakness 2"], "socialPresence": "HIGH", "threat": "MEDIUM" }

socialPresence and threat must be exactly: HIGH, MEDIUM, or LOW
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
}

export async function getClientInsight(type: InsightType): Promise<any[]> {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") throw new Error("Unauthorized");

    // Get client profile
    const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        select: {
            id: true,
            name: true,
            industry: true,
            country: true,
            briefAr: true,
            briefEn: true,
            brief: true,
            deliverablesAr: true,
            deliverablesEn: true,
            deliverables: true,
        },
    });
    if (!client) throw new Error("Client not found");

    // Check cache
    const cached = await prisma.clientInsight.findUnique({
        where: { clientId_type: { clientId: client.id, type } },
    });

    const cacheExpiry = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000);
    if (cached && cached.updatedAt > cacheExpiry) {
        try {
            return JSON.parse(cached.content);
        } catch {
            // corrupted cache — fall through to regenerate
        }
    }

    // Generate with Claude
    const prompt = buildPrompt(type, client);

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: "You are a business intelligence analyst. You generate structured JSON content based on client profiles. Always respond with ONLY a valid JSON array. No markdown code blocks, no explanation, no preamble.",
        messages: [{ role: "user", content: prompt }],
    });

    const rawText = response.content
        .filter((b) => b.type === "text")
        .map((b) => (b as any).text)
        .join("");

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any[];
    try {
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) throw new Error("Not an array");
    } catch {
        throw new Error("AI returned invalid JSON");
    }

    // Upsert into DB (replace, not append)
    await prisma.clientInsight.upsert({
        where: { clientId_type: { clientId: client.id, type } },
        create: { clientId: client.id, type, content: JSON.stringify(parsed) },
        update: { content: JSON.stringify(parsed) },
    });

    return parsed;
}

export async function getInsightLastUpdated(type: InsightType): Promise<Date | null> {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") return null;

    const client = await prisma.client.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
    });
    if (!client) return null;

    const insight = await prisma.clientInsight.findUnique({
        where: { clientId_type: { clientId: client.id, type } },
        select: { updatedAt: true },
    });

    return insight?.updatedAt ?? null;
}
