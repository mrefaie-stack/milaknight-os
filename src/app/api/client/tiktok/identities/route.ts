import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Find TIKTOK connection by userId directly (most reliable)
    const adsConn = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'TIKTOK', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!adsConn) return NextResponse.json({ identities: [], selected: null });

    const adsMeta = adsConn.metadata ? JSON.parse(adsConn.metadata) : {};
    const primaryId = adsMeta.selectedAdvertiserId || adsMeta.advertiserIds?.[0] || adsConn.platformAccountId;

    // Find current organic connection by userId directly
    const organicConn = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'TIKTOK_ORGANIC', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });

    let identities: any[] = [];
    try {
        const api = new TikTokAPI(adsConn.accessToken);
        identities = await api.getTikTokIdentities(primaryId);
    } catch {
        // Fall back to any cached identities in the organic metadata
        const organicMeta = organicConn?.metadata ? JSON.parse(organicConn.metadata) : {};
        identities = organicMeta.allIdentities || adsMeta.allIdentities || [];
    }

    return NextResponse.json({
        identities,
        selected: organicConn?.platformAccountId || null,
        selectedName: organicConn?.platformAccountName || null
    });
}
