import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const base = process.env.NEXTAUTH_URL!;

    if (error || !code) {
        return NextResponse.redirect(`${base}/client/connections?error=google_denied`);
    }

    // Verify state + PKCE
    const cookieStore = await cookies();
    const savedState = cookieStore.get('google_state')?.value;
    const codeVerifier = cookieStore.get('google_code_verifier')?.value;

    if (!savedState || savedState !== state || !codeVerifier) {
        return NextResponse.redirect(`${base}/client/connections?error=google_state`);
    }

    try {
        // Exchange code for tokens
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${base}/api/auth/google/callback`,
                code_verifier: codeVerifier
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('Google token exchange failed:', tokenData);
            return NextResponse.redirect(`${base}/client/connections?error=google_token`);
        }

        const { access_token, refresh_token, expires_in } = tokenData;

        // Fetch YouTube channel info
        let channelId = '';
        let channelTitle = '';
        let subscriberCount = 0;
        try {
            const ytRes = await fetch(
                'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
                { headers: { Authorization: `Bearer ${access_token}` } }
            );
            const ytData = await ytRes.json();
            const channel = ytData.items?.[0];
            if (channel) {
                channelId = channel.id;
                channelTitle = channel.snippet?.title || '';
                subscriberCount = Number(channel.statistics?.subscriberCount) || 0;
            }
        } catch (e) {
            console.error('Google callback: YouTube channel fetch failed:', e);
        }

        // Fetch Google Ads accessible customers
        let adsCustomerIds: string[] = [];
        if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
            try {
                const adsRes = await fetch(
                    'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN
                        }
                    }
                );
                const adsText = await adsRes.text();
                console.log('Google Ads callback status:', adsRes.status);
                console.log('Google Ads callback body:', adsText.slice(0, 300));
                try {
                    const adsData = JSON.parse(adsText);
                    adsCustomerIds = (adsData.resourceNames || []).map(
                        (r: string) => r.replace('customers/', '')
                    );
                } catch {
                    console.error('Google Ads callback: response is not JSON (HTML redirect?)');
                }
            } catch (e) {
                console.error('Google callback: Ads customers fetch failed:', e);
            }
        }

        // Find client profile
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) {
            return NextResponse.redirect(`${base}/client/connections?error=no_profile`);
        }

        // Upsert GOOGLE connection
        const existingConn = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'GOOGLE', isActive: true },
            select: { id: true }
        });

        await (prisma as any).socialConnection.upsert({
            where: { id: existingConn?.id ?? 'new' },
            create: {
                userId: session.user.id,
                clientId: clientProfile.id,
                platform: 'GOOGLE',
                platformAccountId: channelId || session.user.id,
                platformAccountName: channelTitle || session.user.name || 'Google Account',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
                isActive: true,
                metadata: JSON.stringify({ channelId, channelTitle, subscriberCount, adsCustomerIds })
            },
            update: {
                platformAccountId: channelId || session.user.id,
                platformAccountName: channelTitle || session.user.name || 'Google Account',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
                isActive: true,
                metadata: JSON.stringify({ channelId, channelTitle, subscriberCount, adsCustomerIds })
            }
        });

        // Clear cookies
        cookieStore.delete('google_state');
        cookieStore.delete('google_code_verifier');

        const needsSelect = adsCustomerIds.length > 1;
        return NextResponse.redirect(`${base}/client/connections?success=google${needsSelect ? '&select=1' : ''}`);
    } catch (e: any) {
        console.error('Google callback error:', e);
        return NextResponse.redirect(`${base}/client/connections?error=google_error`);
    }
}
