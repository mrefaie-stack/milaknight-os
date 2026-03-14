import { getClients } from "@/app/actions/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ModeratorClientsUI } from "@/components/moderator/moderator-clients-ui";

export default async function SeoLeadClientsPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SEO_LEAD") redirect("/login");
    const clients = await getClients();
    return <ModeratorClientsUI clients={clients} />;
}
