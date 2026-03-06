import { getNotifications } from "@/app/actions/notification";
import { NotificationsView } from "@/components/dashboard/notifications-view";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function NotificationsPage() {
    const session = await getServerSession(authOptions);
    const notifications = await getNotifications();

    return (
        <NotificationsView initialNotifications={notifications} />
    );
}
