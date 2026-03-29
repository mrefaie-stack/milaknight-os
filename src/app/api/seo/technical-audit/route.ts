import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";
const anthropic = new Anthropic();

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { url } = await req.json();
        
        if (!url || !url.startsWith('http')) {
            return NextResponse.json({ error: "Valid URL is required" }, { status: 400 });
        }

        // 1. Scrape the URL
        const htmlResponse = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (!htmlResponse.ok) {
            throw new Error(`Failed to fetch URL: ${htmlResponse.statusText}`);
        }

        const html = await htmlResponse.text();
        const $ = cheerio.load(html);

        // 2. Extract Technical Metrics
        const title = $('title').text().trim();
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        
        const h1s: string[] = [];
        $('h1').each((_, el) => { h1s.push($(el).text().trim()); });
        const h2Count = $('h2').length;
        const h3Count = $('h3').length;

        let totalImages = 0;
        let missingAlt = 0;
        $('img').each((_, el) => {
            totalImages++;
            if (!$(el).attr('alt')) missingAlt++;
        });

        const canonical = $('link[rel="canonical"]').attr('href') || 'Missing';
        const hasViewport = $('meta[name="viewport"]').length > 0;
        const hasRobots = $('meta[name="robots"]').length > 0;

        const rawData = {
            url,
            title: { text: title, length: title.length },
            metaDescription: { text: metaDesc, length: metaDesc.length },
            headings: { h1Count: h1s.length, h1Text: h1s, h2Count, h3Count },
            images: { total: totalImages, missingAlt },
            tags: { canonical, hasViewport, hasRobots }
        };

        // 3. Analyze with Claude
        const prompt = `You are a Technical SEO Expert. 
I have scraped a web page and extracted its technical SEO data.
Evaluate this data and return a JSON object with a thorough technical audit report.

Raw Data:
${JSON.stringify(rawData, null, 2)}

Requirements for JSON output strictly (no markdown block if possible):
{
    "healthScore": 0-100,
    "summary": "Brief overall technical assessment",
    "checks": [
        {
            "name": "Title Tag",
            "status": "pass" | "warning" | "fail",
            "message": "Current state description",
            "recommendation": "How to fix if needed"
        },
        // Do this for Meta Description, H1 Tags, Heading Hierarchy, Image Alts, Canonical Tag, Core Tags
    ]
}`;

        const aiResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
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

        const resultPayload = {
            rawMetrics: rawData,
            audit: parsed
        };

        try {
            await prisma.seoToolHistory.create({
                data: {
                    userId: (session.user as any).id,
                    toolName: "TECHNICAL_AUDIT",
                    inputData: JSON.stringify({ url }),
                    resultData: JSON.stringify(resultPayload)
                }
            });
        } catch (historyErr) {
            console.error("Failed to save SEO history:", historyErr);
        }

        return NextResponse.json(resultPayload);

    } catch (error: any) {
        console.error("Technical Audit Error:", error);
        return NextResponse.json({ 
            error: "Failed to run technical audit",
            details: error.message 
        }, { status: 500 });
    }
}
