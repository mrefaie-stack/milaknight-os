import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingActionPlansForMM } from "@/app/actions/action-plan";
import { getPendingReportsForMM } from "@/app/actions/report";
import { MmApprovalsView } from "@/components/admin/mm-approvals-view";

export default async function MmApprovalsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "MARKETING_MANAGER") {
        redirect("/login");
    }

    const [pendingPlans, pendingReports] = await Promise.all([
        getPendingActionPlansForMM(),
        getPendingReportsForMM(),
    ]);

    return (
        <MmApprovalsView
            pendingPlans={pendingPlans}
            pendingReports={pendingReports}
        />
    );
}
