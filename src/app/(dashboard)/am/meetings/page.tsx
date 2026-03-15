import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMeetingRequests } from "@/app/actions/meeting";
import { MeetingRequestsUI } from "@/components/dashboard/meeting-requests-ui";
import { CalendarDays } from "lucide-react";

export const metadata: Metadata = {
    title: "Client Meetings | AM Dashboard",
};

export default async function AMMeetingsPage() {
    const session = await getServerSession(authOptions);
    const requests = await getMeetingRequests();

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Meeting Management · إدارة الاجتماعات
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter premium-gradient-text uppercase">
                    Client Meetings
                </h1>
                <p className="text-muted-foreground font-medium">Manage meeting requests from your assigned clients.</p>
            </div>

            <MeetingRequestsUI requests={requests} userRole={session?.user?.role || "AM"}
                hasGoogleToken={!!session?.user?.googleAccessToken}
            />
        </div>
    );
}
