import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClientInsight, getInsightLastUpdated } from "@/app/actions/insights";
import { CompetitorsView } from "@/components/client/insights/competitors-view";

export default async function ClientCompetitorsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    const [items, updatedAt] = await Promise.all([
        getClientInsight("COMPETITORS"),
        getInsightLastUpdated("COMPETITORS"),
    ]);

    return <CompetitorsView items={items} updatedAt={updatedAt} />;
}
