import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok-api';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const until = searchParams.get('until') || new Date().toISOString().slice(0, 10);

    try {
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'TIKTOK', isActive: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (!connection) return NextResponse.json({ error: 'TikTok not connected' }, { status: 404 });

        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
        const advertiserIds: string[] = meta.advertiserIds || [connection.platformAccountId];
        const primaryId = meta.selectedAdvertiserId || advertiserIds[0];

        console.log(`TikTok Live: advertiserId=${primaryId}, since=${since}, until=${until}`);

        const api = new TikTokAPI(connection.accessToken);

        const [infoResult, statsResult, campaignsResult, topAdsResult, identitiesResult] = await Promise.allSettled([
            api.getAdvertiserInfo(advertiserIds),
            api.getAdAccountStats(primaryId, since, until),
            api.getCampaigns(primaryId, since, until),
            api.getTopAds(primaryId, since, until),
            api.getTikTokIdentities(primaryId)
        ]);

        if (infoResult.status === 'rejected') console.error('TikTok info failed:', infoResult.reason);
        if (statsResult.status === 'rejected') console.error('TikTok stats failed:', statsResult.reason);
        if (campaignsResult.status === 'rejected') console.error('TikTok campaigns failed:', campaignsResult.reason);

        const infoList = infoResult.status === 'fulfilled' ? (infoResult.value?.list || []) : [];
        const info = infoList.find((i: any) => i.advertiser_id === primaryId) || infoList[0] || null;

        const emptyStats = {
            spend: 0, impressions: 0, clicks: 0, reach: 0, frequency: 0,
            ctr: 0, cpm: 0, cpc: 0,
            videoViews: 0, video2s: 0, video6s: 0,
            videoP25: 0, videoP50: 0, videoP75: 0, videoP100: 0,
            profileVisits: 0, follows: 0, likes: 0, comments: 0, shares: 0,
            conversions: 0, costPerConversion: 0, roas: 0
        };
        const stats = statsResult.status === 'fulfilled' ? statsResult.value : emptyStats;
        const campaigns: any[] = campaignsResult.status === 'fulfilled' ? campaignsResult.value : [];
        const topAds: any[] = topAdsResult.status === 'fulfilled' ? topAdsResult.value : [];
        const identities: any[] = identitiesResult.status === 'fulfilled' ? identitiesResult.value : [];

        console.log(`TikTok Live stats: spend=${stats.spend}, impressions=${stats.impressions}, campaigns=${campaigns.length}, identities=${identities.length}`);

        // Fetch organic profile + videos for first linked identity
        let businessProfile: any = null;
        let businessVideos: any[] = [];
        if (identities.length > 0 && identities[0].id) {
            const [profileResult, videosResult] = await Promise.allSettled([
                api.getBusinessProfile(identities[0].id),
                api.getBusinessVideos(identities[0].id)
            ]);
            if (profileResult.status === 'fulfilled') businessProfile = profileResult.value;
            else console.error('TikTok business profile failed:', profileResult.reason);
            if (videosResult.status === 'fulfilled') businessVideos = videosResult.value;
            else console.error('TikTok business videos failed:', videosResult.reason);
        }

        const currency = info?.currency || 'USD';
        const activeCampaigns = campaigns.filter((c: any) => c.status === 'ENABLE');

        const objectiveBreakdown: Record<string, number> = {};
        for (const c of campaigns) {
            const obj = c.objective || 'UNKNOWN';
            objectiveBreakdown[obj] = (objectiveBreakdown[obj] || 0) + 1;
        }

        return NextResponse.json({
            platform: 'TIKTOK',
            accountName: info?.name || connection.platformAccountName || 'TikTok',
            advertiserId: primaryId,
            currency,
            timezone: info?.timezone || '',
            country: info?.country || '',
            industryName: info?.industry || '',
            balance: info?.balance || 0,
            stats,
            campaignCount: campaigns.length,
            activeCampaignCount: activeCampaigns.length,
            campaigns: campaigns.slice(0, 10),
            topAds,
            objectiveBreakdown,
            identities,
            businessProfile,
            businessVideos,
            since,
            until,
            status: 'success'
        });
    } catch (error: any) {
        console.error('TikTok Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
