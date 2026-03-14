import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActionPlans } from "@/app/actions/action-plan";
import { TeamRoleDashboardView } from "@/components/dashboard/team-role-dashboard-view";

export default async function ContentLeaderPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CONTENT_LEADER") redirect("/login");
    const plans = await getActionPlans();
    return <TeamRoleDashboardView role="CONTENT_LEADER" plans={plans as any[]} />;
}
