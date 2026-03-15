import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeetingRequests } from "@/app/actions/meeting";
import { getTeamMeetings, getStaffUsers } from "@/app/actions/team-meeting";
import { MeetingRequestsUI } from "@/components/dashboard/meeting-requests-ui";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
    title: "Meetings | AM Dashboard",
};

export default async function AMMeetingsPage() {
    const session = await getServerSession(authOptions);

    const [requests, teamMeetings, staffUsers] = await Promise.all([
        getMeetingRequests(),
        getTeamMeetings(),
        getStaffUsers(),
    ]);

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Meetings · الاجتماعات
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                    Meetings
                </h1>
            </div>

            <MeetingRequestsUI
                requests={requests}
                teamMeetings={teamMeetings}
                staffUsers={staffUsers}
                userRole={session?.user?.role || "AM"}
                currentUserId={session?.user?.id || ""}
                hasGoogleToken={!!session?.user?.googleAccessToken}
            />
        </div>
    );
}
