import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CLICKUP_API = "https://api.clickup.com/api/v2";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (error || !code) {
        return NextResponse.redirect(`${baseUrl}/clickup?error=denied`);
    }

    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "MARKETING_MANAGER")) {
        return NextResponse.redirect(`${baseUrl}/login`);
    }

    // Exchange code for access token
    const tokenRes = await fetch(`${CLICKUP_API}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            client_id: process.env.CLICKUP_CLIENT_ID,
            client_secret: process.env.CLICKUP_CLIENT_SECRET,
            code,
        }),
    });

    if (!tokenRes.ok) {
        return NextResponse.redirect(`${baseUrl}/clickup?error=token`);
    }

    const { access_token } = await tokenRes.json();

    if (!access_token) {
        return NextResponse.redirect(`${baseUrl}/clickup?error=token`);
    }

    // Get primary workspace
    const teamRes = await fetch(`${CLICKUP_API}/team`, {
        headers: { Authorization: access_token },
        cache: "no-store",
    });

    if (!teamRes.ok) {
        return NextResponse.redirect(`${baseUrl}/clickup?error=team`);
    }

    const { teams } = await teamRes.json();
    const teamId = teams?.[0]?.id;

    if (!teamId) {
        return NextResponse.redirect(`${baseUrl}/clickup?error=team`);
    }

    // Save token + teamId to user
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            clickupToken: access_token,
            clickupTeamId: String(teamId),
        },
    });

    return NextResponse.redirect(`${baseUrl}/clickup`);
}
