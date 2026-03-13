import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { AiChatWidget } from "@/components/ai-chat/chat-widget";
import { PresenceUpdater } from "@/components/office/presence-updater";
import { NotificationToaster } from "@/components/notifications/notification-toaster";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Background Ornaments */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none z-0" />

            <DashboardSidebar role={session.user.role} user={session.user} />

            <main className="flex-1 flex flex-col items-stretch overflow-hidden relative z-10 w-full">
                <MobileHeader role={session.user.role} user={session.user} />
                <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar relative z-10">
                    <div className="mx-auto max-w-6xl reveal-animation pb-20 md:pb-0">
                        {children}
                    </div>
                </div>
            </main>

            {session.user.role !== "CLIENT" && <PresenceUpdater />}
            <NotificationToaster />
            <AiChatWidget user={{ name: session.user.name || "User", role: session.user.role, id: session.user.id }} />
        </div>
    );
}

