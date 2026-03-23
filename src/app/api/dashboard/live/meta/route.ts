import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MetaAPI } from '@/lib/meta-api';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get the Client profile for the logged in user
        const clientProfile = await prisma.client.findUnique({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        // 2. Find the SocialConnection explicitly mapped to this client
        const clientConnection = await (prisma as any).socialConnection.findFirst({
            where: {
                clientId: clientProfile.id,
                platform: 'FACEBOOK',
                isActive: true
            }
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

        // 3. Fetch Insights for the specific Ad Account mapped to this client
        let adInsights: any;
        try {
            adInsights = await meta.getAdAccountInsights(clientConnection.platformAccountId);
        } catch(e) { console.error('Error fetching ad insights', e); }
        const insightData = adInsights?.data?.[0] || {};
        
        let activeAdsList: any = [];
        try {
            const adsResponse: any = await meta.getActiveAds(clientConnection.platformAccountId);
            const rawAds = adsResponse?.data || [];
            activeAdsList = rawAds.map((ad: any) => {
                const adInsights = ad.insights?.data?.[0] || {};
                return {
                    id: ad.id,
                    name: ad.name,
                    status: 'active',
                    spend: `${adInsights.spend || '0.00'} SAR`,
                    results: `${adInsights.impressions || '0'} Imp`
                };
            });
        } catch(e) { console.error('Error fetching active ads', e); }
        
        let organicData: any = null;
        if (clientConnection.metadata) {
            try {
                const parsedMeta = JSON.parse(clientConnection.metadata);
                if (parsedMeta?.pageId) {
                    const pageId = parsedMeta.pageId;
                    
                    // Fetch page info for fan count (followers) and IG connection
                    let pageInfo: any = {};
                    try { pageInfo = await meta.getPageInfo(pageId); } catch(e) { console.log('error fetching page info'); }
                    
                    const pageToken = pageInfo?.access_token;
                    const igAccount = pageInfo?.instagram_business_account;
                    
                    // Fetch FB page insights for engagement and reach
                    let pageInsights: any = {};
                    if (pageToken) {
                        try { pageInsights = await meta.getPageInsights(pageId, pageToken); } catch(e) { console.log('error fetching page insights'); }
                    }
                    
                    // Helper to get the most recent value from insights data
                    const getMetricValue = (data: any, name: string) => {
                        const row = data?.find((r: any) => r.name === name);
                        if (!row?.values?.length) return 0;
                        // Return the most recent value (last in array)
                        const lastValue = row.values[row.values.length - 1].value;
                        console.log(`Metric ${name}:`, row.values);
                        return lastValue || 0;
                    };

                    const insightsData = pageInsights?.data || [];
                    let fbReach = getMetricValue(insightsData, 'page_impressions_unique');
                    let fbEngagement = getMetricValue(insightsData, 'page_post_engagements');

                    console.log('Organic FB Data:', { fbReach, fbEngagement });

                    // Fetch IG insights
                    let igFollowers = 0;
                    let igReach = 0;
                    let igInteractions = 0;
                    let igVideoViews = 0;

                    if (igAccount?.id && pageToken) {
                        igFollowers = igAccount.followers_count || 0;
                        try {
                            const igInsightsData: any = await meta.getIgInsights(igAccount.id, pageToken);
                            const igData = igInsightsData?.data || [];
                            const sumValues = (name: string) => {
                                const row = igData.find((r: any) => r.name === name);
                                if (!row?.values?.length) return 0;
                                return row.values.reduce((acc: number, v: any) => acc + (Number(v.value) || 0), 0);
                            };
                            igReach = sumValues('reach');
                            igInteractions = sumValues('total_interactions');
                            igVideoViews = sumValues('impressions');
                            console.log('Organic IG Data:', { igReach, igVideoViews, igInteractions });
                        } catch(e) { console.error('error fetching ig insights', e); }
                    }

                    organicData = {
                        fb: {
                            followers: pageInfo?.fan_count || 0,
                            reach: fbReach,
                            engagement: fbEngagement,
                        },
                        ig: {
                            followers: igFollowers,
                            reach: igReach,
                            videoViews: igVideoViews,
                            interactions: igInteractions,
                            connected: !!igAccount?.id
                        }
                    };
                }
            } catch(e) { console.error('Error fetching organic stats', e); }
        }

        return NextResponse.json({
            platform: 'META',
            accountName: clientConnection.platformAccountName || 'Linked Account',
            metrics: {
                spend: insightData.spend || '0.00',
                impressions: insightData.impressions || 0,
                clicks: insightData.clicks || 0,
                cpc: insightData.cpc || '0.00',
            },
            organicMetrics: organicData,
            activeAds: activeAdsList,
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
