import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getClickupStatus } from "@/app/actions/clickup";
import { ClickupConnect } from "@/components/clickup/clickup-connect";
import { ClickupDashboard } from "@/components/clickup/clickup-dashboard";

export default async function ClickupPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "AM" && session.user.role !== "MARKETING_MANAGER")) {
        redirect("/login");
    }

    const status = await getClickupStatus();

    if (!status.connected) {
        return <ClickupConnect />;
    }

    return (
        <ClickupDashboard
            clickupUser={status.clickupUser}
            team={status.team}
        />
    );
}
