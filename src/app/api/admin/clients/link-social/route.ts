import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { clientId, platformAccountId, platformAccountName, platform } = await req.json();

        if (!clientId || !platformAccountId || !platform) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get the admin's master connection for this platform to copy tokens
        const masterConnection = await (prisma as any).socialConnection.findFirst({
            where: {
                userId: session.user.id,
                platform: platform,
                isActive: true
            }
        });

        if (!masterConnection) {
            return NextResponse.json({ error: `Please connect your ${platform} account first` }, { status: 404 });
        }

        // 2. Link the client to this platform account
        // We create/update a SocialConnection specifically for this client
        const connection = await (prisma as any).socialConnection.upsert({
            where: {
                userId_platform_platformAccountId: {
                    userId: session.user.id, // The AM still owns the connection tokens
                    platform: platform,
                    platformAccountId: platformAccountId
                }
            },
            update: {
                clientId: clientId,
                platformAccountName: platformAccountName,
                accessToken: masterConnection.accessToken,
                refreshToken: masterConnection.refreshToken,
                expiresAt: masterConnection.expiresAt,
                isActive: true
            },
            create: {
                userId: session.user.id,
                clientId: clientId,
                platform: platform,
                platformAccountId: platformAccountId,
                platformAccountName: platformAccountName,
                accessToken: masterConnection.accessToken,
                refreshToken: masterConnection.refreshToken,
                expiresAt: masterConnection.expiresAt,
                isActive: true
            }
        });

        return NextResponse.json({ success: true, connection });
    } catch (error: any) {
        console.error('Link Social Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
