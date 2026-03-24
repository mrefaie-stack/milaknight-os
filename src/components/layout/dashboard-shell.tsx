"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { AiChatWidget } from "@/components/ai-chat/chat-widget";
import { PresenceUpdater } from "@/components/office/presence-updater";
import { NotificationToaster } from "@/components/notifications/notification-toaster";

type Props = {
    role: string;
    user: any;
    children: React.ReactNode;
};

export function DashboardShell({ role, user, children }: Props) {
    const [mobileAiOpen, setMobileAiOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <DashboardSidebar role={role} user={user} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <MobileHeader
                    role={role}
                    user={user}
                    mobileAiOpen={mobileAiOpen}
                    onAiToggle={() => setMobileAiOpen(v => !v)}
                />

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <div className="p-4 md:p-6 pb-24 md:pb-6">
                        <div className="mx-auto max-w-6xl reveal-animation">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {role !== "CLIENT" && <PresenceUpdater />}
            <NotificationToaster />
            <AiChatWidget
                user={{ name: user.name || "User", role: user.role, id: user.id }}
                mobileOpen={mobileAiOpen || undefined}
                onMobileClose={() => setMobileAiOpen(false)}
            />
        </div>
    );
}
