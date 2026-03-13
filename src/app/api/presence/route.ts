import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchPresenceData } from "@/app/actions/presence";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json([], { status: 401 });
    }

    const presences = await fetchPresenceData();

    // Mark current user
    const result = presences.map((p) => ({
        ...p,
        isCurrentUser: p.userId === session.user.id,
    }));

    return NextResponse.json(result, {
        headers: { "Cache-Control": "no-store" },
    });
}
