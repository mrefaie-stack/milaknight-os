import { getActionPlans } from "@/app/actions/action-plan";
import { ModeratorDashboardView } from "@/components/dashboard/moderator-dashboard-view";

export default async function ModeratorDashboardPage() {
    const plans = await getActionPlans();
    return <ModeratorDashboardView plans={plans} />;
}
