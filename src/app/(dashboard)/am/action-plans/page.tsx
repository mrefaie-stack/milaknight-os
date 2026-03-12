import { getActionPlans } from "@/app/actions/action-plan";
import { AmActionPlansList } from "@/components/action-plan/am-action-plans-list";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ActionPlansPage() {
    const plans = await getActionPlans();
    const session = await getServerSession(authOptions);
    const role = session?.user?.role as any || "AM";

    return <AmActionPlansList plans={plans} role={role} />;
}
