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

    // Find the client's own Facebook connection
    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'FACEBOOK', isActive: true }
    });

    if (!connection) return NextResponse.json({ pages: [] });

    try {
        const meta = new MetaAPI(connection.accessToken);
        const data = await meta.getPages();
        const pages = (data.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            picture: p.picture?.data?.url
        }));
        return NextResponse.json({ pages });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
