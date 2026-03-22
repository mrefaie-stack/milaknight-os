import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SnapchatAPI } from '@/lib/snapchat-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find client profile
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        // Find Snapchat connection for this client
        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'SNAPCHAT', isActive: true }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Snapchat not connected' }, { status: 404 });
        }

        // Refresh token if expired
        let accessToken = connection.accessToken;
        if (connection.expiresAt && new Date(connection.expiresAt) <= new Date() && connection.refreshToken) {
            try {
                const refreshed = await SnapchatAPI.refreshAccessToken(connection.refreshToken);
                accessToken = refreshed.access_token;
                await (prisma as any).socialConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: refreshed.access_token,
                        expiresAt: new Date(Date.now() + refreshed.expires_in * 1000)
                    }
                });
            } catch (e) {
                console.error('Snapchat token refresh failed:', e);
                return NextResponse.json({ error: 'Token expired — please reconnect Snapchat' }, { status: 401 });
            }
        }

        // Date range: last 30 days
        const until = new Date();
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceStr = since.toISOString().split('T')[0];
        const untilStr = until.toISOString().split('T')[0];

        const adAccountId = connection.platformAccountId;
        const snap = new SnapchatAPI(accessToken);
        const stats = await snap.getAdAccountStats(adAccountId, sinceStr, untilStr);

        return NextResponse.json({
            platform: 'SNAPCHAT',
            accountName: connection.platformAccountName || 'Snapchat Ads',
            stats: {
                impressions: stats.impressions,
                swipes: stats.swipes,       // link clicks equivalent
                spend: stats.spend,
                videoViews: stats.videoViews,
                reach: stats.reach
            },
            status: 'success'
        });
    } catch (error: any) {
        console.error('Snapchat Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
