import { getActionPlans } from "@/app/actions/action-plan";
import { AmActionPlansList } from "@/components/action-plan/am-action-plans-list";

export default async function ActionPlansPage() {
    const plans = await getActionPlans();
    return <AmActionPlansList plans={plans} />;
}
