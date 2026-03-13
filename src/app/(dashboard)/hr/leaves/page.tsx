import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMyLeaves } from "@/app/actions/hr";
import { LeaveRequestForm } from "@/components/hr/leave-request-form";

export default async function MyLeavesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === "CLIENT") redirect("/login");

    const leaves = await getMyLeaves();

    return <LeaveRequestForm leaves={leaves as any} />;
}
