import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { geminiFlash } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { keyword, audience, tone = "Professional" } = await req.json();
        
        if (!keyword) {
            return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
        }

        const prompt = `You are a world-class SEO strategist and Content Director. 
Your task is to create a highly optimized SEO Content Brief for writers.
Target Keyword: "${keyword}"
Target Audience: "${audience || 'General public'}"
Tone of Voice: "${tone}"

Provide the output strictly in this JSON format without any other text (no markdown wrapping if possible):
{
    "metaTitle": "Highly clickable meta title (max 60 chars)",
    "metaDescription": "Compelling meta description with keyword (max 155 chars)",
    "suggestedUrl": "The URL slug",
    "primaryKeyword": "...",
    "lsiKeywords": ["LSI 1", "LSI 2", "LSI 3", "LSI 4", "LSI 5", "LSI 6"],
    "wordCountTarget": 1500,
    "outline": [
        { "type": "H1", "text": "...", "notes": "..." },
        { "type": "H2", "text": "...", "notes": "..." },
        { "type": "H3", "text": "...", "notes": "..." },
        { "type": "H2", "text": "...", "notes": "..." }
    ],
    "writerInstructions": "Brief paragraph telling the content team exactly how to approach this piece for maximal SEO impact."
}`;

        const response = await geminiFlash.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        });

        const rawText = response.response.text();
        
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
                    inputData: JSON.stringify({ keyword, audience, tone }),
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
