import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up client profile to find admin-linked connections (which have userId = admin's ID)
    const clientProfile = await (prisma as any).client.findFirst({
        where: { userId: session.user.id },
        select: { id: true }
    });

    if (!clientProfile) {
        return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    const connections = await (prisma as any).socialConnection.findMany({
        where: { clientId: clientProfile.id, isActive: true },
        select: { platform: true }
    });

    const platforms = connections.map((c: any) => c.platform);
    return NextResponse.json({
        facebook: platforms.includes('FACEBOOK'),
        snapchat: platforms.includes('SNAPCHAT'),
        tiktok: platforms.includes('TIKTOK'),
        linkedin: platforms.includes('LINKEDIN'),
        x: platforms.includes('X'),
        salla: platforms.includes('SALLA'),
        google: platforms.includes('GOOGLE')
    });
}
