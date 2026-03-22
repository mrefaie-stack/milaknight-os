import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SnapchatAPI } from '@/lib/snapchat-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'SNAPCHAT', isActive: true }
    });

    if (!connection) {
        return NextResponse.json({ accounts: [] });
    }

    // Refresh token if expired (Snapchat tokens last 30 minutes)
    let accessToken = connection.accessToken;
    if (connection.expiresAt && new Date(connection.expiresAt) <= new Date() && connection.refreshToken) {
        try {
            const refreshed = await SnapchatAPI.refreshAccessToken(connection.refreshToken);
            accessToken = refreshed.access_token;
            await (prisma as any).socialConnection.update({
                where: { id: connection.id },
                data: {
                    accessToken: refreshed.access_token,
                    expiresAt: new Date(Date.now() + refreshed.expires_in * 1000)
                }
            });
        } catch (e) {
            console.error('Snapchat token refresh failed:', e);
            return NextResponse.json({ error: 'Token expired — please reconnect Snapchat' }, { status: 401 });
        }
    }

    const parsed = connection.metadata ? JSON.parse(connection.metadata) : {};
    const orgId = parsed.orgId;

    if (!orgId || orgId === 'unknown') {
        return NextResponse.json({ accounts: [] });
    }

    try {
        const snap = new SnapchatAPI(accessToken);
        const data = await snap.getAdAccounts(orgId);
        const accounts = (data.adaccounts || []).map((a: any) => ({
            id: a.adaccount?.id,
            name: a.adaccount?.name,
            currency: a.adaccount?.currency,
            status: a.adaccount?.status
        })).filter((a: any) => a.id);

        return NextResponse.json({ accounts });
    } catch (e: any) {
        console.error('Snapchat ad accounts fetch error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
