import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { UserNav } from "@/components/dashboard/user-nav";

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

            <main className="flex-1 flex flex-col items-stretch overflow-hidden relative z-10">
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm flex items-center justify-end px-6 md:hidden">
                    <UserNav user={session.user} />
                </header>
                <div className="flex-1 overflow-auto p-6 md:p-8 custom-scrollbar">
                    <div className="mx-auto max-w-6xl reveal-animation">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
