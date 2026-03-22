import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SnapchatAPI } from '@/lib/snapchat-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Find client profile
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        // Find Snapchat connection for this client
        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'SNAPCHAT', isActive: true }
        });

        if (!connection) {
            return NextResponse.json({ error: 'Snapchat not connected' }, { status: 404 });
        }

        // Refresh token if expired
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

        const snap = new SnapchatAPI(accessToken);
        const orgId = connection.platformAccountId;

        // Fetch all ad accounts for this org
        let adAccounts: { id: string; name: string }[] = [];
        try {
            // Try metadata first (already fetched at connect time)
            if (connection.metadata) {
                const meta = JSON.parse(connection.metadata);
                if (meta.adAccounts?.length > 0) {
                    adAccounts = meta.adAccounts;
                }
            }
            // Fallback: fetch live from API
            if (adAccounts.length === 0) {
                const data = await snap.getAdAccounts(orgId);
                adAccounts = (data.adaccounts || [])
                    .map((a: any) => a.adaccount)
                    .filter(Boolean)
                    .map((a: any) => ({ id: a.id, name: a.name }));
            }
        } catch (e) {
            console.error('Snapchat ad accounts fetch failed:', e);
        }

        // Date range: last 30 days
        const until = new Date();
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceStr = since.toISOString().split('T')[0];
        const untilStr = until.toISOString().split('T')[0];

        // Fetch stats for ALL ad accounts and aggregate
        const totals = {
            impressions: 0,
            swipes: 0,
            spend: 0,
            videoViews: 0,
            reach: 0,
            frequency: 0,
            uniques: 0,
            avgScreenTimeMs: 0
        };

        let successCount = 0;
        let freqSum = 0;
        let screenTimeSum = 0;

        await Promise.allSettled(
            adAccounts.map(async (acc) => {
                try {
                    const s = await snap.getAdAccountStats(acc.id, sinceStr, untilStr);
                    totals.impressions += s.impressions;
                    totals.swipes += s.swipes;
                    totals.spend += s.spend;
                    totals.videoViews += s.videoViews;
                    totals.reach += s.reach;
                    totals.uniques += s.uniques;
                    freqSum += s.frequency;
                    screenTimeSum += s.avgScreenTimeMs;
                    successCount++;
                } catch (e) {
                    console.error(`Snapchat stats failed for adaccount ${acc.id}:`, e);
                }
            })
        );

        // Average frequency and screen time across accounts
        if (successCount > 0) {
            totals.frequency = freqSum / successCount;
            totals.avgScreenTimeMs = screenTimeSum / successCount;
        }

        return NextResponse.json({
            platform: 'SNAPCHAT',
            accountName: connection.platformAccountName || 'Snapchat',
            adAccountsCount: adAccounts.length,
            stats: totals,
            status: 'success'
        });
    } catch (error: any) {
        console.error('Snapchat Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
