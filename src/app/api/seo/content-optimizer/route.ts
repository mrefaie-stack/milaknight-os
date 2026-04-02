import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { keyword, contentText } = await req.json();
        
        if (!keyword || !contentText) {
            return NextResponse.json({ error: "Missing keyword or content" }, { status: 400 });
        }

        // Detect language from content (simple heuristic)
        const isArabic = /[\u0600-\u06FF]/.test(contentText.substring(0, 500));
        const langNote = isArabic
            ? "The content is in Arabic. Apply Arabic SEO best practices: keyword placement in RTL context, Arabic morphology (root words count as keyword matches), and Arabic readability standards."
            : "The content is in English.";

        const prompt = `You are a Senior SEO Content Strategist with expertise in Arabic and English digital content.
${langNote}

Deeply evaluate the provided content draft against the target keyword and return a comprehensive SEO audit.

Target Keyword: "${keyword}"

Content Draft:
"""
${contentText.substring(0, 20000)}
"""

Analyze these dimensions:
1. Keyword Density — exact count and percentage, is it optimal (1-2%)?
2. Keyword Placement — in title/H1, intro paragraph, subheadings, conclusion?
3. Semantic Coverage — are related LSI and NLP keywords present?
4. Readability — sentence length, structure, paragraphing
5. Content Depth — does it thoroughly cover the topic?
6. Missing Topics — what subtopics should be added based on search intent?
7. Keyword Cannibalization Risk — does the content compete with itself?
8. Call-to-Action — is there a clear CTA aligned with the keyword's intent?

Return ONLY valid JSON (no markdown):
{
    "seoScore": <0-100>,
    "densityState": "Perfect" | "Low" | "Stuffed",
    "keywordDensityPercent": <float>,
    "wordCount": <integer>,
    "keywordCount": <integer>,
    "positiveHighlights": ["<specific thing done well>", "..."],
    "improvementAreas": ["<specific actionable suggestion>", "..."],
    "missingLsiKeywords": ["<keyword>", "..."],
    "missingTopics": ["<topic/subtopic to add>", "..."],
    "readabilityScore": "Excellent" | "Good" | "Fair" | "Poor",
    "contentDepth": "Comprehensive" | "Adequate" | "Thin",
    "ctaPresent": true | false
}`;

        const rawText = await claudeGenerate(prompt);
        
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
                    toolName: "CONTENT_OPTIMIZER",
                    inputData: JSON.stringify({ keyword, contentText }),
                    resultData: JSON.stringify(parsed)
                }
            });
        } catch (historyErr) {
            console.error("Failed to save SEO history:", historyErr);
        }

        return NextResponse.json(parsed);

    } catch (error: any) {
        console.error("Content Optimizer Error:", error);
        return NextResponse.json({ 
            error: "Failed to run content optimization",
            details: error.message 
        }, { status: 500 });
    }
}
