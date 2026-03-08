import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminRequestsUI } from "@/components/admin/admin-requests-ui";

export default async function AdminRequestsPage() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "AM")) {
        redirect("/login");
    }

    const requests = await prisma.serviceRequest.findMany({
        include: {
            globalService: true,
            client: {
                include: {
                    accountManager: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <AdminRequestsUI initialRequests={requests} />
    );
}
