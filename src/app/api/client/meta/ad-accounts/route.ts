import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MetaAPI } from '@/lib/meta-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'FACEBOOK', isActive: true }
    });

    if (!connection) return NextResponse.json({ accounts: [] });

    try {
        const meta = new MetaAPI(connection.accessToken);
        const data = await meta.getAdAccounts();
        const accounts = (data.data || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            accountId: a.account_id
        }));
        return NextResponse.json({ accounts });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
