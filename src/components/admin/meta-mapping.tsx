'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ExternalLink, Link2, Search, Facebook } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function MetaMapping() {
    const [clients, setClients] = useState<any[]>([]);
    const [adAccounts, setAdAccounts] = useState<any[]>([]);
    const [pages, setPages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [linking, setLinking] = useState<string | null>(null);
    const [draftLinks, setDraftLinks] = useState<Record<string, { accountId?: string; pageId?: string }>>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, accountsRes, pagesRes] = await Promise.all([
                    fetch('/api/admin/clients/list-with-social'),
                    fetch('/api/admin/meta/ad-accounts'),
                    fetch('/api/admin/meta/pages')
                ]);
                
                const clientsJson = await clientsRes.json();
                const accountsJson = await accountsRes.json();
                const pagesJson = await pagesRes.json();
                
                if (clientsJson.clients) setClients(clientsJson.clients);
                if (accountsJson.accounts) setAdAccounts(accountsJson.accounts);
                if (pagesJson.pages) setPages(pagesJson.pages);
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLink = async (clientId: string, accountId: string, accountName: string, pageId?: string, pageName?: string) => {
        setLinking(clientId);
        try {
            const res = await fetch('/api/admin/clients/link-social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    platformAccountId: accountId,
                    platformAccountName: accountName,
                    platformPageId: pageId,
                    platformPageName: pageName,
                    platform: 'FACEBOOK'
                })
            });

            if (!res.ok) throw new Error('Failed to link');
            
            toast.success(`Account linked successfully`);
            
            // Update local state
            setClients(prev => prev.map(c => {
                if (c.id === clientId) {
                    const existing = c.socialConnections?.[0] || {};
                    return { 
                        ...c, 
                        socialConnections: [{ 
                            ...existing,
                            platformAccountId: accountId, 
                            platformAccountName: accountName,
                            metadata: pageId ? JSON.stringify({ pageId, pageName }) : existing.metadata
                        }] 
                    };
                }
                return c;
            }));
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLinking(null);
        }
    };

    const handleSave = async (clientId: string) => {
        const draft = draftLinks[clientId] || {};
        const client = clients.find(c => c.id === clientId);
        const currentMapping = client?.socialConnections?.[0];
        let parsedMeta: Record<string, any> = {};
        if (currentMapping?.metadata) {
            try { parsedMeta = JSON.parse(currentMapping.metadata); } catch(e) {}
        }
        
        const finalAccountId = draft.accountId !== undefined ? draft.accountId : currentMapping?.platformAccountId;
        const finalPageId = draft.pageId !== undefined ? draft.pageId : parsedMeta?.pageId;
        
        if (!finalAccountId) {
            toast.error("Please select an Ad Account before saving.");
            return;
        }

        const accName = adAccounts.find(a => a.id === finalAccountId)?.name || 'Unknown';
        const pageName = pages.find(p => p.id === finalPageId)?.name;

        await handleLink(clientId, finalAccountId, accName, finalPageId, pageName);
        
        setDraftLinks(prev => {
            const next = { ...prev };
            delete next[clientId];
            return next;
        });
    };

    const filteredClients = clients.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (adAccounts.length === 0) {
        return null; // Don't show mapping if not connected to meta
    }

    return (
        <Card className="mt-8 border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <Link2 className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">Client Meta Mapping</CardTitle>
                        <CardDescription>Assign specific Facebook Ad Accounts to your clients.</CardDescription>
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
                        const currentMapping = client.socialConnections?.[0];
                        let parsedMeta: any = null;
                        if (currentMapping?.metadata) {
                            try { parsedMeta = JSON.parse(currentMapping.metadata); } catch(e) {}
                        }
                        
                        const draft = draftLinks[client.id] || {};
                        const selectedAccountId = draft.accountId !== undefined ? draft.accountId : (currentMapping?.platformAccountId || "");
                        const selectedPageId = draft.pageId !== undefined ? draft.pageId : (parsedMeta?.pageId || "");
                        
                        const isDrafting = draft.accountId !== undefined || draft.pageId !== undefined;

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
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            {currentMapping?.platformAccountName ? (
                                                <span className="text-[10px] text-emerald-500 section-label font-medium flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> AD ACC: {currentMapping.platformAccountName}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground section-label font-medium">No Ad Account assigned</span>
                                            )}
                                            {parsedMeta?.pageName && (
                                                <span className="text-[10px] text-emerald-500 section-label font-medium flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> PAGE: {parsedMeta.pageName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                    {/* Ad Account Select */}
                                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-[9px] font-medium section-label text-muted-foreground">Ad Account</span>
                                        <Select 
                                            value={selectedAccountId}
                                            onValueChange={(val) => setDraftLinks(p => ({ ...p, [client.id]: { ...p[client.id], accountId: val } }))}
                                            disabled={linking === client.id}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px] bg-muted/30 border-border rounded-xl text-xs h-9">
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

                                    {/* Page Select */}
                                    <div className="flex flex-col gap-1 w-full sm:w-auto">
                                        <span className="text-[9px] font-medium section-label text-muted-foreground">FB/IG Page</span>
                                        <Select 
                                            value={selectedPageId}
                                            onValueChange={(val) => setDraftLinks(p => ({ ...p, [client.id]: { ...p[client.id], pageId: val } }))}
                                            disabled={linking === client.id || pages.length === 0}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px] bg-muted/30 border-border rounded-xl text-xs h-9">
                                                <SelectValue placeholder={pages.length > 0 ? "Select Page" : "Loading..."} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl max-h-[300px]">
                                                {pages.map(page => (
                                                    <SelectItem key={page.id} value={page.id} className="text-xs">
                                                        {page.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Save Button */}
                                    <div className="flex flex-col justify-end mt-2 sm:mt-0">
                                        <Button 
                                            size="sm" 
                                            disabled={!isDrafting || linking === client.id}
                                            onClick={() => handleSave(client.id)}
                                            className="h-9 rounded-xl px-6 bg-primary font-bold text-xs"
                                        >
                                            {linking === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
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
