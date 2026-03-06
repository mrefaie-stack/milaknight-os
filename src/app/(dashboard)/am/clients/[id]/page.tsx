import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FolderKanban, Globe, Mail, Users, Building, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AMClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            reports: { orderBy: { createdAt: "desc" }, take: 10 },
            actionPlans: { orderBy: { createdAt: "desc" }, take: 10 },
            services: true,
        }
    });

    if (!client) return notFound();

    return (
        <div className="space-y-8">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Link href="/am/clients" className="hover:text-primary transition-colors">My Clients</Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{client.name}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner">
                        <Building className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">{client.name}</h1>
                        <div className="flex items-center gap-4 mt-1 text-muted-foreground font-medium">
                            <span className="flex items-center gap-1"><Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{client.package}</Badge></span>
                            <span className="flex items-center gap-1 uppercase text-[10px] tracking-widest bg-muted px-2 py-0.5 rounded-full">{client.industry || "N/A"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link href={`/am/reports/create?clientId=${client.id}`}>
                        <Button className="font-bold rounded-full">Create New Report</Button>
                    </Link>
                    <Link href={`/am/action-plans/create?clientId=${client.id}`}>
                        <Button variant="outline" className="font-bold rounded-full">New Action Plan</Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Active Services */}
                <Card className="col-span-full border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Globe className="h-4 w-4" /> Active Services
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {client.activeServices?.split(',').map((s: string) => (
                                <Badge key={s} variant="secondary" className="px-3 py-1 font-bold">{s.trim()}</Badge>
                            )) || <p className="text-muted-foreground italic text-sm">No services configured.</p>}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Reports */}
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl font-black">
                            <BarChart3 className="h-5 w-5 text-primary" /> Performance Reports
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {client.reports.map((report) => (
                            <div key={report.id} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors group relative">
                                <Link href={`/am/reports/${report.id}`} className="flex flex-col flex-1">
                                    <span className="font-bold group-hover:text-primary transition-colors">{report.month}</span>
                                    <span className={`text-[10px] uppercase font-black ${report.status === 'SENT' ? 'text-emerald-500' : 'text-orange-500'}`}>{report.status}</span>
                                </Link>
                                <div className="flex items-center gap-3 relative z-10">
                                    <Link href={`/am/reports/${report.id}/edit`}>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold">Edit</Button>
                                    </Link>
                                    <BarChart3 className="h-4 w-4 text-muted-foreground opacity-30" />
                                </div>
                            </div>
                        ))}
                        {client.reports.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground italic text-sm">No reports generated yet.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Action Plans */}
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl font-black">
                            <FolderKanban className="h-5 w-5 text-primary" /> Action Plans
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {client.actionPlans.map((plan) => (
                            <Link key={plan.id} href={`/am/action-plans/${plan.id}`} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors group">
                                <div className="flex flex-col">
                                    <span className="font-bold group-hover:text-primary transition-colors">{plan.month}</span>
                                    <span className={`text-[10px] uppercase font-black ${plan.status === 'APPROVED' ? 'text-emerald-500' : 'text-orange-500'}`}>{plan.status}</span>
                                </div>
                                <FolderKanban className="h-4 w-4 text-muted-foreground opacity-30" />
                            </Link>
                        ))}
                        {client.actionPlans.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground italic text-sm">No action plans created yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
