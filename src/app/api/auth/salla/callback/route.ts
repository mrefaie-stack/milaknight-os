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
        return NextResponse.redirect(`${base}/client/connections?error=salla_denied`);
    }

    const cookieStore = await cookies();
    const savedState = cookieStore.get('salla_state')?.value;
    if (!savedState || savedState !== state) {
        return NextResponse.redirect(`${base}/client/connections?error=salla_state`);
    }

    try {
        const tokenRes = await fetch('https://accounts.salla.sa/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.SALLA_CLIENT_ID!,
                client_secret: process.env.SALLA_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${base}/api/auth/salla/callback`
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('Salla token exchange failed:', tokenData);
            return NextResponse.redirect(`${base}/client/connections?error=salla_token`);
        }

        const { access_token, refresh_token, expires_in } = tokenData;

        // Get store info
        const meRes = await fetch('https://api.salla.dev/admin/v2/store/info', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const meData = await meRes.json();
        const store = meData?.data || {};

        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.redirect(`${base}/client/connections?error=no_profile`);

        const existing = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'SALLA' },
            select: { id: true }
        });

        // Salla tokens expire in 14 days if expires_in not provided
        const expiresAt = expires_in
            ? new Date(Date.now() + expires_in * 1000)
            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        await (prisma as any).socialConnection.upsert({
            where: { id: existing?.id ?? 'new' },
            create: {
                userId: session.user.id,
                clientId: clientProfile.id,
                platform: 'SALLA',
                platformAccountId: store?.id?.toString() ?? '',
                platformAccountName: store?.name ?? 'Salla Store',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt,
                metadata: JSON.stringify({ domain: store?.domain, username: store?.username }),
                isActive: true
            },
            update: {
                platformAccountId: store?.id?.toString() ?? '',
                platformAccountName: store?.name ?? 'Salla Store',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt,
                metadata: JSON.stringify({ domain: store?.domain, username: store?.username }),
                isActive: true
            }
        });

        cookieStore.delete('salla_state');
        return NextResponse.redirect(`${base}/client/connections?success=salla`);
    } catch (e: any) {
        console.error('Salla callback error:', e);
        return NextResponse.redirect(`${base}/client/connections?error=salla_error`);
    }
}
