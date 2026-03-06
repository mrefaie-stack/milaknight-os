import { getTeamMembers } from "@/app/actions/user";
import { AddTeamMemberDialog } from "@/components/admin/add-team-member";
import { EditTeamMemberDialog } from "@/components/admin/edit-am-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function AdminTeamPage() {
    const team = await getTeamMembers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground font-medium">Manage your agency's Account Managers and their workloads.</p>
                </div>
                <AddTeamMemberDialog />
            </div>

            <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Member Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Assigned Clients</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(team as any).map((member: any) => (
                            <TableRow key={member.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-semibold">{member.firstName} {member.lastName}</TableCell>
                                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                        {member.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${Math.min((member._count.clients / 10) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-medium">{member._count.clients} Clients</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right flex items-center justify-end gap-3 font-bold">
                                    <Link href={`/messages?userId=${member.id}`} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                        <MessageSquare className="h-3 w-3" /> Message
                                    </Link>
                                    <EditTeamMemberDialog member={member} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {team.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-muted-foreground italic">No team members found. Invite your first AM above.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
