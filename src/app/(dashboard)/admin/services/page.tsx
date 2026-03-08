import { prisma } from "@/lib/prisma";
import { AdminServicesUI } from "@/components/admin/admin-services-ui";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminServicesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        redirect("/login");
    }

    const services = await prisma.globalService.findMany({
        orderBy: { nameEn: "asc" }
    });

    return (
        <AdminServicesUI services={services} />
    );
}
