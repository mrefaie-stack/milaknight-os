import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const url = new URL(req.url);
        const toolName = url.searchParams.get('toolName');

        if (!toolName) {
            return NextResponse.json({ error: "toolName query parameter is required" }, { status: 400 });
        }

        const history = await prisma.seoToolHistory.findMany({
            where: {
                userId: (session.user as any).id,
                toolName: toolName
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10 // Get last 10 executions
        });

        // Parse JSON strings to objects for the frontend
        const parsedHistory = history.map(h => ({
            id: h.id,
            toolName: h.toolName,
            createdAt: h.createdAt,
            inputData: JSON.parse(h.inputData),
            resultData: JSON.parse(h.resultData)
        }));

        return NextResponse.json(parsedHistory);
    } catch (error: any) {
        console.error("Fetch SEO History Error:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}
