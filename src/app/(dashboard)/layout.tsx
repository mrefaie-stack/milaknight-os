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
        <div className="flex h-screen bg-background overflow-hidden">
            <DashboardSidebar role={session.user.role} user={session.user} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MobileHeader role={session.user.role} user={session.user} />

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="p-4 md:p-6 pb-24 md:pb-6">
                        <div className="mx-auto max-w-6xl reveal-animation">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {session.user.role !== "CLIENT" && <PresenceUpdater />}
            <NotificationToaster />
            <AiChatWidget
                user={{
                    name: session.user.name || "User",
                    role: session.user.role,
                    id: session.user.id,
                }}
            />
        </div>
    );
}
