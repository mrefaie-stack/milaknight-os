const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
require('dotenv').config();

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CACHE_HOURS = 12;

// Simplified version of the prompt builders
function buildPrompt(type, client) {
    const name = client.name || "this client";
    const industry = client.industry || "general business";
    const country = client.country || "the region";
    const brief = client.briefEn || client.brief || "";
    const deliverables = client.deliverablesEn || client.deliverables || "";

    const context = `
Client Name: ${name}
Industry: ${industry}
Country: ${country}
Business Brief: ${brief}
Services/Deliverables: ${deliverables}
`.trim();

    if (type === "INDUSTRY") {
        return `${context}

Based on this client's profile, generate 8 relevant industry news and market insights for their sector.
Each item must be a JSON object with these exact keys:
{ "titleAr": "العنوان بالعربي", "titleEn": "Title in English", "summaryAr": "ملخص قصير بالعربي (2-3 جمل واضحة)", "summaryEn": "Short summary in English (2-3 clear sentences)", "tag": "Category tag", "impact": "HIGH", "emoji": "📈" }

impact must be exactly: HIGH, MEDIUM, or LOW
emoji should be a relevant emoji (📈 📊 🚀 💡 🌐 📱 🏆 💰 🔥 ⚡)
Arabic text must be grammatically correct Modern Standard Arabic, clear and professional.
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
    }

    if (type === "TRENDING") {
        return `${context}

Based on this client's profile and industry, generate 10 trending topics, hashtags, and keywords they should leverage in their social media and marketing strategy.
Each item must be a JSON object with these exact keys:
{ "topicEn": "Topic Name", "topicAr": "اسم الموضوع بالعربي", "hashtag": "#HashtagName", "descEn": "Brief description", "descAr": "وصف مختصر بالعربي", "volume": "1.2M", "growth": "+38%", "platform": "Instagram" }

platform must be one of: Instagram, TikTok, Twitter, LinkedIn, YouTube, Facebook
volume and growth should be realistic estimates for the region/industry
Arabic text must be grammatically correct Modern Standard Arabic.
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
    }

    return `${context}

Based on this client's profile, identify 6 real or realistic competitors in their specific market and provide a detailed competitive analysis.
Each item must be a JSON object with these exact keys:
{
  "name": "Competitor Name",
  "descEn": "Detailed 2-sentence description in English",
  "descAr": "وصف مفصل بجملتين بالعربي الفصيح الواضح",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3", "نقطة قوة 4"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3", "نقطة ضعف 4"],
  "socialMedia": {
    "instagram": "@handle or null",
    "twitter": "@handle or null",
    "linkedin": "linkedin.com/company/handle or null",
    "tiktok": "@handle or null",
    "estimatedFollowers": "25K",
    "activity": "HIGH"
  },
  "socialPresence": "HIGH",
  "threat": "MEDIUM"
}

socialPresence, threat, and socialMedia.activity must be exactly: HIGH, MEDIUM, or LOW
strengths and weaknesses arrays must have 4 items each, written in Arabic (فصيح وواضح).
socialMedia handles should be realistic for the competitor's name/market.
estimatedFollowers should be a realistic estimate.
Respond with ONLY a valid JSON array. No markdown, no explanation.`;
}

async function sendNotificationEmail(to, clientName) {
    let transporter;
    
    if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.GMAIL_EMAIL, pass: process.env.GMAIL_APP_PASSWORD },
            tls: { rejectUnauthorized: false }
        });
    } else {
        console.warn("⚠️ No email config found.");
        return;
    }

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; max-width: 600px; margin: auto;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">MilaKnight OS - New Market Insights</h2>
            <p style="font-size: 16px; color: #334155;">Hello,</p>
            <p style="font-size: 16px; color: #334155;">Your AI-powered Market Intelligence Dashboard has been refreshed. We have generated new data for <strong>${clientName}</strong>, including:</p>
            
            <ul style="font-size: 15px; color: #475569; padding-left: 20px; line-height: 1.6;">
                <li><strong>Industry News:</strong> Latest updates in your sector.</li>
                <li><strong>Trending Topics:</strong> New hashtags and content ideas to leverage.</li>
                <li><strong>Competitor Analysis:</strong> Monitored activities, strengths, and weaknesses.</li>
            </ul>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXTAUTH_URL || 'https://os.mila-knight.com'}/client/industry" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View Insights Dashboard</a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">You receive this email because you are a client of MilaKnight OS.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"MilaKnight OS" <${process.env.GMAIL_EMAIL}>`,
            to,
            subject: "📈 Your Market Intelligence Dashboard is Updated",
            html,
        });
        console.log(`✅ Email sent to ${to}`);
    } catch (error) {
        console.error(`❌ Failed to send email to ${to}:`, error.message);
    }
}

async function generateInsight(client, type) {
    const latest = await prisma.clientInsight.findFirst({
        where: { clientId: client.id, type },
        orderBy: { createdAt: "desc" },
    });

    const cacheExpiry = new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000);
    
    // Only generate if no previous insights exist, or if the latest insight is older than CACHE_HOURS
    if (latest && latest.createdAt > cacheExpiry) {
        console.log(`[SKIPPED] ${type} for ${client.name} (Cached recently)`);
        return false;
    }

    console.log(`[GENERATING] ${type} for ${client.name}...`);
    
    try {
        const prompt = buildPrompt(type, client);
        const response = await anthropic.messages.create({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 4096,
            system: "You are a business intelligence analyst for a digital marketing agency in the Arab world. Generate structured JSON content based on client profiles. Always use grammatically correct Modern Standard Arabic (فصحى). Always respond with ONLY a valid JSON array. No markdown code blocks, no explanation, no preamble.",
            messages: [{ role: "user", content: prompt }],
        });

        const rawText = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
        const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Not a valid array");

        await prisma.clientInsight.create({
            data: { clientId: client.id, type, content: JSON.stringify(parsed) },
        });

        console.log(`[SUCCESS] ${type} inserted for ${client.name}`);
        return true;
    } catch (err) {
        console.error(`[ERROR] Failed ${type} for ${client.name}:`, err.message);
        return false;
    }
}

async function main() {
    console.log("======================================");
    console.log("   🚀 STARTING CRON: AI INSIGHTS      ");
    console.log("======================================");

    const clients = await prisma.client.findMany({
        include: { user: true }
    });

    console.log(`Found ${clients.length} clients to process.`);

    for (const client of clients) {
        console.log(`\n--- Processing Client: ${client.name} ---`);
        
        let sentAny = false;
        
        // Wait sequentially to respect rate limits
        const b1 = await generateInsight(client, "INDUSTRY");
        const b2 = await generateInsight(client, "TRENDING");
        const b3 = await generateInsight(client, "COMPETITORS");

        if (b1 || b2 || b3) sentAny = true;

        if (sentAny && client.user && client.user.email) {
            console.log(`Sending update email to ${client.user.email}...`);
            await sendNotificationEmail(client.user.email, client.name);
        }
    }

    console.log("\n======================================");
    console.log("   ✅ CRON DONE: AI INSIGHTS          ");
    console.log("======================================");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
