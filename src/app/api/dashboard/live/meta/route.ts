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
        const adInsights: any = await meta.getAdAccountInsights(clientConnection.platformAccountId);
        const insightData = adInsights?.data?.[0] || {};

        return NextResponse.json({
            platform: 'META',
            accountName: clientConnection.platformAccountName || 'Linked Account',
            metrics: {
                spend: insightData.spend || '0.00',
                impressions: insightData.impressions || 0,
                clicks: insightData.clicks || 0,
                cpc: insightData.cpc || '0.00',
            },
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
