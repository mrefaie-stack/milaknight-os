import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const clients = await (prisma as any).client.findMany({
            where: session.user.role === 'AM' ? { amId: session.user.id } : {},
            select: {
                id: true,
                name: true,
                logoUrl: true,
                socialConnections: {
                    where: { platform: 'FACEBOOK', isActive: true },
                    select: { platformAccountId: true, platformAccountName: true, metadata: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ clients });
    } catch (error: any) {
        console.error('List Clients Social Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
