import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'SNAPCHAT', isActive: true }
    });

    if (!connection) return NextResponse.json({ accounts: [] });

    try {
        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
        const adAccounts = meta.adAccounts || [];
        return NextResponse.json({ accounts: adAccounts });
    } catch {
        return NextResponse.json({ accounts: [] });
    }
}
