import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMeetingRequests } from "@/app/actions/meeting";
import { getTeamMeetings, getStaffUsers } from "@/app/actions/team-meeting";
import { MeetingRequestsUI } from "@/components/dashboard/meeting-requests-ui";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
    title: "Meetings | MilaKnight OS",
};

const ALLOWED_ROLES = ["ADMIN", "AM", "MARKETING_MANAGER", "MODERATOR",
    "CONTENT_TEAM", "CONTENT_LEADER", "ART_TEAM", "ART_LEADER",
    "SEO_TEAM", "SEO_LEAD", "HR_MANAGER"];

export default async function AdminMeetingsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ROLES.includes(session.user.role)) redirect("/");

    const isAdminOrAM = ["ADMIN", "AM", "MARKETING_MANAGER"].includes(session.user.role);

    const [requests, teamMeetings, staffUsers] = await Promise.all([
        isAdminOrAM ? getMeetingRequests() : Promise.resolve([]),
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
                userRole={session.user.role}
                currentUserId={session.user.id}
                hasGoogleToken={!!session.user.googleAccessToken}
            />
        </div>
    );
}
