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

async function fetchAllPages(token: string) {
    const pageFields = 'name,id,access_token,category,picture';
    const allPages: Map<string, any> = new Map();

    // 1. Personal pages (/me/accounts) with pagination
    let after = '';
    do {
        const params: any = { fields: pageFields, limit: '100' };
        if (after) params.after = after;
        const res: any = await g('/me/accounts', token, params);
        const data = res.data;
        if (data?.data) data.data.forEach((p: any) => allPages.set(p.id, p));
        after = data?.paging?.cursors?.after || '';
        if (!data?.paging?.next) break;
    } while (after);

    // 2. Business Manager pages
    const bizRes: any = await g('/me/businesses', token, { fields: 'id,name', limit: '100' });
    const bizList = bizRes.data?.data || [];

    for (const biz of bizList) {
        const ownedRes: any = await g(`/${biz.id}/owned_pages`, token, { fields: pageFields, limit: '100' });
        if (ownedRes.data?.data) ownedRes.data.data.forEach((p: any) => allPages.set(p.id, { ...p, _source: biz.name }));

        const clientRes: any = await g(`/${biz.id}/client_pages`, token, { fields: pageFields, limit: '100' });
        if (clientRes.data?.data) clientRes.data.data.forEach((p: any) => allPages.set(p.id, { ...p, _source: biz.name }));
    }

    return Array.from(allPages.values());
}

// Also fix pageDebug graphFetch → g
async function testPageIg(pageId: string, pageName: string, token: string) {
    const pageRes: any = await g(`/${pageId}`, token, {
        fields: 'name,fan_count,access_token,instagram_business_account{id,username,followers_count}'
    });
    const pageInfo = pageRes.data;
    const pageAccessToken = pageInfo?.access_token;
    let igDirectTest: any = null;
    if (pageInfo?.instagram_business_account?.id && pageAccessToken) {
        igDirectTest = await g(`/${pageInfo.instagram_business_account.id}/insights`, pageAccessToken, {
            metric: 'reach,profile_views', period: 'day'
        });
    }
    return {
        pageId, pageName,
        pageInfoResult: pageInfo,
        hasPageToken: !!pageAccessToken,
        igAccount: pageInfo?.instagram_business_account,
        igInsightsTest: igDirectTest
    };
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

    // Find a client connection with a page mapped
    const clientConn = await (prisma as any).socialConnection.findFirst({
        where: { clientId: { not: null }, platform: 'FACEBOOK', isActive: true, metadata: { not: null } }
    });

    let pageDebug: any = null;
    if (clientConn?.metadata) {
        try {
            const meta = JSON.parse(clientConn.metadata);
            if (meta.pageId) {
                pageDebug = await testPageIg(meta.pageId, meta.pageName, token);
            }
        } catch(e) {}
    }

    const [meResult, accountsResult, bizResult, permissionsResult] = await Promise.all([
        g('/me', token, { fields: 'id,name,email' }),
        g('/me/accounts', token, { fields: 'name,id,category', limit: '100' }),
        g('/me/businesses', token, { fields: 'id,name', limit: '100' }),
        g('/me/permissions', token),
    ]);

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
        token_length: token?.length,
        page_ig_debug: pageDebug
    });
}
