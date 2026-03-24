import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { identityId, displayName, profileImage } = await req.json();
    if (!identityId) return NextResponse.json({ error: 'identityId required' }, { status: 400 });

    const clientProfile = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    if (!clientProfile) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const adsConn = await (prisma as any).socialConnection.findFirst({
        where: { clientId: clientProfile.id, platform: 'TIKTOK', isActive: true }
    });
    if (!adsConn) return NextResponse.json({ error: 'TikTok Ads not connected' }, { status: 404 });

    const meta = JSON.stringify({ displayName, profileImage, advertiserId: adsConn.platformAccountId });

    await (prisma as any).socialConnection.upsert({
        where: {
            userId_platform_platformAccountId: {
                userId: session.user.id,
                platform: 'TIKTOK_ORGANIC',
                platformAccountId: identityId
            }
        },
        update: {
            accessToken: adsConn.accessToken,
            isActive: true,
            platformAccountName: displayName || undefined,
            clientId: clientProfile.id,
            metadata: meta
        },
        create: {
            userId: session.user.id,
            platform: 'TIKTOK_ORGANIC',
            platformAccountId: identityId,
            platformAccountName: displayName || null,
            accessToken: adsConn.accessToken,
            isActive: true,
            clientId: clientProfile.id,
            metadata: meta
        }
    });

    return NextResponse.json({ success: true });
}
