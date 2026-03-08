import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientServiceCatalog } from "@/components/clients/client-service-catalog";

export default async function ClientServicesPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const client = await prisma.client.findFirst({
        where: { userId: session.user.id },
        include: {
            services: { include: { globalService: true } }
        }
    });

    if (!client) {
        return <div className="p-10 text-center font-bold">Client profile not found.</div>;
    }

    const globalServices = await prisma.globalService.findMany({
        orderBy: { nameEn: "asc" }
    });

    const requests = await prisma.serviceRequest.findMany({
        where: { clientId: client.id },
        include: { globalService: true },
        orderBy: { createdAt: "desc" }
    });

    return (
        <ClientServiceCatalog
            client={client}
            globalServices={globalServices}
            requests={requests}
        />
    );
}
