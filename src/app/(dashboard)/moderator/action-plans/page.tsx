import { getActionPlans } from "@/app/actions/action-plan";
import { ModeratorActionPlansList } from "@/components/action-plan/moderator-action-plans-list";

export default async function ModeratorActionPlansPage() {
    const plans = await getActionPlans();
    return <ModeratorActionPlansList plans={plans} />;
}
