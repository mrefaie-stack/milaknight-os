import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ReportListClient } from "@/components/reporting/report-list-client";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default async function ClientReportsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            reports: {
                orderBy: { createdAt: "desc" },
                include: { client: true }
            }
        }
    });

    if (!client) return notFound();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                    <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">{client.name} - Reports</h1>
                    <p className="text-muted-foreground font-medium text-sm">All performance reports for this portfolio</p>
                </div>
            </div>

            <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Reports Log</CardTitle>
                    <CardDescription>Review and manage generated reports.</CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                    <ReportListClient initialReports={(client as any).reports} role="ADMIN" />
                </div>
            </Card>
        </div>
    );
}
