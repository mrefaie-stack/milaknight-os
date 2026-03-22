import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const appUrl = process.env.NEXTAUTH_URL!;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}/admin/connections?error=snapchat_denied`);
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
        return NextResponse.redirect(`${appUrl}/admin/connections?error=snapchat_token`);
    }

    // Fetch organization info
    let orgId = 'unknown';
    let orgName = '';
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

    const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

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
            platformAccountName: orgName || undefined,
            isActive: true,
            metadata: JSON.stringify({ orgId, orgName })
        },
        create: {
            userId: session.user.id,
            platform: 'SNAPCHAT',
            platformAccountId: orgId,
            platformAccountName: orgName || null,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt,
            isActive: true,
            metadata: JSON.stringify({ orgId, orgName })
        }
    });

    return NextResponse.redirect(`${appUrl}/admin/connections?success=snapchat`);
}
