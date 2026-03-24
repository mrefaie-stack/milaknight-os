import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleAdsAPI } from '@/lib/google-ads-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientProfile = await (prisma as any).client.findFirst({
        where: { userId: session.user.id }
    });
    if (!clientProfile) return NextResponse.json({ accounts: [] });

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { clientId: clientProfile.id, platform: 'GOOGLE', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!connection) return NextResponse.json({ accounts: [] });

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) return NextResponse.json({ accounts: [] });

    try {
        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
        let customerIds: string[] = meta.adsCustomerIds || [];

        // If no IDs stored yet, try to discover them live
        if (customerIds.length === 0) {
            try {
                const api = new GoogleAdsAPI(connection.accessToken, developerToken);
                customerIds = await api.listAccessibleCustomers();
                if (customerIds.length > 0) {
                    await (prisma as any).socialConnection.update({
                        where: { id: connection.id },
                        data: { metadata: JSON.stringify({ ...meta, adsCustomerIds: customerIds, adsCustomers: undefined }) }
                    });
                }
            } catch (e) {
                console.error('ad-accounts: listAccessibleCustomers failed:', e);
            }
        }

        if (customerIds.length === 0) return NextResponse.json({ accounts: [] });

        // If we already have names stored, return them
        if (meta.adsCustomers?.length > 0) {
            return NextResponse.json({ accounts: meta.adsCustomers, selected: meta.selectedAdsCustomerId || null });
        }

        // Fetch names from Google Ads API
        const api = new GoogleAdsAPI(connection.accessToken, developerToken);
        const accounts = (await Promise.all(
            customerIds.map(id => api.getCustomerInfo(id))
        )).filter(Boolean) as { id: string; name: string; currencyCode: string }[];

        // Cache the names in metadata
        if (accounts.length > 0) {
            await (prisma as any).socialConnection.update({
                where: { id: connection.id },
                data: { metadata: JSON.stringify({ ...meta, adsCustomerIds: customerIds, adsCustomers: accounts }) }
            });
        }

        return NextResponse.json({ accounts, selected: meta.selectedAdsCustomerId || null });
    } catch {
        return NextResponse.json({ accounts: [] });
    }
}
