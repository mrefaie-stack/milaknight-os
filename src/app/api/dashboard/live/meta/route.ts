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
        // 1. Get the Facebook connection for this user
        const connection = await (prisma as any).socialConnection.findFirst({
            where: {
                userId: session.user.id,
                platform: 'FACEBOOK',
                isActive: true
            }
        });

        if (!connection) {
            return NextResponse.json({ error: 'No Meta connection found' }, { status: 404 });
        }

        const meta = new MetaAPI(connection.accessToken);

        // 2. Fetch Ad Accounts to pick the first one (for now)
        // In a real app, you'd store the preferred adAccountId in the SocialConnection metadata
        const adAccountsResponse = await meta.getAdAccounts();
        const firstAccount = adAccountsResponse.data?.[0];

        let adInsights = null;
        if (firstAccount) {
            adInsights = await meta.getAdAccountInsights(firstAccount.id);
        }

        // 3. Construct the response
        return NextResponse.json({
            platform: 'META',
            accountName: firstAccount?.name || 'Linked Account',
            metrics: {
                spend: adInsights?.data?.[0]?.spend || '0.00',
                impressions: adInsights?.data?.[0]?.impressions || 0,
                clicks: adInsights?.data?.[0]?.clicks || 0,
                cpc: adInsights?.data?.[0]?.cpc || '0.00',
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
