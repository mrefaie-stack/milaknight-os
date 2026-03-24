import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MetaAPI } from '@/lib/meta-api';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || undefined;
    const until = searchParams.get('until') || undefined;

    try {
        const clientProfile = await prisma.client.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const clientConnection = await (prisma as any).socialConnection.findFirst({
            where: {
                clientId: clientProfile.id,
                platform: 'FACEBOOK',
                isActive: true
            },
            orderBy: { updatedAt: 'desc' }
        });

        if (!clientConnection || !clientConnection.platformAccountId) {
            return NextResponse.json({ error: 'Meta account not linked for this client' }, { status: 404 });
        }

        // Extend Meta token if expired or expiring within 7 days
        let accessToken = clientConnection.accessToken;
        const expiresAt = clientConnection.expiresAt ? new Date(clientConnection.expiresAt) : null;
        const soonThreshold = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (!expiresAt || expiresAt <= soonThreshold) {
            try {
                const extended = await MetaAPI.extendToken(accessToken);
                if (extended) {
                    accessToken = extended.access_token;
                    await (prisma as any).socialConnection.update({
                        where: { id: clientConnection.id },
                        data: {
                            accessToken: extended.access_token,
                            expiresAt: new Date(Date.now() + extended.expires_in * 1000)
                        }
                    });
                }
            } catch (e) {
                console.error('Meta token extension failed:', e);
            }
        }

        const meta = new MetaAPI(accessToken);

        // Fetch ad account currency
        let currency = 'USD';
        try {
            const acctInfo = await meta.getAdAccountInfo(clientConnection.platformAccountId);
            if (acctInfo?.currency) currency = acctInfo.currency;
        } catch { /* ignore */ }

        // Fetch insights + campaigns + active ads in parallel
        const [insightsResult, campaignsResult, activeAdsResult] = await Promise.allSettled([
            meta.getAdAccountInsights(clientConnection.platformAccountId, 'last_30d', since, until),
            meta.getCampaignInsights(clientConnection.platformAccountId, since, until),
            meta.getActiveAds(clientConnection.platformAccountId, since, until)
        ]);

        const insightData = insightsResult.status === 'fulfilled'
            ? (insightsResult.value?.data?.[0] || {})
            : {};

        const campaigns = campaignsResult.status === 'fulfilled' ? campaignsResult.value : [];

        let activeAdsList: any[] = [];
        if (activeAdsResult.status === 'fulfilled') {
            const rawAds = activeAdsResult.value?.data || [];
            activeAdsList = rawAds.map((ad: any) => {
                const adInsight = ad.insights?.data?.[0] || {};
                return {
                    id: ad.id,
                    name: ad.name,
                    status: 'active',
                    spend: `${adInsight.spend || '0.00'} ${currency}`,
                    results: `${Number(adInsight.impressions || 0).toLocaleString()} Imp`
                };
            });
        }

        // Parse conversions from actions
        const actions: any[] = insightData.actions || [];
        const conversions = actions
            .filter((a: any) => ['purchase', 'offsite_conversion.fb_pixel_purchase', 'complete_registration'].includes(a.action_type))
            .reduce((sum: number, a: any) => sum + (Number(a.value) || 0), 0);

        // Organic data
        let organicData: any = null;
        if (clientConnection.metadata) {
            try {
                const parsedMeta = JSON.parse(clientConnection.metadata);
                if (parsedMeta?.pageId) {
                    const pageId = parsedMeta.pageId;

                    let pageInfo: any = {};
                    try { pageInfo = await meta.getPageInfo(pageId); } catch { /* ignore */ }

                    const pageToken = pageInfo?.access_token;
                    const igAccount = pageInfo?.instagram_business_account;

                    let pageInsights: any = {};
                    if (pageToken) {
                        try { pageInsights = await meta.getPageInsights(pageId, pageToken, since, until); } catch { /* ignore */ }
                    }

                    const getMetricValue = (data: any, name: string) => {
                        const row = data?.find((r: any) => r.name === name);
                        if (!row?.values?.length) return 0;
                        const lastValue = row.values[row.values.length - 1].value;
                        return lastValue || 0;
                    };

                    const insightsData = pageInsights?.data || [];
                    const fbReach = getMetricValue(insightsData, 'page_impressions_unique');
                    const fbEngagement = getMetricValue(insightsData, 'page_post_engagements');
                    const fbVideoViews = getMetricValue(insightsData, 'page_video_views');
                    const fbNewFollowers = getMetricValue(insightsData, 'page_fan_adds_by_paid_non_paid_unique');

                    let igFollowers = 0, igReach = 0, igInteractions = 0, igVideoViews = 0, igProfileViews = 0, igWebsiteClicks = 0;

                    if (igAccount?.id && pageToken) {
                        igFollowers = igAccount.followers_count || 0;
                        try {
                            const igInsightsData: any = await meta.getIgInsights(igAccount.id, pageToken, since, until);
                            const igData = igInsightsData?.data || [];
                            const getIgVal = (name: string) => {
                                const row = igData.find((r: any) => r.name === name);
                                if (!row) return 0;
                                if (row.total_value?.value != null) return Number(row.total_value.value) || 0;
                                if (row.values?.length) {
                                    return row.values.reduce((acc: number, v: any) => acc + (Number(v.value) || 0), 0);
                                }
                                return 0;
                            };
                            igReach = getIgVal('reach');
                            igInteractions = getIgVal('total_interactions');
                            igVideoViews = getIgVal('views');
                            igProfileViews = getIgVal('profile_views');
                            igWebsiteClicks = getIgVal('website_clicks');
                        } catch { /* ignore */ }
                    }

                    organicData = {
                        fb: {
                            followers: pageInfo?.fan_count || 0,
                            reach: fbReach,
                            engagement: fbEngagement,
                            videoViews: fbVideoViews,
                            newFollowers: fbNewFollowers
                        },
                        ig: {
                            followers: igFollowers,
                            reach: igReach,
                            videoViews: igVideoViews,
                            interactions: igInteractions,
                            profileViews: igProfileViews,
                            websiteClicks: igWebsiteClicks,
                            connected: !!igAccount?.id
                        }
                    };
                }
            } catch { /* ignore */ }
        }

        const spend = insightData.spend || '0.00';
        const ctr = parseFloat(insightData.ctr || '0').toFixed(2);
        const frequency = parseFloat(insightData.frequency || '0').toFixed(2);
        const cpp = insightData.cpp || '0.00';
        const reach = Number(insightData.reach) || 0;

        return NextResponse.json({
            platform: 'META',
            accountName: clientConnection.platformAccountName || 'Linked Account',
            currency,
            metrics: {
                spend,
                impressions: Number(insightData.impressions) || 0,
                clicks: Number(insightData.clicks) || 0,
                cpc: insightData.cpc || '0.00',
                ctr,
                reach,
                frequency,
                cpp,
                conversions
            },
            campaigns,
            organicMetrics: organicData,
            activeAds: activeAdsList,
            period: since && until ? `${since} → ${until}` : 'Last 30 Days',
            status: 'success'
        });
    } catch (error: any) {
        console.error('Meta Dashboard API Error:', error);
        return NextResponse.json({
            error: 'Failed to fetch Meta data',
            details: error.message
        }, { status: 500 });
    }
}
