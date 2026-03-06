import { getRecentChats } from "@/app/actions/chat";
import { ChatInterface } from "@/components/messages/chat-interface";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
    const session = await getServerSession(authOptions);
    const recentChats = await getRecentChats();
    const { userId: initialUserId } = await searchParams;

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
                <p className="text-muted-foreground">Internal communication between Admin and Team.</p>
            </div>

            <div className="flex-1 bg-card border rounded-xl overflow-hidden flex">
                <ChatInterface
                    currentUser={session?.user}
                    recentChats={recentChats}
                    initialUserId={initialUserId}
                />
            </div>
        </div>
    );
}
