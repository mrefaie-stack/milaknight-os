import { getClients } from "@/app/actions/client";
import { TeamInsightsView } from "@/components/team/team-insights-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function InsightsPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    // Double check roles here too, though sidebar handles visibility
    const allowedRoles = ["ADMIN", "AM", "MARKETING_MANAGER", "CONTENT_LEADER", "CONTENT_TEAM", "ART_LEADER", "ART_TEAM", "SEO_LEAD", "SEO_TEAM"];
    if (!allowedRoles.includes(session.user.role)) {
        redirect("/dashboard");
    }

    const clients = await getClients();
    
    // Map clients to simpler format for the view
    const simplifiedClients = clients.map(c => ({
        id: c.id,
        name: c.name
    }));

    return (
        <div className="flex-1 overflow-y-auto">
            <TeamInsightsView clients={simplifiedClients} />
        </div>
    );
}
