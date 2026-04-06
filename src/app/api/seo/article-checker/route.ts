import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { content, focusKeyword, lsiKeywords, requiredHeadings } = await req.json();

        if (!content || !focusKeyword) {
            return NextResponse.json({ error: "Missing content or focus keyword" }, { status: 400 });
        }

        const isArabic = /[\u0600-\u06FF]/.test(content.substring(0, 500));
        const langNote = isArabic
            ? "The article is in Arabic. Count morphological variations of the keyword as matches (e.g. different verb forms or plurals of the same root)."
            : "The article is in English.";

        const lsiList: string[] = Array.isArray(lsiKeywords) && lsiKeywords.length > 0 ? lsiKeywords : [];
        const headingList: string[] = Array.isArray(requiredHeadings) && requiredHeadings.length > 0 ? requiredHeadings : [];

        const lsiSection = lsiList.length > 0
            ? `LSI Keywords to check (each must appear AT LEAST 2 times): [${lsiList.map(k => `"${k}"`).join(", ")}]`
            : `LSI Keywords: none provided`;

        const headingsSection = headingList.length > 0
            ? `Required Headings (check if each exact heading text appears anywhere in the article): [${headingList.map(h => `"${h}"`).join(", ")}]`
            : `Required Headings: none provided`;

        const prompt = `You are a Senior SEO Content Auditor specialized in Arabic and English web articles.
${langNote}

Audit the following article against these EXACT SEO requirements:

**RULE 1 — Focus Keyword Frequency:**
Count exact occurrences of the focus keyword "${focusKeyword}" in the article (morphological variants count for Arabic).
The required minimum is 7 occurrences per 1000 words (proportional to article length).
Formula: minRequired = ceil(wordCount / 1000 * 7). Round up.
If wordCount < 1000, still require at least 7 occurrences.

**RULE 2 — LSI Keywords (minimum 2 occurrences each):**
${lsiSection}
For each LSI keyword, count how many times it appears. It PASSES only if count >= 2.

**RULE 3 — Required Headings Present:**
${headingsSection}
For each required heading, check if that exact text (or a very close match) appears anywhere in the article. Mark it found=true or found=false.

**RULE 4 — Word Count:**
Count total words. Must be >= 800. Target >= 1000.

Focus Keyword: "${focusKeyword}"

Article Content:
"""
${content.substring(0, 25000)}
"""

Return ONLY valid JSON (no markdown, no explanation):
{
    "wordCount": <integer>,
    "focusKeyword": {
        "keyword": "${focusKeyword}",
        "occurrences": <integer>,
        "minRequired": <integer>,
        "passed": <true|false>,
        "densityPercent": <float>
    },
    "lsiKeywords": [
        { "keyword": "<keyword>", "occurrences": <integer>, "passed": <true|false> }
    ],
    "requiredHeadings": [
        { "heading": "<heading text>", "found": <true|false> }
    ],
    "wordCountCheck": {
        "wordCount": <integer>,
        "meetsMinimum": <true|false>,
        "meetsTarget": <true|false>
    },
    "overallScore": <0-100>,
    "passed": <true|false>,
    "summary": "<2-3 sentence Arabic summary of the article's SEO status and what needs fixing>"
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
                    inputData: JSON.stringify({ focusKeyword, lsiKeywords, requiredHeadings, contentLength: content.length }),
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
