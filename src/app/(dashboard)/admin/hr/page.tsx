import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployees, getHRStats } from "@/app/actions/hr";
import { HROverview } from "@/components/hr/hr-overview";

export default async function HRPage() {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "MARKETING_MANAGER"].includes(session.user.role)) {
        redirect("/login");
    }

    const [employees, stats] = await Promise.all([
        getEmployees(),
        getHRStats(),
    ]);

    return <HROverview employees={employees as any} initialStats={stats} />;
}
