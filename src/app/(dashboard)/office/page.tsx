import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOfficePresence } from "@/app/actions/presence";
import { getMyRoomSession } from "@/app/actions/room";
import { OfficeView } from "@/components/office/office-view";

export default async function OfficePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");
    if (session.user.role === "CLIENT") redirect("/client");

    const [initialData, initialRoomId] = await Promise.all([
        getOfficePresence(),
        getMyRoomSession(),
    ]);

    const dataWithCurrentUser = (initialData ?? []).map((p) => ({
        ...p,
        isCurrentUser: p.userId === session.user.id,
    }));

    return (
        <OfficeView
            initialData={dataWithCurrentUser}
            currentUserId={session.user.id}
            initialRoomId={initialRoomId}
        />
    );
}
