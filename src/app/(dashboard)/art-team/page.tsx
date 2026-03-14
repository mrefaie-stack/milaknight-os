import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActionPlans } from "@/app/actions/action-plan";
import { TeamRoleDashboardView } from "@/components/dashboard/team-role-dashboard-view";

export default async function ArtTeamPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ART_TEAM") redirect("/login");
    const plans = await getActionPlans();
    return <TeamRoleDashboardView role="ART_TEAM" plans={plans as any[]} />;
}
