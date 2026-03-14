import { getActionPlans } from "@/app/actions/action-plan";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModeratorActionPlansList } from "@/components/action-plan/moderator-action-plans-list";

export default async function ArtTeamActionPlansPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ART_TEAM") redirect("/login");
    const { clientId } = await searchParams;
    const plans = await getActionPlans(clientId);
    return <ModeratorActionPlansList plans={plans as any[]} />;
}
