import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClientInsight, getClientInsightHistory } from "@/app/actions/insights";
import { IndustryView } from "@/components/client/insights/industry-view";

export default async function ClientIndustryPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    const [current, history] = await Promise.all([
        getClientInsight("INDUSTRY"),
        getClientInsightHistory("INDUSTRY"),
    ]);

    return <IndustryView current={current} history={history} />;
}
