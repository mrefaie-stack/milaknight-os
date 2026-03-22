import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await (prisma as any).socialConnection.findMany({
        where: { userId: session.user.id, isActive: true },
        select: { platform: true }
    });

    const platforms = connections.map((c: any) => c.platform);
    return NextResponse.json({
        facebook: platforms.includes('FACEBOOK'),
        snapchat: platforms.includes('SNAPCHAT'),
        tiktok: platforms.includes('TIKTOK')
    });
}
