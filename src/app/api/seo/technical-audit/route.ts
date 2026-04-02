import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { claudeGenerate } from "@/lib/ai/claude";
import * as cheerio from "cheerio";
import { prisma } from "@/lib/prisma";

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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!htmlResponse.ok) {
            throw new Error(`Failed to fetch URL: ${htmlResponse.statusText}`);
        }

        const html = await htmlResponse.text();
        const $ = cheerio.load(html);

        // 2. Extract Technical Metrics (extended)
        const title = $('title').text().trim();
        const metaDesc = $('meta[name="description"]').attr('content') || '';
        const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

        const h1s: string[] = [];
        $('h1').each((_, el) => { h1s.push($(el).text().trim()); });
        const h2s: string[] = [];
        $('h2').each((_, el) => { h2s.push($(el).text().trim().substring(0, 80)); });
        const h3Count = $('h3').length;
        const h4Count = $('h4').length;

        let totalImages = 0;
        let missingAlt = 0;
        let emptyAlt = 0;
        $('img').each((_, el) => {
            totalImages++;
            const alt = $(el).attr('alt');
            if (alt === undefined || alt === null) missingAlt++;
            else if (alt.trim() === '') emptyAlt++;
        });

        // Links
        let internalLinks = 0;
        let externalLinks = 0;
        const urlObj = new URL(url);
        $('a[href]').each((_, el) => {
            const href = $(el).attr('href') || '';
            try {
                const linkUrl = new URL(href, url);
                if (linkUrl.hostname === urlObj.hostname) internalLinks++;
                else externalLinks++;
            } catch { /* ignore malformed hrefs */ }
        });

        // Tags & structured data
        const canonical = $('link[rel="canonical"]').attr('href') || '';
        const hasViewport = $('meta[name="viewport"]').length > 0;
        const viewportContent = $('meta[name="viewport"]').attr('content') || '';
        const hasRobots = $('meta[name="robots"]').length > 0;
        const robotsContent = $('meta[name="robots"]').attr('content') || '';

        // Language & hreflang (critical for Arabic sites)
        const htmlLang = $('html').attr('lang') || '';
        const hreflangTags: string[] = [];
        $('link[rel="alternate"][hreflang]').each((_, el) => {
            hreflangTags.push(`${$(el).attr('hreflang')}: ${$(el).attr('href')}`);
        });

        // Open Graph
        const ogTitle = $('meta[property="og:title"]').attr('content') || '';
        const ogDesc = $('meta[property="og:description"]').attr('content') || '';
        const ogImage = $('meta[property="og:image"]').attr('content') || '';
        const ogType = $('meta[property="og:type"]').attr('content') || '';
        const ogUrl = $('meta[property="og:url"]').attr('content') || '';

        // Twitter Card
        const twitterCard = $('meta[name="twitter:card"]').attr('content') || '';
        const twitterTitle = $('meta[name="twitter:title"]').attr('content') || '';
        const twitterDesc = $('meta[name="twitter:description"]').attr('content') || '';
        const twitterImage = $('meta[name="twitter:image"]').attr('content') || '';

        // Schema.org / JSON-LD
        const schemaTypes: string[] = [];
        $('script[type="application/ld+json"]').each((_, el) => {
            try {
                const json = JSON.parse($(el).html() || '{}');
                const type = json['@type'] || (Array.isArray(json) && json[0]?.['@type']) || '';
                if (type) schemaTypes.push(Array.isArray(type) ? type.join(', ') : type);
            } catch { /* ignore */ }
        });

        // Content metrics
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = bodyText.split(' ').filter(Boolean).length;
        const hasSSL = url.startsWith('https://');
        const htmlSize = html.length;

        const rawData = {
            url,
            ssl: hasSSL,
            htmlSizeKb: Math.round(htmlSize / 1024),
            title: { text: title, length: title.length },
            metaDescription: { text: metaDesc, length: metaDesc.length },
            metaKeywords: metaKeywords || null,
            headings: {
                h1Count: h1s.length,
                h1Text: h1s,
                h2Count: h2s.length,
                h2Samples: h2s.slice(0, 5),
                h3Count,
                h4Count,
            },
            images: { total: totalImages, missingAlt, emptyAlt },
            links: { internal: internalLinks, external: externalLinks },
            tags: {
                canonical: canonical || null,
                hasViewport,
                viewportContent,
                hasRobots,
                robotsContent,
            },
            language: {
                htmlLang: htmlLang || null,
                hreflangTags: hreflangTags.length > 0 ? hreflangTags : null,
            },
            openGraph: {
                title: ogTitle || null,
                description: ogDesc || null,
                image: ogImage || null,
                type: ogType || null,
                url: ogUrl || null,
            },
            twitterCard: {
                card: twitterCard || null,
                title: twitterTitle || null,
                description: twitterDesc || null,
                image: twitterImage || null,
            },
            structuredData: {
                schemaTypes: schemaTypes.length > 0 ? schemaTypes : null,
            },
            content: {
                wordCount,
            }
        };

        // 3. Deep analysis with Claude
        const prompt = `You are a Senior Technical SEO Expert specializing in Arabic and international websites.
I have scraped a web page and extracted its full technical SEO data.
Analyze EVERY aspect thoroughly and return a detailed audit report in JSON.

Raw Page Data:
${JSON.stringify(rawData, null, 2)}

Return ONLY a valid JSON object (no markdown, no explanation) in this exact structure:
{
    "healthScore": <0-100 integer>,
    "summary": "<2-3 sentence overall assessment>",
    "checks": [
        {
            "name": "<check name>",
            "category": "On-Page" | "Technical" | "Social" | "Structured Data" | "Accessibility" | "Performance",
            "status": "pass" | "warning" | "fail",
            "message": "<current state with specific details>",
            "recommendation": "<specific actionable fix if needed, or empty string if pass>"
        }
    ]
}

Cover ALL of these checks in order:
1. Title Tag (length, keyword presence, uniqueness)
2. Meta Description (length, engagement, CTA)
3. H1 Tag (presence, count, quality)
4. Heading Hierarchy (H1→H2→H3 logical structure)
5. Image Alt Text (missing/empty alt attributes)
6. Canonical Tag (present, correct, self-referencing)
7. Viewport Meta Tag (mobile-friendliness)
8. Robots Meta Tag (indexability)
9. SSL/HTTPS (security)
10. HTML Language Attribute (lang="ar" or "en" etc.)
11. Hreflang Tags (multilingual/Arabic sites especially need this)
12. Open Graph Tags (og:title, og:description, og:image completeness)
13. Twitter Card Tags (completeness)
14. Schema.org / JSON-LD Structured Data (type and presence)
15. Internal Links (count adequacy)
16. External Links (count, relevance)
17. Page Size (HTML size in KB)
18. Word Count (content depth)
19. Meta Keywords (deprecated but note if present)
20. Overall Social Sharing Readiness`;

        const rawText = await claudeGenerate(prompt);

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
