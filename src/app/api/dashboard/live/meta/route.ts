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

        const meta = new MetaAPI(clientConnection.accessToken);

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
                    
                    let fbReach = 0;
                    let fbEngagement = 0;
                    
                    const insightsData = pageInsights?.data || [];
                    for (const row of insightsData) {
                        if (row.name === 'page_impressions_unique') fbReach = row.values?.[0]?.value || 0;
                        if (row.name === 'page_post_engagements') fbEngagement = row.values?.[0]?.value || 0;
                    }

                    // Fetch IG insights
                    let igFollowers = 0;
                    let igReach = 0;
                    let igProfileViews = 0;

                    if (igAccount?.id && pageToken) {
                        igFollowers = igAccount.followers_count || 0;
                        try {
                            const igInsights: any = await meta.getIgInsights(igAccount.id, pageToken);
                            for (const row of igInsights?.data || []) {
                                if (row.name === 'reach') igReach = row.values?.[0]?.value || 0;
                                if (row.name === 'profile_views') igProfileViews = row.values?.[0]?.value || 0;
                            }
                        } catch(e) { console.log('error fetching ig insights'); }
                    }

                    organicData = {
                        followers: (pageInfo?.fan_count || 0) + igFollowers,
                        engagement: fbEngagement, // Using FB engagement as general interaction proxy
                        reach: fbReach + igReach,
                        pageViews: igProfileViews, // Falling back to IG Profile views since FB page views endpoint takes diff permissions
                        fb_followers: pageInfo?.fan_count || 0,
                        ig_followers: igFollowers,
                        ig_connected: !!igAccount?.id
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
