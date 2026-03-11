import { getNotifications } from "@/app/actions/notification";
import { NotificationsView } from "@/components/dashboard/notifications-view";

export default async function NotificationsPage() {
    const notifications = await getNotifications();

    return (
        <NotificationsView initialNotifications={notifications} />
    );
}
