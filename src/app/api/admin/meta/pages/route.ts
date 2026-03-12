import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

async function graphFetch(endpoint: string, token: string, params: Record<string, string> = {}) {
    const url = new URL(`${GRAPH_URL}${endpoint}`);
    url.searchParams.append('access_token', token);
    for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v);
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return res.json();
}

async function fetchAllPages(token: string) {
    const pageFields = 'name,id,access_token,category,picture';
    const allPages: Map<string, any> = new Map();

    // 1. Personal pages (/me/accounts) with pagination
    let after = '';
    do {
        const params: any = { fields: pageFields, limit: '100' };
        if (after) params.after = after;
        const data: any = await graphFetch('/me/accounts', token, params);
        if (data?.data) data.data.forEach((p: any) => allPages.set(p.id, p));
        after = data?.paging?.cursors?.after || '';
        if (!data?.paging?.next) break;
    } while (after);

    // 2. Business Manager pages
    const businesses: any = await graphFetch('/me/businesses', token, { fields: 'id,name', limit: '100' });
    const bizList = businesses?.data || [];

    for (const biz of bizList) {
        // 2a. Owned pages
        const ownedPages: any = await graphFetch(`/${biz.id}/owned_pages`, token, { fields: pageFields, limit: '100' });
        if (ownedPages?.data) ownedPages.data.forEach((p: any) => allPages.set(p.id, { ...p, _source: biz.name }));

        // 2b. Client pages (pages you manage for other businesses)
        const clientPages: any = await graphFetch(`/${biz.id}/client_pages`, token, { fields: pageFields, limit: '100' });
        if (clientPages?.data) clientPages.data.forEach((p: any) => allPages.set(p.id, { ...p, _source: biz.name }));
    }

    return Array.from(allPages.values());
}

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const connection = await (prisma as any).socialConnection.findFirst({
            where: { userId: session.user.id, platform: 'FACEBOOK', isActive: true }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Meta account not connected' }, { status: 404 });
        }

        const pages = await fetchAllPages(connection.accessToken);
        return NextResponse.json({ pages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
