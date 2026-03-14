import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const host = process.env.TURN_HOST;
    const port = process.env.TURN_PORT || "3478";
    const username = process.env.TURN_USERNAME;
    const credential = process.env.TURN_CREDENTIAL;

    const iceServers: RTCIceServer[] = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
    ];

    if (host && username && credential) {
        iceServers.push({
            urls: [
                `turn:${host}:${port}?transport=udp`,
                `turn:${host}:${port}?transport=tcp`,
            ],
            username,
            credential,
        });
    }

    return NextResponse.json({ iceServers });
}
