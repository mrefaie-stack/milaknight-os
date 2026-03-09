import { getActionPlans } from "@/app/actions/action-plan";
import { ModeratorActionPlansList } from "@/components/action-plan/moderator-action-plans-list";

export default async function ModeratorActionPlansPage({ searchParams }: { searchParams: { clientId?: string } }) {
    const plans = await getActionPlans(searchParams.clientId);
    return <ModeratorActionPlansList plans={plans} />;
}
