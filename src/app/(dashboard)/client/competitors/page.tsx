import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClientInsight, getClientInsightHistory } from "@/app/actions/insights";
import { CompetitorsView } from "@/components/client/insights/competitors-view";

export default async function ClientCompetitorsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    const [current, history] = await Promise.all([
        getClientInsight("COMPETITORS"),
        getClientInsightHistory("COMPETITORS"),
    ]);

    return <CompetitorsView current={current} history={history} />;
}
