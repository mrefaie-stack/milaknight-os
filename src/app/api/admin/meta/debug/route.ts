import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

async function g(path: string, token: string, extra: Record<string, string> = {}) {
    const url = new URL(`${GRAPH_URL}${path}`);
    url.searchParams.set('access_token', token);
    for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
    const res = await fetch(url.toString());
    const json = await res.json();
    return { status: res.status, ok: res.ok, data: json };
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'FACEBOOK', isActive: true }
    });

    if (!connection) return NextResponse.json({ error: 'Not connected' });

    const token = connection.accessToken;

    const [meResult, accountsResult, bizResult, permissionsResult] = await Promise.all([
        g('/me', token, { fields: 'id,name,email' }),
        g('/me/accounts', token, { fields: 'name,id,category', limit: '100' }),
        g('/me/businesses', token, { fields: 'id,name', limit: '100' }),
        g('/me/permissions', token),
    ]);

    // Fetch owned/client pages from each business
    const bizPages: any[] = [];
    for (const biz of (bizResult.data?.data || [])) {
        const owned = await g(`/${biz.id}/owned_pages`, token, { fields: 'id,name', limit: '20' });
        const client = await g(`/${biz.id}/client_pages`, token, { fields: 'id,name', limit: '20' });
        bizPages.push({ bizId: biz.id, bizName: biz.name, owned, client });
    }

    return NextResponse.json({
        me: meResult,
        personal_pages: accountsResult,
        businesses: bizResult,
        biz_pages: bizPages,
        permissions: permissionsResult,
        token_length: token?.length
    });
}
