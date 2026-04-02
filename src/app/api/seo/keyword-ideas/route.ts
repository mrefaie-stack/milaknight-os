import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import { GoogleAdsAPI } from "@/lib/google-ads-api";
import { prisma } from "@/lib/prisma";
import { COUNTRY_GEO_IDS, LANGUAGE_IDS } from "@/app/api/seo/keyword-explorer/route";

export interface KeywordIdeaResult {
    keyword: string;
    category: "Problem" | "Question" | "Commercial" | "Informational" | "Comparison" | "Local" | "Adjacent";
    rationale: string;
    volume: number;
    cpc: string;
    competition: string;
    goldenScore: number;
    opportunityScore: number;
    isHiddenGem: boolean;
    source: "AI+Data" | "AI Only" | "Data Expanded";
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { keyword, country = "SA", language = "ar" } = await req.json();
        if (!keyword?.trim()) {
            return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 1: Claude AI — Brainstorm diverse keyword ideas
        // ─────────────────────────────────────────────────────────────
        const isArabic = language === "ar" || /[\u0600-\u06FF]/.test(keyword);

        const brainstormPrompt = `You are an elite SEO strategist with deep expertise in ${isArabic ? "Arabic" : "English"} digital markets and search behavior.

A user wants to dominate search for: "${keyword}"

Your mission: Generate 50 high-value keyword ideas that real people actually search for.
Go BEYOND simple variations — think creatively about every angle a real user approaches this topic.

Explore these 7 strategic dimensions:
1. PROBLEM (7 keywords): Pain points, frustrations, challenges that lead someone to search this
2. QUESTION (8 keywords): Actual questions asked (كيف/how, ما هو/what is, لماذا/why, أين/where, متى/when, كم/how much)
3. COMMERCIAL (8 keywords): Searches by someone ready to buy, hire, subscribe, or take action
4. INFORMATIONAL (8 keywords): Searches to learn, understand, or get educated
5. COMPARISON (6 keywords): "X vs Y", "best X", "X alternatives", "X reviews"
6. LOCAL (7 keywords): Country/city-specific versions where location matters
7. ADJACENT (6 keywords): Related topics the SAME audience searches — not the same topic, but same person

CRITICAL RULES:
- Write ALL keywords in ${isArabic ? "Arabic (same language as the seed keyword)" : "English"}
- Make keywords specific enough to have real search volume (avoid 1-word generic terms)
- Each keyword must be genuinely different from the others
- Think like a real user, not an SEO robot
- For LOCAL keywords, use actual Arab city/country names if applicable

Return ONLY valid JSON, no markdown:
{
  "seedAnalysis": "<2-3 sentences about what this keyword reveals about user intent and market opportunity>",
  "ideas": [
    {
      "keyword": "<the keyword exactly as someone would type it>",
      "category": "Problem|Question|Commercial|Informational|Comparison|Local|Adjacent",
      "rationale": "<one sentence: why this specific keyword has search potential>"
    }
  ]
}`;

        const aiRaw = await claudeGenerate(brainstormPrompt);

        let aiData: { seedAnalysis: string; ideas: Array<{ keyword: string; category: string; rationale: string }> };
        try {
            const match = aiRaw.match(/\{[\s\S]*\}/);
            aiData = JSON.parse(match?.[0] || "{}");
        } catch {
            aiData = { seedAnalysis: "", ideas: [] };
        }

        const aiIdeas = (aiData.ideas || []).filter(i => i.keyword?.trim());

        // ─────────────────────────────────────────────────────────────
        // STEP 2: Google Ads — Validate & enrich with real data
        // ─────────────────────────────────────────────────────────────
        let enrichedResults: KeywordIdeaResult[] = [];

        const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        const conn = await (prisma as any).socialConnection.findFirst({
            where: { platform: "GOOGLE_ADS", isActive: true },
            select: { accessToken: true, metadata: true },
        });

        let gadsMap: Map<string, { volume: number; competition: string; cpc: number }> = new Map();

        if (devToken && conn?.accessToken) {
            let customerId = "";
            try {
                const meta = JSON.parse(conn.metadata || "{}");
                customerId = (meta.selectedAdsCustomerId || "").replace(/-/g, "");
            } catch {}

            if (customerId) {
                try {
                    const api = new GoogleAdsAPI(conn.accessToken, devToken);
                    const geoTargetId = COUNTRY_GEO_IDS[country] || undefined;
                    const languageId = LANGUAGE_IDS[language] || "1019";

                    // Send AI keywords + seed to Google Ads (up to 20 seeds)
                    const seedsForGads = [keyword, ...aiIdeas.map(i => i.keyword)].slice(0, 20);
                    const gadsResults = await api.generateKeywordIdeas(customerId, seedsForGads, {
                        geoTargetId: geoTargetId || undefined,
                        languageId,
                    });

                    for (const r of gadsResults) {
                        if (r.keyword) {
                            gadsMap.set(r.keyword.toLowerCase(), {
                                volume: r.volume || 0,
                                competition: r.competition || "Medium",
                                cpc: r.cpc || 0,
                            });
                        }
                    }
                } catch (e) {
                    console.error("Google Ads error in keyword-ideas:", e);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // STEP 3: Merge AI ideas with Google data + score everything
        // ─────────────────────────────────────────────────────────────

        // Build AI idea map (keyword → category + rationale)
        const aiMap = new Map<string, { category: string; rationale: string }>();
        for (const idea of aiIdeas) {
            aiMap.set(idea.keyword.toLowerCase(), {
                category: idea.category,
                rationale: idea.rationale,
            });
        }

        const scoreKeyword = (volume: number, competition: string): { goldenScore: number; opportunityScore: number } => {
            const compMap: Record<string, number> = { low: 20, medium: 50, high: 90, unspecified: 50 };
            const compScore = compMap[(competition || "medium").toLowerCase()] ?? 50;
            const goldenScore = Math.min(999, Math.floor((volume / compScore) * 10));

            // Opportunity score: balances volume + ease of ranking + creative uniqueness
            const volumeNorm = Math.min(100, Math.log10(Math.max(volume, 1)) * 25);
            const competitionBonus = compScore <= 20 ? 40 : compScore <= 50 ? 20 : 0;
            const opportunityScore = Math.min(100, Math.round(volumeNorm + competitionBonus));

            return { goldenScore, opportunityScore };
        };

        const isHiddenGem = (volume: number, competition: string, category: string) => {
            return (
                volume >= 50 &&
                (competition || "").toLowerCase() === "low" &&
                ["Problem", "Question", "Adjacent", "Informational"].includes(category)
            );
        };

        // First: AI ideas matched (or not) with Google data
        for (const idea of aiIdeas) {
            const gData = gadsMap.get(idea.keyword.toLowerCase());
            const volume = gData?.volume ?? estimateVolume(idea.keyword, idea.category);
            const competition = gData?.competition ?? "Medium";
            const cpc = gData?.cpc ?? estimateCpc(idea.category);
            const { goldenScore, opportunityScore } = scoreKeyword(volume, competition);
            const source = gData ? "AI+Data" : "AI Only";

            enrichedResults.push({
                keyword: idea.keyword,
                category: idea.category as any,
                rationale: idea.rationale,
                volume,
                cpc: typeof cpc === "number" ? cpc.toFixed(2) : cpc,
                competition,
                goldenScore,
                opportunityScore,
                isHiddenGem: isHiddenGem(volume, competition, idea.category),
                source,
            });
        }

        // Second: Add Google Ads expanded results not in AI list
        for (const [kw, gData] of gadsMap.entries()) {
            const alreadyInAI = aiMap.has(kw);
            if (!alreadyInAI && kw !== keyword.toLowerCase()) {
                const { goldenScore, opportunityScore } = scoreKeyword(gData.volume, gData.competition);
                enrichedResults.push({
                    keyword: kw,
                    category: "Adjacent",
                    rationale: "Expanded from Google Ads based on your seed keyword",
                    volume: gData.volume,
                    cpc: gData.cpc.toFixed(2),
                    competition: gData.competition,
                    goldenScore,
                    opportunityScore,
                    isHiddenGem: isHiddenGem(gData.volume, gData.competition, "Adjacent"),
                    source: "Data Expanded",
                });
            }
        }

        // Sort: Hidden gems first, then by opportunity score desc
        enrichedResults.sort((a, b) => {
            if (a.isHiddenGem && !b.isHiddenGem) return -1;
            if (!a.isHiddenGem && b.isHiddenGem) return 1;
            return b.opportunityScore - a.opportunityScore;
        });

        const response = {
            seedAnalysis: aiData.seedAnalysis || "",
            totalIdeas: enrichedResults.length,
            hiddenGems: enrichedResults.filter(r => r.isHiddenGem).length,
            hasRealData: gadsMap.size > 0,
            results: enrichedResults,
        };

        // Save to history
        try {
            await prisma.seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "KEYWORD_IDEAS",
                    inputData: JSON.stringify({ keyword, country, language }),
                    resultData: JSON.stringify(response),
                },
            });
        } catch {}

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Keyword Ideas Error:", error);
        return NextResponse.json({ error: "Failed to generate keyword ideas", details: error.message }, { status: 500 });
    }
}

// Estimates when Google Ads data is unavailable
function estimateVolume(keyword: string, category: string): number {
    const wordCount = keyword.trim().split(/\s+/).length;
    const baseMap: Record<string, number> = {
        Commercial: 800, Problem: 600, Question: 700,
        Informational: 900, Comparison: 500, Local: 400, Adjacent: 350,
    };
    const base = baseMap[category] ?? 500;
    // Longer keywords tend to have lower volume
    const lengthFactor = wordCount <= 2 ? 1.5 : wordCount <= 4 ? 1.0 : 0.6;
    return Math.floor(base * lengthFactor + Math.random() * 200);
}

function estimateCpc(category: string): number {
    const cpcMap: Record<string, number> = {
        Commercial: 2.5, Comparison: 2.0, Problem: 1.5,
        Question: 0.8, Informational: 0.7, Local: 1.8, Adjacent: 1.2,
    };
    return parseFloat(((cpcMap[category] ?? 1.0) + Math.random() * 0.5).toFixed(2));
}
