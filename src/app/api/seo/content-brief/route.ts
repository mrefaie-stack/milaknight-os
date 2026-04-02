import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { keyword, audience, tone = "Professional", language = "ar" } = await req.json();
        
        if (!keyword) {
            return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
        }

        const isArabic = language === "ar" || /[\u0600-\u06FF]/.test(keyword);
        const langInstruction = isArabic
            ? `Write the brief entirely in Arabic. The content will be published in Arabic for an Arab audience. Consider Arabic search behavior, use Arabic SEO best practices, and ensure all headings and meta tags are in Arabic. The URL slug should be in English/transliterated.`
            : `Write the brief in English. Follow standard English SEO best practices.`;

        const prompt = `You are a world-class SEO strategist and Content Director with deep expertise in ${isArabic ? 'Arabic' : 'English'} digital marketing.
${langInstruction}

Create a comprehensive, production-ready SEO Content Brief for the writing team.

Target Keyword: "${keyword}"
Target Audience: "${audience || (isArabic ? 'الجمهور العربي العام' : 'General public')}"
Tone of Voice: "${tone}"

Return ONLY valid JSON (no markdown, no explanation):
{
    "metaTitle": "<Clickable meta title max 60 chars, must include keyword>",
    "metaDescription": "<Compelling meta description max 155 chars with keyword and CTA>",
    "suggestedUrl": "<lowercase-english-slug-with-hyphens>",
    "primaryKeyword": "<exact target keyword>",
    "secondaryKeywords": ["<related keyword 1>", "<related keyword 2>", "<related keyword 3>"],
    "lsiKeywords": ["<LSI 1>", "<LSI 2>", "<LSI 3>", "<LSI 4>", "<LSI 5>", "<LSI 6>", "<LSI 7>", "<LSI 8>"],
    "searchIntent": "Informational" | "Transactional" | "Commercial" | "Navigational",
    "wordCountTarget": <recommended word count as integer>,
    "readingLevel": "Simple" | "Intermediate" | "Advanced",
    "outline": [
        { "type": "H1", "text": "<heading text>", "notes": "<guidance for writer>" },
        { "type": "H2", "text": "<heading text>", "notes": "<guidance>" },
        { "type": "H3", "text": "<heading text>", "notes": "<guidance>" },
        { "type": "H2", "text": "<heading text>", "notes": "<guidance>" },
        { "type": "H2", "text": "<heading text>", "notes": "<guidance>" },
        { "type": "H2", "text": "FAQ", "notes": "Include 3-5 frequently asked questions" }
    ],
    "internalLinkingSuggestions": ["<page/topic to link to internally>", "..."],
    "contentGaps": ["<subtopic competitors likely cover that we should too>", "..."],
    "writerInstructions": "<Detailed paragraph with exact writing direction, tone guidance, and SEO tips specific to this keyword>"
}`;

        const rawText = await claudeGenerate(prompt);
        
        // Try parsing JSON safely in case Claude added markdown backticks
        let parsed = null;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
            else throw new Error("Could not parse AI response into JSON");
        }
        try {
            await prisma.seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "CONTENT_BRIEF",
                    inputData: JSON.stringify({ keyword, audience, tone, language }),
                    resultData: JSON.stringify(parsed)
                }
            });
        } catch (historyErr) {
            console.error("Failed to save SEO history:", historyErr);
        }

        return NextResponse.json(parsed);

    } catch (error: any) {
        console.error("Content Brief Error:", error);
        return NextResponse.json({ 
            error: "Failed to generate content brief",
            details: error.message 
        }, { status: 500 });
    }
}
