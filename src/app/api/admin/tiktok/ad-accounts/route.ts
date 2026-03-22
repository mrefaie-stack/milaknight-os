import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'TIKTOK', isActive: true }
    });

    if (!connection) return NextResponse.json({ accounts: [] });

    try {
        const parsed = connection.metadata ? JSON.parse(connection.metadata) : {};
        const advertiserIds = parsed.advertiserIds || [connection.platformAccountId];

        const tiktok = new TikTokAPI(connection.accessToken);
        const info = await tiktok.getAdvertiserInfo(advertiserIds);
        const accounts = (info?.list || []).map((a: any) => ({
            id: a.advertiser_id,
            name: a.advertiser_name,
            status: a.status
        }));

        return NextResponse.json({ accounts });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
