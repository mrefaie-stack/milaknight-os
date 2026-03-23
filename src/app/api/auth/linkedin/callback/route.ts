import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LinkedInAPI } from '@/lib/linkedin-api';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const appUrl = process.env.NEXTAUTH_URL!;
    const isClient = session.user.role === 'CLIENT';
    const returnUrl = isClient ? '/client/connections' : '/admin/connections';

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=linkedin_denied`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${appUrl}/api/auth/linkedin/callback`,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!
        })
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) {
        console.error('LinkedIn token exchange failed:', tokens);
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=linkedin_token`);
    }

    const li = new LinkedInAPI(tokens.access_token);

    // Get user profile
    let profileId = session.user.id;
    let profileName = session.user.name || 'LinkedIn User';
    let orgId: string | null = null;
    let orgName = '';
    const orgList: { id: string; name: string }[] = [];

    try {
        const profile = await li.getProfile();
        profileId = profile.sub || profileId;
        profileName = profile.name || profileName;
    } catch (e) {
        console.error('LinkedIn profile fetch failed:', e);
    }

    // Try to get managed organizations
    try {
        const orgs = await li.getOrganizations();
        const elements = orgs.elements || [];
        for (const el of elements) {
            const org = el['organization~'] || el.organization;
            if (org) {
                const id = String(org.id || '').replace('urn:li:organization:', '');
                const name = org.localizedName || org.name || '';
                orgList.push({ id, name });
            }
        }
        if (orgList.length > 0) {
            orgId = orgList[0].id;
            orgName = orgList[0].name;
        }
    } catch (e) {
        console.error('LinkedIn orgs fetch failed (may need Community Management API approval):', e);
    }

    const expiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // LinkedIn tokens last 60 days

    let clientRecord: any = null;
    if (isClient) {
        clientRecord = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    }

    const platformAccountId = orgId || profileId;
    const platformAccountName = orgName || profileName;

    await (prisma as any).socialConnection.upsert({
        where: {
            userId_platform_platformAccountId: {
                userId: session.user.id,
                platform: 'LINKEDIN',
                platformAccountId
            }
        },
        update: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt,
            platformAccountName,
            isActive: true,
            clientId: clientRecord?.id || undefined,
            metadata: JSON.stringify({ profileId, profileName, orgId, orgName, organizations: orgList })
        },
        create: {
            userId: session.user.id,
            platform: 'LINKEDIN',
            platformAccountId,
            platformAccountName,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || null,
            expiresAt,
            isActive: true,
            clientId: clientRecord?.id || null,
            metadata: JSON.stringify({ profileId, profileName, orgId, orgName, organizations: orgList })
        }
    });

    // If we found organizations, redirect with select flag to let user pick their page
    const redirectParam = orgList.length > 0 ? '?success=linkedin&select=1' : '?success=linkedin&no_pages=1';
    return NextResponse.redirect(`${appUrl}${returnUrl}${redirectParam}`);
}
