import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { advertiserId, advertiserName } = await req.json();
    if (!advertiserId) return NextResponse.json({ error: 'advertiserId required' }, { status: 400 });

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'TIKTOK', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!connection) return NextResponse.json({ error: 'TikTok not connected' }, { status: 404 });

    const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
    meta.selectedAdvertiserId = advertiserId;

    // Do NOT change platformAccountId — it must stay as the original OAuth primary ID
    // to avoid breaking the unique constraint on reconnect.
    // selectedAdvertiserId in metadata is what the live route uses.
    await (prisma as any).socialConnection.update({
        where: { id: connection.id },
        data: {
            platformAccountName: advertiserName || advertiserId,
            metadata: JSON.stringify(meta)
        }
    });

    return NextResponse.json({ success: true });
}
