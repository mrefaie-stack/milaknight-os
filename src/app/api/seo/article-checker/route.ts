import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { content, focusKeyword, lsiKeywords } = await req.json();

        if (!content || !focusKeyword) {
            return NextResponse.json({ error: "Missing content or focus keyword" }, { status: 400 });
        }

        const isArabic = /[\u0600-\u06FF]/.test(content.substring(0, 500));
        const langNote = isArabic
            ? "The article is in Arabic. Apply Arabic SEO best practices and consider morphological variations as keyword matches."
            : "The article is in English.";

        const lsiList = Array.isArray(lsiKeywords) && lsiKeywords.length > 0
            ? lsiKeywords.join(", ")
            : "none provided";

        const prompt = `You are a Senior SEO Content Auditor specialized in Arabic and English web articles.
${langNote}

Audit the following article against these exact SEO requirements:

1. **Focus Keyword Presence** — Is the focus keyword "${focusKeyword}" present in the article?
2. **Focus Keyword Distribution** — Is the keyword present in: the title/H1, the intro paragraph (first 100 words), at least one subheading (H2/H3), and the conclusion (last 100 words)?
3. **LSI Keywords** — From this list: [${lsiList}], which ones appear in the article and which are missing?
4. **Heading Structure** — Does the article contain at least one H1 (# in markdown or <h1>) and at least two H2s (## or <h2>)?
5. **Word Count** — Count the total words. It MUST be at least 800 words. Target is 1000+.

Focus Keyword: "${focusKeyword}"
LSI Keywords to check: ${lsiList}

Article Content:
"""
${content.substring(0, 25000)}
"""

Return ONLY valid JSON (no markdown, no explanation):
{
    "wordCount": <integer>,
    "focusKeyword": {
        "present": <true|false>,
        "inTitle": <true|false>,
        "inIntro": <true|false>,
        "inSubheading": <true|false>,
        "inConclusion": <true|false>,
        "totalOccurrences": <integer>,
        "densityPercent": <float>
    },
    "lsiKeywords": {
        "found": ["<keyword>"],
        "missing": ["<keyword>"]
    },
    "headingStructure": {
        "hasH1": <true|false>,
        "h2Count": <integer>,
        "h3Count": <integer>,
        "hasProperStructure": <true|false>
    },
    "wordCountCheck": {
        "passed": <true|false>,
        "meetsMinimum": <true|false>,
        "meetsTarget": <true|false>
    },
    "overallScore": <0-100>,
    "passed": <true|false>,
    "summary": "<2-3 sentence Arabic summary of the article's SEO status>"
}`;

        const rawText = await claudeGenerate(prompt);

        let parsed: any = null;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            else throw new Error("Could not parse AI response into JSON");
        }

        try {
            await (prisma as any).seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "ARTICLE_SEO_CHECKER",
                    inputData: JSON.stringify({ focusKeyword, lsiKeywords, contentLength: content.length }),
                    resultData: JSON.stringify(parsed),
                },
            });
        } catch (historyErr) {
            console.error("Failed to save SEO history:", historyErr);
        }

        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error("Article SEO Checker Error:", error);
        return NextResponse.json(
            { error: "Failed to run article SEO check", details: error.message },
            { status: 500 }
        );
    }
}
