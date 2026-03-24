import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, customerName } = await req.json();
    if (!customerId) return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });

    const clientProfile = await (prisma as any).client.findFirst({
        where: { userId: session.user.id }
    });
    if (!clientProfile) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { clientId: clientProfile.id, platform: 'GOOGLE', isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    if (!connection) return NextResponse.json({ error: 'Google not connected' }, { status: 404 });

    const meta = connection.metadata ? JSON.parse(connection.metadata) : {};
    await (prisma as any).socialConnection.update({
        where: { id: connection.id },
        data: {
            metadata: JSON.stringify({ ...meta, selectedAdsCustomerId: customerId, selectedAdsCustomerName: customerName })
        }
    });

    return NextResponse.json({ ok: true });
}
