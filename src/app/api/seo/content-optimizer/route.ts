import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { keyword, contentText } = await req.json();
        
        if (!keyword || !contentText) {
            return NextResponse.json({ error: "Missing keyword or content" }, { status: 400 });
        }

        const prompt = `You are an expert SEO Content Reviewer. 
Evaluate the provided text against the target keyword. Check for:
1. Keyword Density (calculate roughly and check if it's stuffed or too low).
2. Presence of Keyword in strategic places (assuming first paragraph, headers, conclusion).
3. Readability and flow.
4. Missing semantic relevance (LSI keywords that should exist).

Target Keyword: "${keyword}"

Content Draft:
"""
${contentText.substring(0, 15000)} // max 15k chars to prevent token limits
"""

Return a JSON strictly formatted like this:
{
    "seoScore": 0-100,
    "densityState": "Perfect" | "Low" | "Stuffed",
    "wordCount": 1200,
    "positiveHighlights": [
        "What was done well...",
        "..."
    ],
    "improvementAreas": [
        "What needs changing...",
        "..."
    ]
}`;

        const aiResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1000,
            temperature: 0.2,
            messages: [{ role: 'user', content: prompt }]
        });

        const rawText = (aiResponse.content[0] as any).text;
        
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
