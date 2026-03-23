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
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'SNAPCHAT', isActive: true }
        });
        if (!connection) return NextResponse.json({ error: 'Snapchat not connected' }, { status: 404 });

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
            } catch {
                return NextResponse.json({ error: 'Token expired — please reconnect Snapchat' }, { status: 401 });
            }
        }

        const snap = new SnapchatAPI(accessToken);
        const orgId = connection.platformAccountId;

        // Get ad accounts from metadata
        let adAccounts: { id: string; name: string }[] = [];
        if (connection.metadata) {
            const meta = JSON.parse(connection.metadata);
            if (meta.adAccounts?.length > 0) adAccounts = meta.adAccounts;
        }
        if (adAccounts.length === 0) {
            const data = await snap.getAdAccounts(orgId).catch(() => ({ adaccounts: [] }));
            adAccounts = (data.adaccounts || [])
                .map((a: any) => a.adaccount).filter(Boolean)
                .map((a: any) => ({ id: a.id, name: a.name }));
        }

        // Fetch full data for ALL ad accounts and merge
        const aggregated = {
            totals: { impressions: 0, swipes: 0, spend: 0, videoViews: 0, reach: 0, uniques: 0, frequency: 0 },
            campaignCount: 0,
            activeCampaignCount: 0,
            objectiveBreakdown: {} as Record<string, number>,
            activeCampaigns: [] as any[],
            topCampaigns: [] as any[],
            targeting: null as any
        };

        await Promise.allSettled(adAccounts.map(async (acc) => {
            try {
                const d = await snap.getFullAccountData(acc.id);
                aggregated.totals.impressions += d.totals.impressions;
                aggregated.totals.swipes += d.totals.swipes;
                aggregated.totals.spend += d.totals.spend;
                aggregated.totals.videoViews += d.totals.videoViews;
                aggregated.totals.reach += d.totals.reach;
                aggregated.totals.uniques += d.totals.uniques;
                aggregated.campaignCount += d.campaignCount;
                aggregated.activeCampaignCount += d.activeCampaignCount;
                for (const [obj, count] of Object.entries(d.objectiveBreakdown)) {
                    aggregated.objectiveBreakdown[obj] = (aggregated.objectiveBreakdown[obj] || 0) + (count as number);
                }
                aggregated.activeCampaigns.push(...d.activeCampaigns);
                aggregated.topCampaigns.push(...d.topCampaigns);
                if (!aggregated.targeting && d.targeting) aggregated.targeting = d.targeting;
            } catch (e) {
                console.error(`Snapchat full data failed for ${acc.id}:`, e);
            }
        }));

        // Sort combined top campaigns
        aggregated.topCampaigns.sort((a, b) => b.stats.impressions - a.stats.impressions);
        aggregated.topCampaigns = aggregated.topCampaigns.slice(0, 5);

        return NextResponse.json({
            platform: 'SNAPCHAT',
            accountName: connection.platformAccountName || 'Snapchat',
            username: 'milaknight.mk',
            adAccountsCount: adAccounts.length,
            stats: aggregated.totals,
            campaignCount: aggregated.campaignCount,
            activeCampaignCount: aggregated.activeCampaignCount,
            objectiveBreakdown: aggregated.objectiveBreakdown,
            activeCampaigns: aggregated.activeCampaigns,
            topCampaigns: aggregated.topCampaigns,
            targeting: aggregated.targeting,
            period: 'lifetime',
            status: 'success'
        });
    } catch (error: any) {
        console.error('Snapchat Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
