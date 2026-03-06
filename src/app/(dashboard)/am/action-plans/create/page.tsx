import { getClients } from "@/app/actions/client";
import { createActionPlan } from "@/app/actions/action-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";

export default async function CreateActionPlanPage() {
    const clients = await getClients(); // In a real app, only AM's clients

    async function onSubmit(data: FormData) {
        "use server";
        const clientId = data.get("clientId") as string;
        const month = data.get("month") as string;

        const plan = await createActionPlan(clientId, month);
        redirect(`/am/action-plans/${plan.id}`);
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Action Plan</h1>
                <p className="text-muted-foreground">Start a new monthly plan for a client.</p>
            </div>

            <form action={onSubmit} className="space-y-4 p-6 border rounded-xl bg-card">
                <div className="space-y-2">
                    <Label htmlFor="clientId">Select Client</Label>
                    <Select name="clientId" required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a client..." />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="month">Month</Label>
                    <Input id="month" name="month" type="month" required />
                </div>

                <Button type="submit" className="w-full">Create and Continue</Button>
            </form>
        </div>
    );
}
