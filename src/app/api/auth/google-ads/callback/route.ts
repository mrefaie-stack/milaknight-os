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
        return NextResponse.redirect(`${base}/client/connections?error=google_ads_denied`);
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get('gads_state')?.value;
    const codeVerifier = cookieStore.get('gads_code_verifier')?.value;

    if (!savedState || savedState !== state || !codeVerifier) {
        return NextResponse.redirect(`${base}/client/connections?error=google_ads_state`);
    }

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${base}/api/auth/google-ads/callback`,
                code_verifier: codeVerifier
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('Google Ads token exchange failed:', tokenData);
            return NextResponse.redirect(`${base}/client/connections?error=google_ads_token`);
        }

        const { access_token, refresh_token, expires_in } = tokenData;

        // Fetch accessible customer IDs
        let adsCustomerIds: string[] = [];
        const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
        if (developerToken) {
            try {
                const adsRes = await fetch(
                    'https://googleads.googleapis.com/v19/customers:listAccessibleCustomers',
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                            'developer-token': developerToken
                        }
                    }
                );
                const adsText = await adsRes.text();
                console.log('Google Ads callback status:', adsRes.status);
                console.log('Google Ads callback body:', adsText.slice(0, 500));
                try {
                    const adsData = JSON.parse(adsText);
                    adsCustomerIds = (adsData.resourceNames || []).map(
                        (r: string) => r.replace('customers/', '')
                    );
                } catch {
                    console.error('Google Ads callback: response not JSON');
                }
            } catch (e) {
                console.error('Google Ads callback: fetch failed:', e);
            }
        }

        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) {
            return NextResponse.redirect(`${base}/client/connections?error=no_profile`);
        }

        const existingConn = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'GOOGLE_ADS', isActive: true },
            select: { id: true }
        });

        const primaryCustomerId = adsCustomerIds[0] || session.user.id;

        await (prisma as any).socialConnection.upsert({
            where: { id: existingConn?.id ?? 'new' },
            create: {
                userId: session.user.id,
                clientId: clientProfile.id,
                platform: 'GOOGLE_ADS',
                platformAccountId: primaryCustomerId,
                platformAccountName: 'Google Ads',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
                isActive: true,
                metadata: JSON.stringify({ adsCustomerIds })
            },
            update: {
                platformAccountId: primaryCustomerId,
                platformAccountName: 'Google Ads',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
                isActive: true,
                metadata: JSON.stringify({ adsCustomerIds })
            }
        });

        cookieStore.delete('gads_state');
        cookieStore.delete('gads_code_verifier');

        const needsSelect = adsCustomerIds.length > 1;
        return NextResponse.redirect(`${base}/client/connections?success=google_ads${needsSelect ? '&select=1' : ''}`);
    } catch (e: any) {
        console.error('Google Ads callback error:', e);
        return NextResponse.redirect(`${base}/client/connections?error=google_ads_error`);
    }
}
