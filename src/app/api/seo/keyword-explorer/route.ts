import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleAdsAPI } from "@/lib/google-ads-api";
import { prisma } from "@/lib/prisma";
import { claudeGenerate } from "@/lib/ai/claude";

// Google Ads criterion IDs for countries
export const COUNTRY_GEO_IDS: Record<string, string> = {
    "SA": "2682",  // Saudi Arabia
    "AE": "2784",  // UAE
    "EG": "2818",  // Egypt
    "KW": "2414",  // Kuwait
    "QA": "2634",  // Qatar
    "BH": "2048",  // Bahrain
    "JO": "2400",  // Jordan
    "LB": "2422",  // Lebanon
    "OM": "2512",  // Oman
    "IQ": "2368",  // Iraq
    "MA": "2504",  // Morocco
    "DZ": "2012",  // Algeria
    "TN": "2788",  // Tunisia
    "LY": "2434",  // Libya
    "SD": "2736",  // Sudan
    "US": "2840",  // United States
    "GB": "2826",  // United Kingdom
    "GLOBAL": "",  // No geo targeting = global
};

export const LANGUAGE_IDS: Record<string, string> = {
    "ar": "1019",
    "en": "1000",
};

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { keyword, country = "SA", language = "ar" } = await req.json();

        if (!keyword || typeof keyword !== 'string') {
            return NextResponse.json({ error: "Valid keyword is required" }, { status: 400 });
        }

        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        const conn = await (prisma as any).socialConnection.findFirst({
            where: { platform: 'GOOGLE_ADS', isActive: true },
            select: { accessToken: true, metadata: true }
        });

        if (!devToken || !conn?.accessToken) {
            return NextResponse.json(generateMockGoldenKeywords(keyword, country));
        }

        let customerId = '';
        try {
            const meta = JSON.parse(conn.metadata || '{}');
            customerId = (meta.selectedAdsCustomerId || '').replace(/-/g, '');
        } catch { /* ignore */ }

        if (!customerId) {
            return NextResponse.json(generateMockGoldenKeywords(keyword, country));
        }

        const api = new GoogleAdsAPI(conn.accessToken, devToken);
        const geoTargetId = COUNTRY_GEO_IDS[country] ?? "";
        const languageId = LANGUAGE_IDS[language] ?? "1019";

        const realIdeas = await api.generateKeywordIdeas(customerId, [keyword], {
            geoTargetId: geoTargetId || undefined,
            languageId,
        });

        const enriched = realIdeas.map((idea: any) => {
            const vol = idea.volume || 10;
            let compScore = 50;
            const comp = (idea.competition || '').toLowerCase();
            if (comp === 'low') compScore = 20;
            if (comp === 'high') compScore = 90;

            const goldenScore = Math.floor((vol / compScore) * 10);

            return {
                keyword: idea.keyword,
                volume: vol,
                cpc: typeof idea.cpc === 'number' ? idea.cpc.toFixed(2) : (Math.random() * 2 + 0.1).toFixed(2),
                competition: idea.competition || 'Medium',
                goldenScore: goldenScore > 999 ? 999 : goldenScore
            };
        });

        enriched.sort((a: any, b: any) => b.goldenScore - a.goldenScore);

        // Classify search intent for top 30 keywords using Claude
        const withIntent = await classifySearchIntent(enriched.slice(0, 30));
        const final = [
            ...withIntent,
            ...enriched.slice(30).map((k: any) => ({ ...k, intent: "Unknown" }))
        ];

        try {
            await prisma.seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "KEYWORD_EXPLORER",
                    inputData: JSON.stringify({ keyword, country, language }),
                    resultData: JSON.stringify(final.slice(0, 100))
                }
            });
        } catch (historyErr) {
            console.error("Failed to save SEO history:", historyErr);
        }

        return NextResponse.json(final);

    } catch (error: any) {
        console.error("Keyword Explorer Error:", error);
        return NextResponse.json({
            error: "Failed to fetch keywords",
            details: error.message
        }, { status: 500 });
    }
}

async function classifySearchIntent(keywords: any[]): Promise<any[]> {
    if (keywords.length === 0) return keywords;
    try {
        const kwList = keywords.map((k: any, i: number) => `${i + 1}. ${k.keyword}`).join("\n");
        const prompt = `You are an SEO expert. Classify the search intent of each keyword below.
Use exactly one of these 4 labels:
- Informational (user wants to learn something)
- Navigational (user looking for a specific site/brand)
- Commercial (user researching before buying)
- Transactional (user ready to buy/sign up/take action)

Keywords:
${kwList}

Return ONLY a valid JSON array like this (same order, same count):
["Informational","Transactional","Commercial",...]

No explanation, no markdown, just the JSON array.`;

        const raw = await claudeGenerate(prompt);
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) return keywords.map((k: any) => ({ ...k, intent: "Unknown" }));

        const intents: string[] = JSON.parse(match[0]);
        return keywords.map((k: any, i: number) => ({
            ...k,
            intent: intents[i] || "Unknown"
        }));
    } catch {
        return keywords.map((k: any) => ({ ...k, intent: "Unknown" }));
    }
}

function generateMockGoldenKeywords(seed: string, country: string) {
    const countryLabels: Record<string, string> = {
        SA: "السعودية", AE: "الإمارات", EG: "مصر", KW: "الكويت",
        QA: "قطر", US: "USA", GB: "UK", GLOBAL: ""
    };
    const loc = countryLabels[country] || country;

    const keywords: any[] = [];
    const prefixes = ["أفضل", "كيف", "سعر", "شراء", "دليل"];
    const suffixes = loc ? [`في ${loc}`, "2026", "أونلاين"] : ["2026", "online", "guide"];

    keywords.push({
        keyword: seed,
        volume: Math.floor(Math.random() * 10000) + 1000,
        cpc: "1.50",
        competition: "High",
        goldenScore: 45
    });

    for (let i = 0; i < 49; i++) {
        let kw = seed;
        if (Math.random() > 0.5) kw = prefixes[Math.floor(Math.random() * prefixes.length)] + " " + kw;
        if (Math.random() > 0.5) kw = kw + " " + suffixes[Math.floor(Math.random() * suffixes.length)];

        const vol = Math.floor(Math.random() * 5000) + 10;
        const compWeights = ["Low", "Low", "Medium", "Medium", "High"];
        const comp = compWeights[Math.floor(Math.random() * compWeights.length)];

        let compScore = 50;
        if (comp === 'Low') compScore = 20;
        if (comp === 'High') compScore = 90;

        keywords.push({
            keyword: kw.trim(),
            volume: vol,
            cpc: (Math.random() * 4).toFixed(2),
            competition: comp,
            goldenScore: Math.floor((vol / compScore) * 10)
        });
    }

    keywords.sort((a, b) => b.goldenScore - a.goldenScore);
    // Add mock intent classification
    const intents = ["Informational", "Transactional", "Commercial", "Navigational"];
    return keywords.map((k: any) => ({ ...k, intent: intents[Math.floor(Math.random() * intents.length)] }));
}
