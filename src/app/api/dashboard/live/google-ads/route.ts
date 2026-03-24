import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsAPI } from '@/lib/google-ads-api';
import { YouTubeAPI } from '@/lib/youtube-api';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) {
        return NextResponse.json({ error: 'Google Ads developer token not configured' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const until = searchParams.get('until') || new Date().toISOString().slice(0, 10);
    const since = searchParams.get('since') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'GOOGLE_ADS', isActive: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (!connection) return NextResponse.json({ error: 'Google Ads not connected' }, { status: 404 });

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

        // Get customer ID from stored metadata
        let customerIds: string[] = [];
        if (connection.metadata) {
            try {
                const meta = JSON.parse(connection.metadata);
                if (meta.selectedAdsCustomerId) {
                    customerIds = [meta.selectedAdsCustomerId.replace(/-/g, '')];
                }
            } catch { /* ignore */ }
        }

        if (customerIds.length === 0) {
            return NextResponse.json({
                error: 'No Google Ads Customer ID set. Go to Connections and enter your Customer ID (found in Google Ads top-right corner).'
            }, { status: 404 });
        }

        const api = new GoogleAdsAPI(accessToken, developerToken);

        // Fetch currency from first customer
        let currency = 'USD';
        try {
            const info = await api.getCustomerInfo(customerIds[0]);
            if (info?.currencyCode) currency = info.currencyCode;
        } catch { /* ignore */ }

        // Aggregate across all customer accounts
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

        // Sort campaigns by impressions
        aggregated.campaigns.sort((a, b) => b.impressions - a.impressions);

        // Campaign type breakdown
        const campaignTypeBreakdown: Record<string, { count: number; spend: number; impressions: number }> = {};
        for (const c of aggregated.campaigns) {
            const type = c.channelType || 'UNKNOWN';
            if (!campaignTypeBreakdown[type]) campaignTypeBreakdown[type] = { count: 0, spend: 0, impressions: 0 };
            campaignTypeBreakdown[type].count++;
            campaignTypeBreakdown[type].spend += c.cost || 0;
            campaignTypeBreakdown[type].impressions += c.impressions || 0;
        }

        // Device breakdown (first customer only for now)
        let deviceBreakdown: Record<string, { impressions: number; clicks: number; cost: number }> = {};
        try {
            deviceBreakdown = await api.getDeviceBreakdown(customerIds[0], since, until);
        } catch { /* ignore */ }

        // Top keywords for search campaigns (best-effort)
        let topKeywords: any[] = [];
        const hasSearchCampaigns = campaignTypeBreakdown['SEARCH'] || campaignTypeBreakdown['SEARCH_AND_DISPLAY'];
        if (hasSearchCampaigns) {
            try {
                topKeywords = await api.getTopKeywords(customerIds[0], since, until);
            } catch { /* ignore */ }
        }

        const avgCtr = aggregated.totalImpressions > 0
            ? (aggregated.totalClicks / aggregated.totalImpressions) * 100
            : 0;
        const avgCpc = aggregated.totalClicks > 0
            ? aggregated.totalCost / aggregated.totalClicks
            : 0;
        const conversionRate = aggregated.totalClicks > 0
            ? (aggregated.totalConversions / aggregated.totalClicks) * 100
            : 0;
        const costPerConversion = aggregated.totalConversions > 0
            ? aggregated.totalCost / aggregated.totalConversions
            : 0;

        return NextResponse.json({
            platform: 'GOOGLE_ADS',
            accountName: connection.platformAccountName || 'Google Ads',
            currency,
            customerCount: customerIds.length,
            stats: {
                totalImpressions: aggregated.totalImpressions,
                totalClicks: aggregated.totalClicks,
                totalCost: Math.round(aggregated.totalCost * 100) / 100,
                totalConversions: Math.round(aggregated.totalConversions * 10) / 10,
                avgCtr: Math.round(avgCtr * 100) / 100,
                avgCpc: Math.round(avgCpc * 100) / 100,
                conversionRate: Math.round(conversionRate * 100) / 100,
                costPerConversion: Math.round(costPerConversion * 100) / 100
            },
            campaigns: aggregated.campaigns.slice(0, 10),
            campaignTypeBreakdown,
            deviceBreakdown,
            topKeywords,
            period: `${since} → ${until}`,
            status: 'success'
        });
    } catch (error: any) {
        console.error('Google Ads Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
