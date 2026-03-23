import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function refreshXToken(refreshToken: string) {
    const clientId = process.env.X_CLIENT_ID!;
    const clientSecret = process.env.X_CLIENT_SECRET!;
    const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
    });
    const data = await res.json();
    if (!data.access_token) throw new Error('X token refresh failed');
    return data;
}

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'X', isActive: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (!connection) return NextResponse.json({ error: 'X not connected' }, { status: 404 });

        // Refresh token if expired
        let accessToken = connection.accessToken;
        if (connection.expiresAt && new Date(connection.expiresAt) <= new Date() && connection.refreshToken) {
            try {
                const refreshed = await refreshXToken(connection.refreshToken);
                accessToken = refreshed.access_token;
                await (prisma as any).socialConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: refreshed.access_token,
                        refreshToken: refreshed.refresh_token ?? connection.refreshToken,
                        expiresAt: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : null
                    }
                });
            } catch {
                return NextResponse.json({ error: 'Token expired — please reconnect X' }, { status: 401 });
            }
        }

        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};

        // Fetch user data via OAuth 2.0 user context
        const userRes = await fetch(
            `https://api.twitter.com/2/users/me?user.fields=public_metrics,name,username,profile_image_url,description`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const userData = await userRes.json();

        if (userData.errors || userData.title) {
            return NextResponse.json({ error: userData.detail || userData.title || 'X API error' }, { status: 502 });
        }

        const user = userData.data;

        return NextResponse.json({
            platform: 'X',
            accountName: user?.name || connection.platformAccountName || 'X Account',
            username: user?.username || meta.username,
            profileImageUrl: user?.profile_image_url,
            stats: {
                followers: user?.public_metrics?.followers_count ?? 0,
                following: user?.public_metrics?.following_count ?? 0,
                tweets: user?.public_metrics?.tweet_count ?? 0,
                likes: user?.public_metrics?.like_count ?? 0,
                listed: user?.public_metrics?.listed_count ?? 0,
            },
            status: 'success'
        });
    } catch (error: any) {
        console.error('X Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
