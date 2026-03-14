import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInternalTasks } from "@/app/actions/task";
import { getClients } from "@/app/actions/client";
import { TasksView } from "@/components/tasks/tasks-view";

const ALLOWED_ROLES = new Set(["ADMIN", "AM", "MARKETING_MANAGER", "ART_LEADER", "CONTENT_LEADER", "SEO_LEAD"]);

export default async function TasksPage() {
    const session = await getServerSession(authOptions);
    if (!session || !ALLOWED_ROLES.has(session.user.role)) redirect("/login");

    const tasks = await getInternalTasks();
    const clients = await getClients();

    return (
        <TasksView 
            tasks={tasks} 
            clients={clients} 
            role={session.user.role} 
        />
    );
}
