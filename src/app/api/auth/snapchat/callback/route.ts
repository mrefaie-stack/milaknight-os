import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SnapchatAPI } from '@/lib/snapchat-api';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const appUrl = process.env.NEXTAUTH_URL!;
    const isClient = session.user.role === 'CLIENT';
    const returnUrl = isClient ? '/client/connections' : '/admin/connections';

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=snapchat_denied`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: process.env.SNAPCHAT_CLIENT_ID!,
            client_secret: process.env.SNAPCHAT_CLIENT_SECRET!,
            code,
            redirect_uri: `${appUrl}/api/auth/snapchat/callback`
        })
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
        console.error('Snapchat token exchange failed:', tokens);
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=snapchat_token`);
    }

    // Fetch organization info
    let orgId = 'unknown';
    let orgName = '';
    let adAccounts: any[] = [];

    try {
        const orgRes = await fetch('https://adsapi.snapchat.com/v1/me/organizations', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });
        const orgData = await orgRes.json();
        const org = orgData.organizations?.[0]?.organization;
        if (org) {
            orgId = org.id;
            orgName = org.name;
        }
    } catch (e) {
        console.error('Snapchat org fetch failed:', e);
    }

    // If client, fetch their ad accounts for auto-link
    if (isClient && orgId !== 'unknown') {
        try {
            const snap = new SnapchatAPI(tokens.access_token);
            const data = await snap.getAdAccounts(orgId);
            adAccounts = (data.adaccounts || []).map((a: any) => a.adaccount).filter(Boolean);
        } catch (e) {
            console.error('Snapchat ad accounts fetch failed:', e);
        }
    }

    const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

    // Always store the Org ID as platformAccountId — we aggregate all ad accounts at query time
    let clientRecord: any = null;
    if (isClient) {
        clientRecord = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    }

    await (prisma as any).socialConnection.upsert({
        where: {
            userId_platform_platformAccountId: {
                userId: session.user.id,
                platform: 'SNAPCHAT',
                platformAccountId: orgId
            }
        },
        update: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt,
            platformAccountName: orgName,
            isActive: true,
            clientId: clientRecord?.id || undefined,
            metadata: JSON.stringify({ orgId, orgName, adAccounts: adAccounts.map(a => ({ id: a.id, name: a.name })) })
        },
        create: {
            userId: session.user.id,
            platform: 'SNAPCHAT',
            platformAccountId: orgId,
            platformAccountName: orgName,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt,
            isActive: true,
            clientId: clientRecord?.id || null,
            metadata: JSON.stringify({ orgId, orgName, adAccounts: adAccounts.map(a => ({ id: a.id, name: a.name })) })
        }
    });

    return NextResponse.redirect(`${appUrl}${returnUrl}?success=snapchat`);
}
