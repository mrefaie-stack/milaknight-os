import { getActionPlans } from "@/app/actions/action-plan";
import { ClientActionPlansList } from "@/components/action-plan/client-action-plans-list";

export default async function ClientActionPlansPage() {
    const plans = await getActionPlans();
    return <ClientActionPlansList plans={plans} />;
}
