import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ClientProfileView } from "@/components/clients/client-profile-view";

export default async function AMClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            reports: { orderBy: { createdAt: "desc" }, take: 20 },
            actionPlans: {
                orderBy: { createdAt: "desc" },
                take: 20,
                include: { items: { select: { status: true } } }
            },
            services: true,
            accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
            user: { select: { id: true } },
        }
    });

    if (!client) return notFound();

    const clientData = { ...client, userId: (client as any).user?.id };

    return <ClientProfileView client={clientData} basePath="am" showNewButtons={true} />;
}
