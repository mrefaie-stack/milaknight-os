import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform, platformAccountId, platformAccountName, pageId, pageName } = await req.json();

    // Find the client record
    const clientRecord = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    if (!clientRecord) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Get the existing raw connection (without clientId) for this platform
    const rawConn = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform, isActive: true }
    });
    if (!rawConn) return NextResponse.json({ error: 'Platform not connected yet' }, { status: 404 });

    // Update or create a client-specific connection
    const connection = await (prisma as any).socialConnection.upsert({
        where: {
            userId_platform_platformAccountId: {
                userId: session.user.id,
                platform,
                platformAccountId: platformAccountId || rawConn.platformAccountId
            }
        },
        update: {
            clientId: clientRecord.id,
            platformAccountName: platformAccountName || rawConn.platformAccountName,
            isActive: true,
            metadata: pageId
                ? JSON.stringify({ pageId, pageName })
                : rawConn.metadata
        },
        create: {
            userId: session.user.id,
            clientId: clientRecord.id,
            platform,
            platformAccountId: platformAccountId || rawConn.platformAccountId,
            platformAccountName: platformAccountName || rawConn.platformAccountName,
            accessToken: rawConn.accessToken,
            refreshToken: rawConn.refreshToken,
            expiresAt: rawConn.expiresAt,
            isActive: true,
            metadata: pageId ? JSON.stringify({ pageId, pageName }) : rawConn.metadata
        }
    });

    return NextResponse.json({ success: true, connection });
}
