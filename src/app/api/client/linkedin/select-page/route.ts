import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgId, orgName } = await req.json();
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const clientRecord = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    if (!clientRecord) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    // Find the existing LinkedIn connection for this user
    const existing = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'LINKEDIN', isActive: true }
    });
    if (!existing) return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 404 });

    // Update the connection with the selected org
    const meta = existing.metadata ? JSON.parse(existing.metadata) : {};
    await (prisma as any).socialConnection.update({
        where: { id: existing.id },
        data: {
            platformAccountId: orgId,
            platformAccountName: orgName,
            clientId: clientRecord.id,
            metadata: JSON.stringify({ ...meta, orgId, orgName })
        }
    });

    return NextResponse.json({ success: true });
}
