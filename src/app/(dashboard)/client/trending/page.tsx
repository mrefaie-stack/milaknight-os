import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClientInsight, getInsightLastUpdated } from "@/app/actions/insights";
import { TrendingView } from "@/components/client/insights/trending-view";

export default async function ClientTrendingPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CLIENT") redirect("/login");

    const [items, updatedAt] = await Promise.all([
        getClientInsight("TRENDING"),
        getInsightLastUpdated("TRENDING"),
    ]);

    return <TrendingView items={items} updatedAt={updatedAt} />;
}
