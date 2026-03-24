import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'TIKTOK', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!connection) return NextResponse.json({ accounts: [] });

    const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
    const advertiserIds: string[] = meta.advertiserIds || [connection.platformAccountId];
    const selectedAdvertiserId = meta.selectedAdvertiserId || advertiserIds[0];

    try {
        const api = new TikTokAPI(connection.accessToken);
        const data = await api.getAdvertiserInfo(advertiserIds);
        const list = data?.list || [];
        const accounts = list.map((a: any) => ({
            id: a.advertiser_id,
            name: a.name || a.advertiser_id,
            currency: a.currency || 'USD',
            status: a.status || 'ENABLE'
        }));
        return NextResponse.json({ accounts, selectedAdvertiserId });
    } catch (e: any) {
        // fallback: return IDs without names
        const accounts = advertiserIds.map(id => ({ id, name: id, currency: 'USD', status: 'ENABLE' }));
        return NextResponse.json({ accounts, selectedAdvertiserId });
    }
}
