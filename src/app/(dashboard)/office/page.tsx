import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOfficePresence } from "@/app/actions/presence";
import { OfficeView } from "@/components/office/office-view";

export default async function OfficePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    if (session.user.role === "CLIENT") redirect("/client");

    const initialData = await getOfficePresence();

    const dataWithCurrentUser = (initialData ?? []).map((p: any) => ({
        ...p,
        isCurrentUser: p.userId === session.user.id,
    }));

    return (
        <OfficeView
            initialData={dataWithCurrentUser}
            currentUserId={session.user.id}
        />
    );
}
