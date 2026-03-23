import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { YouTubeAPI } from '@/lib/youtube-api';

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
            where: { clientId: clientProfile.id, platform: 'GOOGLE', isActive: true }
        });
        if (!connection) return NextResponse.json({ error: 'Google not connected' }, { status: 404 });

        // Auto-refresh token if expired
        let accessToken = connection.accessToken;
        if (connection.expiresAt && new Date(connection.expiresAt) <= new Date() && connection.refreshToken) {
            try {
                const refreshed = await YouTubeAPI.refreshAccessToken(connection.refreshToken);
                accessToken = refreshed.access_token;
                await (prisma as any).socialConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: refreshed.access_token,
                        expiresAt: new Date(Date.now() + refreshed.expires_in * 1000)
                    }
                });
            } catch {
                return NextResponse.json({ error: 'Token expired — please reconnect Google' }, { status: 401 });
            }
        }

        const api = new YouTubeAPI(accessToken);

        // Channel stats (always available)
        const channelStats = await api.getChannelStats();
        if (!channelStats) {
            return NextResponse.json({ error: 'No YouTube channel found on this account' }, { status: 404 });
        }

        // Analytics for last 28 days
        const until = new Date().toISOString().slice(0, 10);
        const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        let analytics = {
            views: 0, estimatedMinutesWatched: 0, averageViewDuration: 0,
            subscribersGained: 0, subscribersLost: 0, likes: 0, comments: 0, shares: 0
        };
        try {
            analytics = await api.getAnalytics(channelStats.channelId, since, until);
        } catch (e) {
            console.error('YouTube analytics fetch failed:', e);
        }

        // Recent videos
        let recentVideos: any[] = [];
        try {
            recentVideos = await api.getRecentVideos(6);
        } catch (e) {
            console.error('YouTube recent videos fetch failed:', e);
        }

        return NextResponse.json({
            platform: 'YOUTUBE',
            accountName: channelStats.title,
            channelId: channelStats.channelId,
            thumbnail: channelStats.thumbnail,
            stats: {
                subscribers: channelStats.subscribers,
                totalViews: channelStats.totalViews,
                videoCount: channelStats.videoCount,
                // Last 28d analytics
                recentViews: analytics.views,
                watchTimeMinutes: analytics.estimatedMinutesWatched,
                avgViewDuration: analytics.averageViewDuration,
                subscribersGained: analytics.subscribersGained,
                likes: analytics.likes,
                comments: analytics.comments,
                shares: analytics.shares
            },
            recentVideos,
            period: `${since} → ${until}`,
            status: 'success'
        });
    } catch (error: any) {
        console.error('YouTube Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
