import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MetaAPI } from '@/lib/meta-api';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find the user's main Facebook connection
        const connection = await (prisma as any).socialConnection.findFirst({
            where: {
                userId: session.user.id,
                platform: 'FACEBOOK',
                isActive: true
            }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Meta account not connected' }, { status: 404 });
        }

        const meta = new MetaAPI(connection.accessToken);
        const adAccounts: any = await meta.getAdAccounts();

        return NextResponse.json({
            accounts: adAccounts.data || []
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
