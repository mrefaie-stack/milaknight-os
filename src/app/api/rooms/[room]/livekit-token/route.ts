import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AccessToken } from "livekit-server-sdk";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ room: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { room } = await params;
    const roomId = decodeURIComponent(room);

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 });
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: session.user.id,
        name: session.user.name ?? session.user.id,
        ttl: "4h",
    });

    at.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();
    return NextResponse.json({ token });
}
