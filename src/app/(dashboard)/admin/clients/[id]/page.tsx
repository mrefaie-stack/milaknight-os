import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ClientProfileView } from "@/components/clients/client-profile-view";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
            reports: { orderBy: { createdAt: "desc" }, take: 5 },
            actionPlans: {
                orderBy: { createdAt: "desc" },
                take: 5,
                include: { items: { select: { status: true } } }
            },
            services: true,
            user: { select: { id: true } },
        }
    });

    if (!client) return notFound();

    // Attach userId for message button
    const clientData = { ...client, userId: (client as any).user?.id };

    return <ClientProfileView client={clientData} basePath="admin" showNewButtons={false} />;
}
