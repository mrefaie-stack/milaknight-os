import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, FolderKanban, Globe, Mail, Users, Building, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientBriefDialog } from "@/components/clients/client-brief-dialog";

export default async function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id },
        include: {
            accountManager: true,
            reports: { orderBy: { createdAt: "desc" }, take: 5 },
            actionPlans: { orderBy: { createdAt: "desc" }, take: 5 },
            services: true,
        }
    });

    if (!client) return notFound();

    return (
        <div className="space-y-8">
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
                    <ClientBriefDialog brief={client.brief} />
                    {client.userId && (
                        <Link href={`/messages?userId=${client.userId}`}>
                            <Button variant="outline" className="font-bold rounded-full">Message Client</Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* AM Info */}
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" /> Account Manager
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(client as any).accountManager ? (
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
                                    {(client as any).accountManager.firstName[0]}
                                </div>
                                <div>
                                    <p className="font-bold">{(client as any).accountManager.firstName} {(client as any).accountManager.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{(client as any).accountManager.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic text-sm">No AM assigned yet.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Services & Deliverables */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
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

                    <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Monthly Deliverables
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {client.deliverables ? (
                                <div className="space-y-2">
                                    {client.deliverables.split('\n').map((item, idx) => (
                                        item.trim() && (
                                            <div key={idx} className="flex items-center gap-3 text-sm font-medium">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                {item.trim()}
                                            </div>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-sm">No deliverables specified.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Social Links Ribbon */}
            <div className="flex flex-wrap items-center gap-3 bg-card/30 backdrop-blur-sm p-4 rounded-2xl border">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mr-2">Brand Presence:</span>

                {client.website && <Link href={client.website} target="_blank" className="p-2 bg-background hover:bg-primary/10 rounded-full transition-colors border"><Globe className="h-5 w-5" /></Link>}
                {client.facebook && <Link href={client.facebook} target="_blank" className="p-2 bg-background hover:bg-blue-500/10 hover:text-blue-500 rounded-full transition-colors border"><Facebook className="h-5 w-5" /></Link>}
                {client.instagram && <Link href={client.instagram} target="_blank" className="p-2 bg-background hover:bg-pink-500/10 hover:text-pink-500 rounded-full transition-colors border"><Instagram className="h-5 w-5" /></Link>}
                {client.linkedin && <Link href={client.linkedin} target="_blank" className="p-2 bg-background hover:bg-blue-600/10 hover:text-blue-600 rounded-full transition-colors border"><Linkedin className="h-5 w-5" /></Link>}
                {client.twitter && <Link href={client.twitter} target="_blank" className="p-2 bg-background hover:bg-sky-500/10 hover:text-sky-500 rounded-full transition-colors border"><Twitter className="h-5 w-5" /></Link>}
                {client.tiktok && <Link href={client.tiktok} target="_blank" className="p-2 bg-background hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white rounded-full transition-colors border"><span className="font-bold text-sm px-1 leading-none">TT</span></Link>}
                {client.youtube && <Link href={client.youtube} target="_blank" className="p-2 bg-background hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors border"><Youtube className="h-5 w-5" /></Link>}
                {client.snapchat && <Link href={client.snapchat} target="_blank" className="p-2 bg-background hover:bg-yellow-500/10 hover:text-yellow-500 rounded-full transition-colors border"><span className="font-bold text-sm px-1 leading-none">SC</span></Link>}

                {!client.website && !client.facebook && !client.instagram && !client.linkedin && !client.twitter && !client.tiktok && !client.youtube && !client.snapchat && (
                    <span className="text-muted-foreground italic text-sm">No social links provided.</span>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Reports */}
                <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-xl font-black">
                            <BarChart3 className="h-5 w-5 text-primary" /> Reports
                        </CardTitle>
                        <Link href={`/admin/clients/${client.id}/reports`} className="text-xs font-bold text-primary hover:underline">View All</Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(client as any).reports.map((report: any) => (
                            <Link key={report.id} href={`/am/reports/${report.id}`} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold">{report.month}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{report.status}</span>
                                </div>
                                <BarChart3 className="h-4 w-4 text-muted-foreground opacity-50" />
                            </Link>
                        ))}
                        {(client as any).reports.length === 0 && (
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
                        <Link href={`/admin/clients/${client.id}/action-plans`} className="text-xs font-bold text-primary hover:underline">View All</Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(client as any).actionPlans.map((plan: any) => (
                            <Link key={plan.id} href={`/am/action-plans/${plan.id}`} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-bold">{plan.month}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{plan.status}</span>
                                </div>
                                <FolderKanban className="h-4 w-4 text-muted-foreground opacity-50" />
                            </Link>
                        ))}
                        {(client as any).actionPlans.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground italic text-sm">No action plans created yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
