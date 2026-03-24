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
        where: { clientId: clientProfile.id, platform: 'GOOGLE_ADS', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!connection) return NextResponse.json({ accounts: [] });

    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    if (!developerToken) return NextResponse.json({ accounts: [] });

    try {
        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
        return NextResponse.json({ selected: meta.selectedAdsCustomerId || null });
    } catch {
        return NextResponse.json({ selected: null });
    }
}
