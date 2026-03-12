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
                    
                    // Fetch page info for fan count (followers)
                    let pageInfo: any = {};
                    try { pageInfo = await meta.getPageInfo(pageId); } catch(e) { console.log('error fetching page info'); }
                    
                    // Fetch page insights for engagement and reach
                    let pageInsights: any = {};
                    try { pageInsights = await meta.getPageInsights(pageId); } catch(e) { console.log('error fetching page insights'); }
                    
                    let reach = 0;
                    let engagement = 0;
                    
                    const insightsData = pageInsights?.data || [];
                    for (const row of insightsData) {
                        if (row.name === 'page_impressions_unique') reach = row.values?.[0]?.value || 0;
                        if (row.name === 'page_post_engagements') engagement = row.values?.[0]?.value || 0;
                    }

                    organicData = {
                        followers: pageInfo?.fan_count || 0,
                        engagement: engagement,
                        reach: reach,
                        pageViews: 0 // Cannot reliably get page views without read_insights for pages
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
