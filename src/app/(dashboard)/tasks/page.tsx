import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInternalTasks } from "@/app/actions/task";
import { getClients } from "@/app/actions/client";
import { TasksView } from "@/components/tasks/tasks-view";

export default async function TasksPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

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
