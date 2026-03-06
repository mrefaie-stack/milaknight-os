"use client";

import Link from "next/link";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { EditClientDialog } from "@/components/admin/edit-client-dialog";

export function ClientList({ clients, accountManagers }: { clients: any[], accountManagers?: any[] }) {
    if (clients.length === 0) {
        return (
            <div className="border border-dashed rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-2">
                <h3 className="font-semibold text-lg">No clients found</h3>
                <p className="text-muted-foreground text-sm">You haven't added any clients yet. Start by adding a new one.</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Account Manager</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.industry || "-"}</TableCell>
                            <TableCell>
                                {client.accountManager
                                    ? `${client.accountManager.firstName} ${client.accountManager.lastName}`
                                    : "Unassigned"}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                    {client.services?.length > 0 ? (
                                        client.services.map((s: any) => (
                                            <Badge key={s.id} variant="secondary">{s.name}</Badge>
                                        ))
                                    ) : (
                                        <span className="text-muted-foreground text-sm">None</span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right flex items-center justify-end gap-3">
                                <Link
                                    href={`${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? '/admin' : '/am'}/clients/${client.id}`}
                                    className="text-sm font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                                >
                                    View Profile
                                </Link>
                                {accountManagers && (
                                    <EditClientDialog client={client} accountManagers={accountManagers} />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
