import { getClients } from "@/app/actions/client";
import { ModeratorClientsUI } from "@/components/moderator/moderator-clients-ui";

export default async function ModeratorClientsPage() {
    const clients = await getClients();
    return <ModeratorClientsUI clients={clients} />;
}
