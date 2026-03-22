'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Link2, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function SnapchatMapping() {
    const [clients, setClients] = useState<any[]>([]);
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [linking, setLinking] = useState<string | null>(null);
    const [draftLinks, setDraftLinks] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, accountsRes] = await Promise.all([
                    fetch('/api/admin/clients/list-with-social'),
                    fetch('/api/admin/snapchat/ad-accounts')
                ]);
                const clientsJson = await clientsRes.json();
                const accountsJson = await accountsRes.json();
                if (clientsJson.clients) setClients(clientsJson.clients);
                if (accountsJson.accounts) setAdAccounts(accountsJson.accounts);
            } catch (error) {
                console.error('Snapchat mapping fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSave = async (clientId: string) => {
        const accountId = draftLinks[clientId];
        if (!accountId) {
            toast.error('Please select an Ad Account');
            return;
        }
        const accountName = adAccounts.find(a => a.id === accountId)?.name || 'Unknown';

        setLinking(clientId);
        try {
            const res = await fetch('/api/admin/clients/link-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    platformAccountId: accountId,
                    platformAccountName: accountName,
                    platform: 'SNAPCHAT'
                })
            });
            if (!res.ok) throw new Error('Failed to link');
            toast.success(`Snapchat account linked to client`);

            setClients(prev => prev.map(c => {
                if (c.id === clientId) {
                    const snapConnections = c.snapchatConnections || [];
                    return {
                        ...c,
                        snapchatConnections: [{ platformAccountId: accountId, platformAccountName: accountName }],
                        ...(snapConnections.length === 0 ? {} : {})
                    };
                }
                return c;
            }));

            setDraftLinks(prev => {
                const next = { ...prev };
                delete next[clientId];
                return next;
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLinking(null);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-32 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    if (adAccounts.length === 0) return null;

    return (
        <Card className="mt-8 border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Link2 className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Client Snapchat Mapping</CardTitle>
                        <CardDescription>Assign Snapchat Ad Accounts to your clients.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search clients..."
                        className="pl-10 bg-muted/30 border-border rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    {filteredClients.map(client => {
                        const snapConn = client.socialConnections?.find((c: any) => c.platform === 'SNAPCHAT');
                        const isDrafting = draftLinks[client.id] !== undefined;
                        const selectedAccountId = draftLinks[client.id] ?? (snapConn?.platformAccountId || '');

                        return (
                            <div key={client.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg border border-border hover:border-border/80 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-muted/30 overflow-hidden flex items-center justify-center shrink-0">
                                        {client.logoUrl ? (
                                            <img src={client.logoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold">{client.name[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{client.name}</h4>
                                        {snapConn?.platformAccountName ? (
                                            <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-1">
                                                <Check className="w-3 h-3" /> {snapConn.platformAccountName}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground mt-1 block">No Snapchat Ad Account assigned</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-medium text-muted-foreground">Ad Account</span>
                                        <Select
                                            value={selectedAccountId}
                                            onValueChange={(val) => setDraftLinks(p => ({ ...p, [client.id]: val }))}
                                            disabled={linking === client.id}
                                        >
                                            <SelectTrigger className="w-[200px] bg-muted/30 border-border rounded-xl text-xs h-9">
                                                <SelectValue placeholder="Select Ad Account" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl max-h-[300px]">
                                                {adAccounts.map(acc => (
                                                    <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                                        {acc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col justify-end mt-4">
                                        <Button
                                            size="sm"
                                            disabled={!isDrafting || linking === client.id}
                                            onClick={() => handleSave(client.id)}
                                            className="h-9 rounded-xl px-6 bg-yellow-500 hover:bg-yellow-500/90 text-black font-bold text-xs"
                                        >
                                            {linking === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
