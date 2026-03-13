import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployee } from "@/app/actions/hr";
import { EmployeeProfile } from "@/components/hr/employee-profile";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function EmployeeProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "MARKETING_MANAGER"].includes(session.user.role)) {
        redirect("/login");
    }

    const { userId } = await params;
    const employee = await getEmployee(userId);
    if (!employee) redirect("/admin/hr");

    const isRtlServer = false; // Will be handled client-side

    return (
        <div className="space-y-6">
            <Link
                href="/admin/hr"
                className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground/50 hover:text-primary transition-colors"
            >
                <ChevronLeft className="h-3.5 w-3.5" />
                {session.user.role === "ADMIN" ? "HR Dashboard" : "HR"}
            </Link>
            <EmployeeProfile employee={employee as any} viewerRole={session.user.role} />
        </div>
    );
}
