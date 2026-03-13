import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoomSessions } from "@/app/actions/room";

// GET — return all room sessions map
export async function GET(_req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") {
        return NextResponse.json({}, { status: 401 });
    }

    const sessions = await getRoomSessions();

    // Mark isCurrentUser for each member
    const result: Record<string, { userId: string; name: string; role: string; isCurrentUser: boolean }[]> = {};
    for (const [roomId, members] of Object.entries(sessions)) {
        result[roomId] = members.map(m => ({
            ...m,
            isCurrentUser: m.userId === session.user.id,
        }));
    }

    return NextResponse.json(result);
}
