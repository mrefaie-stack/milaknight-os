import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllLeaves } from "@/app/actions/hr";
import { HRLeavesManager } from "@/components/hr/hr-leaves-manager";

export default async function HRManagerLeavesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "HR_MANAGER") {
        redirect("/login");
    }

    const leaves = await getAllLeaves();

    return <HRLeavesManager leaves={leaves as any} />;
}
