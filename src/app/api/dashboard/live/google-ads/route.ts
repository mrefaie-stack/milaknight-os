import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsAPI } from '@/lib/google-ads-api';
import { YouTubeAPI } from '@/lib/youtube-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
        return NextResponse.json({ error: 'Google Ads developer token not configured' }, { status: 503 });
    }

    try {
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'GOOGLE', isActive: true },
            orderBy: { updatedAt: 'desc' }
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

        // Get customer IDs from stored metadata or live API
        let customerIds: string[] = [];
        if (connection.metadata) {
            try {
                const meta = JSON.parse(connection.metadata);
                if (meta.adsCustomerIds?.length > 0) customerIds = meta.adsCustomerIds;
            } catch { /* ignore */ }
        }

        const api = new GoogleAdsAPI(accessToken, developerToken);

        if (customerIds.length === 0) {
            try {
                customerIds = await api.listAccessibleCustomers();
                // Update metadata with the discovered customer IDs
                if (customerIds.length > 0 && connection.metadata) {
                    const meta = JSON.parse(connection.metadata);
                    await (prisma as any).socialConnection.update({
                        where: { id: connection.id },
                        data: { metadata: JSON.stringify({ ...meta, adsCustomerIds: customerIds }) }
                    });
                }
            } catch (e: any) {
                console.error('Google Ads: listAccessibleCustomers failed:', e?.message || e);
                return NextResponse.json({
                    error: `Google Ads API error: ${e?.message || 'Unknown error'}. Make sure your Google account has Google Ads access.`
                }, { status: 502 });
            }
        }

        if (customerIds.length === 0) {
            return NextResponse.json({
                error: 'No Google Ads accounts found on this Google account. Make sure you are signed in with the correct Google account that has Google Ads.'
            }, { status: 404 });
        }

        // Last 30 days
        const until = new Date().toISOString().slice(0, 10);
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        // Aggregate across all accessible customer accounts
        const aggregated = {
            totalImpressions: 0,
            totalClicks: 0,
            totalCost: 0,
            totalConversions: 0,
            campaigns: [] as any[]
        };

        await Promise.allSettled(customerIds.map(async (customerId) => {
            try {
                const summary = await api.getAccountSummary(customerId, since, until);
                aggregated.totalImpressions += summary.totalImpressions;
                aggregated.totalClicks += summary.totalClicks;
                aggregated.totalCost += summary.totalCost;
                aggregated.totalConversions += summary.totalConversions;
                aggregated.campaigns.push(...summary.activeCampaigns.map(c => ({ ...c, customerId })));
            } catch (e) {
                console.error(`Google Ads: account ${customerId} failed:`, e);
            }
        }));

        // Sort by impressions
        aggregated.campaigns.sort((a, b) => b.impressions - a.impressions);

        const avgCtr = aggregated.totalImpressions > 0
            ? (aggregated.totalClicks / aggregated.totalImpressions) * 100
            : 0;
        const avgCpc = aggregated.totalClicks > 0
            ? aggregated.totalCost / aggregated.totalClicks
            : 0;
        const conversionRate = aggregated.totalClicks > 0
            ? (aggregated.totalConversions / aggregated.totalClicks) * 100
            : 0;

        return NextResponse.json({
            platform: 'GOOGLE_ADS',
            accountName: connection.platformAccountName || 'Google Ads',
            customerCount: customerIds.length,
            stats: {
                totalImpressions: aggregated.totalImpressions,
                totalClicks: aggregated.totalClicks,
                totalCost: Math.round(aggregated.totalCost * 100) / 100,
                totalConversions: Math.round(aggregated.totalConversions * 10) / 10,
                avgCtr: Math.round(avgCtr * 100) / 100,
                avgCpc: Math.round(avgCpc * 100) / 100,
                conversionRate: Math.round(conversionRate * 100) / 100
            },
            campaigns: aggregated.campaigns.slice(0, 10),
            period: `${since} → ${until}`,
            status: 'success'
        });
    } catch (error: any) {
        console.error('Google Ads Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
