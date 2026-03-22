import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { LinkedInAPI } from '@/lib/linkedin-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'LINKEDIN', isActive: true }
        });
        if (!connection) return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 404 });

        // Refresh token if expired
        let accessToken = connection.accessToken;
        if (connection.expiresAt && new Date(connection.expiresAt) <= new Date() && connection.refreshToken) {
            try {
                const refreshed = await LinkedInAPI.refreshAccessToken(connection.refreshToken);
                accessToken = refreshed.access_token;
                await (prisma as any).socialConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: refreshed.access_token,
                        expiresAt: new Date(Date.now() + refreshed.expires_in * 1000)
                    }
                });
            } catch (e) {
                console.error('LinkedIn token refresh failed:', e);
                return NextResponse.json({ error: 'Token expired — please reconnect LinkedIn' }, { status: 401 });
            }
        }

        const li = new LinkedInAPI(accessToken);
        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
        const orgId = meta.orgId;

        const stats = {
            followers: 0,
            uniqueVisitors: 0,
            pageViews: 0,
            impressions: 0,
            engagement: 0,
            clicks: 0,
            shares: 0
        };

        if (orgId) {
            // Get follower count
            try {
                const followerData = await li.getOrganizationFollowers(orgId);
                const total = followerData.elements?.[0]?.followerCountsByAssociationType?.find(
                    (f: any) => f.associationType === 'FOLLOWER'
                );
                if (total) stats.followers = total.followerCounts?.organicFollowerCount || 0;
                // Fallback: sum all follower counts
                if (!stats.followers && followerData.elements?.[0]) {
                    const counts = followerData.elements[0].followerCountsByAssociationType || [];
                    stats.followers = counts.reduce((sum: number, c: any) => sum + (c.followerCounts?.organicFollowerCount || 0), 0);
                }
            } catch (e) {
                console.error('LinkedIn follower stats failed:', e);
            }

            // Get page stats (unique visitors, page views)
            try {
                const pageData = await li.getOrganizationPageStats(orgId);
                const totalStats = pageData.elements?.find((e: any) => !e.timeRange); // total entry
                if (totalStats) {
                    stats.uniqueVisitors = totalStats.totalPageStatistics?.views?.uniquePageViews || 0;
                    stats.pageViews = totalStats.totalPageStatistics?.views?.pageViews || 0;
                }
            } catch (e) {
                console.error('LinkedIn page stats failed:', e);
            }

            // Get share/post stats for last 30 days
            try {
                const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
                const until = Date.now();
                const shareData = await li.getOrganizationShareStats(orgId, since, until);
                const elements = shareData.elements || [];
                stats.impressions = elements.reduce((s: number, e: any) => s + (e.totalShareStatistics?.impressionCount || 0), 0);
                stats.engagement = elements.reduce((s: number, e: any) => s + (e.totalShareStatistics?.engagement || 0), 0);
                stats.clicks = elements.reduce((s: number, e: any) => s + (e.totalShareStatistics?.clickCount || 0), 0);
                stats.shares = elements.reduce((s: number, e: any) => s + (e.totalShareStatistics?.shareCount || 0), 0);
            } catch (e) {
                console.error('LinkedIn share stats failed:', e);
            }
        }

        return NextResponse.json({
            platform: 'LINKEDIN',
            accountName: connection.platformAccountName || 'LinkedIn',
            orgId,
            stats,
            status: 'success'
        });
    } catch (error: any) {
        console.error('LinkedIn Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
