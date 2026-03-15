import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.googleAccessToken) {
        return NextResponse.json({ events: [], connected: false });
    }

    const now = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
        const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&timeMax=${encodeURIComponent(timeMax)}&orderBy=startTime&singleEvents=true&maxResults=20`,
            { headers: { Authorization: `Bearer ${session.user.googleAccessToken}` } }
        );

        if (!res.ok) return NextResponse.json({ events: [], connected: true, error: true });

        const data = await res.json();
        const events = (data.items || []).map((e: any) => ({
            id: e.id,
            title: e.summary || "(No title)",
            start: e.start?.dateTime || e.start?.date,
            end: e.end?.dateTime || e.end?.date,
            meetLink:
                e.hangoutLink ||
                e.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri ||
                null,
            attendees: (e.attendees || []).slice(0, 5).map((a: any) => a.displayName || a.email),
        }));

        return NextResponse.json({ events, connected: true });
    } catch {
        return NextResponse.json({ events: [], connected: true, error: true });
    }
}
