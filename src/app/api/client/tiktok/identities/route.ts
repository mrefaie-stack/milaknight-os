import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientProfile = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    if (!clientProfile) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const adsConn = await (prisma as any).socialConnection.findFirst({
        where: { clientId: clientProfile.id, platform: 'TIKTOK', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!adsConn) return NextResponse.json({ identities: [], selected: null });

    const adsMeta = adsConn.metadata ? JSON.parse(adsConn.metadata) : {};
    const primaryId = adsMeta.selectedAdvertiserId || adsMeta.advertiserIds?.[0] || adsConn.platformAccountId;

    const organicConn = await (prisma as any).socialConnection.findFirst({
        where: { clientId: clientProfile.id, platform: 'TIKTOK_ORGANIC', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });

    let identities: any[] = [];
    try {
        const api = new TikTokAPI(adsConn.accessToken);
        identities = await api.getTikTokIdentities(primaryId);
    } catch {
        // fall back to cached in metadata
        identities = adsMeta.allIdentities || [];
    }

    return NextResponse.json({
        identities,
        selected: organicConn?.platformAccountId || null,
        selectedName: organicConn?.platformAccountName || null
    });
}
