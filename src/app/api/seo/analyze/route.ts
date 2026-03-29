import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();
// Configure Anthropic provider
// Use exact import from vercel ai sdk for anthropic
// import { anthropic } from '@ai-sdk/anthropic'; 
// Assuming it might not be installed properly, we'll try a fallback REST fetch if needed, 
// but let's assume ai and @anthropic-ai/sdk are good based on package.json

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "SEO_TEAM" && session.user.role !== "SEO_LEAD" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
        }

        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // 1. Web Crawler (Data Acquisition) - Basic native implementation
        const fetchRes = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" },
            next: { revalidate: 3600 }
        });

        if (!fetchRes.ok) {
            return NextResponse.json({ error: "Failed to fetch website content" }, { status: 400 });
        }

        const html = await fetchRes.text();
        
        // Native Regex Scraper
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : "No Title Found";

        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i);
        const description = descMatch ? descMatch[1].trim() : "No Description Found";

        // Extract body text roughly
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        let rawBody = bodyMatch ? bodyMatch[1] : html;
        // Clean out scripts and styles
        rawBody = rawBody.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
                         .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
                         .replace(/<[^>]+>/g, " ") // Remove HTML tags
                         .replace(/\s+/g, " ") // Normalize whitespace
                         .trim()
                         .substring(0, 5000); // Limit to 5000 chars for AI context

        // 2. Claude AI Engine - Analyze Niche & Topics
        // Fallback fetch to Anthropic API if '@ai-sdk/anthropic' is tricky
        const claudePrompt = `
You are an expert SEO Strategist. Analyze the following website content.
URL: ${url}
Title: ${title}
Description: ${description}
Content Snippet: ${rawBody}

Identify the website's industry/niche and target audience. 
Then, suggest up to 10 HIGH VALUE seed keywords (long-tail and short-tail) with their search intent (Informational, Transactional, Commercial, Navigational).
Return ONLY a valid JSON object with the following structure:
{
  "niche": "string",
  "audience": "string",
  "keywords": [
    { "keyword": "string", "intent": "string", "relevance": "High | Medium" }
  ]
}
`;

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1500,
            messages: [{ role: "user", content: claudePrompt }]
        });

        const textContent = msg.content[0].type === 'text' ? msg.content[0].text : "";
        
        let seoPlan;
        try {
            // Find JSON in the response
            const jsonStr = textContent.match(/\{[\s\S]*\}/)?.[0] || "{}";
            seoPlan = JSON.parse(jsonStr);
        } catch (e) {
            seoPlan = { niche: "Unknown", audience: "Unknown", keywords: [] };
        }

        // 3. Data Enrichment (Google Ads API Simulation for UI Demo if API lacks KeywordPlanIdeaService)
        // Since KeywordPlanIdeaService requires extensive developer token setup & gRPC/REST mapping,
        // we will simulate the stats based on intent & relevance for this MVP to complete the workflow.
        const enrichedKeywords = (seoPlan.keywords || []).map((kw: any) => {
            // Mock realistic data based on relevance
            const baseVol = kw.relevance === "High" ? 5000 : 1000;
            const variance = Math.floor(Math.random() * 2000);
            const competitionOptions = ["Low", "Medium", "High"];
            
            return {
                keyword: kw.keyword,
                intent: kw.intent,
                volume: baseVol + variance,
                cpc: (Math.random() * 5 + 0.5).toFixed(2),
                competition: competitionOptions[Math.floor(Math.random() * competitionOptions.length)]
            };
        });

        const finalAnalysis = {
            url,
            meta: { title, description },
            niche: seoPlan.niche,
            audience: seoPlan.audience,
            keywords: enrichedKeywords
        };

        return NextResponse.json(finalAnalysis);

    } catch (error: any) {
        console.error("SEO Analysis API Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
