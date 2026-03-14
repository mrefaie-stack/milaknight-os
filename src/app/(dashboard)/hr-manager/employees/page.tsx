import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEmployees, getHRStats } from "@/app/actions/hr";
import { HROverview } from "@/components/hr/hr-overview";

export default async function HRManagerEmployeesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "HR_MANAGER") {
        redirect("/login");
    }

    const [employees, stats] = await Promise.all([
        getEmployees(),
        getHRStats(),
    ]);

    return (
        <HROverview
            employees={employees as any}
            initialStats={stats}
            employeeBasePath="/hr-manager/employee"
        />
    );
}
