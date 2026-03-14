import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovals } from "@/app/actions/approvals";
import { ApprovalsView } from "@/components/approvals/approvals-view";

const CAN_VIEW = new Set([
    "ART_TEAM", "CONTENT_TEAM", "SEO_TEAM",
    "ART_LEADER", "CONTENT_LEADER", "SEO_LEAD",
    "MARKETING_MANAGER", "AM", "ADMIN",
]);

export default async function ApprovalsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !CAN_VIEW.has(session.user.role)) redirect("/login");

    const approvals = await getApprovals();

    return (
        <div className="p-6 md:p-8">
            <ApprovalsView
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                approvals={approvals as any[]}
                userRole={session.user.role}
                userId={session.user.id}
            />
        </div>
    );
}
