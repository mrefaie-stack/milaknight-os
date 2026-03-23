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
        return NextResponse.redirect(`${base}/client/connections?error=x_denied`);
    }

    // Verify state
    const cookieStore = await cookies();
    const savedState = cookieStore.get('x_state')?.value;
    const codeVerifier = cookieStore.get('x_code_verifier')?.value;

    if (!savedState || savedState !== state || !codeVerifier) {
        return NextResponse.redirect(`${base}/client/connections?error=x_state`);
    }

    try {
        const clientId = process.env.X_CLIENT_ID!;
        const clientSecret = process.env.X_CLIENT_SECRET!;
        const redirectUri = `${base}/api/auth/x/callback`;

        // Exchange code for tokens
        const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
            },
            body: new URLSearchParams({
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
                code_verifier: codeVerifier
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            console.error('X token exchange failed:', tokenData);
            return NextResponse.redirect(`${base}/client/connections?error=x_token`);
        }

        const { access_token, refresh_token, expires_in } = tokenData;

        // Get user info
        const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,name,username,profile_image_url', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const userData = await userRes.json();
        const user = userData.data;

        // Save to DB
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.redirect(`${base}/client/connections?error=no_profile`);

        // Upsert X connection
        await (prisma as any).socialConnection.upsert({
            where: {
                id: (await (prisma as any).socialConnection.findFirst({
                    where: { clientId: clientProfile.id, platform: 'X', isActive: true },
                    select: { id: true }
                }))?.id ?? 'new'
            },
            create: {
                userId: session.user.id,
                clientId: clientProfile.id,
                platform: 'X',
                platformAccountId: user?.id ?? '',
                platformAccountName: user?.name ?? '',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
                metadata: JSON.stringify({ username: user?.username }),
                isActive: true
            },
            update: {
                platformAccountId: user?.id ?? '',
                platformAccountName: user?.name ?? '',
                accessToken: access_token,
                refreshToken: refresh_token ?? null,
                expiresAt: expires_in ? new Date(Date.now() + expires_in * 1000) : null,
                metadata: JSON.stringify({ username: user?.username }),
                isActive: true
            }
        });

        // Clear cookies
        cookieStore.delete('x_state');
        cookieStore.delete('x_code_verifier');

        return NextResponse.redirect(`${base}/client/connections?success=x`);
    } catch (e: any) {
        console.error('X callback error:', e);
        return NextResponse.redirect(`${base}/client/connections?error=x_error`);
    }
}
