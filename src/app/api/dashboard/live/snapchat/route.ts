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
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });

        if (!clientProfile) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

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

        // Get ad accounts from metadata (stored at connect time)
        let adAccounts: { id: string; name: string }[] = [];
        if (connection.metadata) {
            const meta = JSON.parse(connection.metadata);
            if (meta.adAccounts?.length > 0) adAccounts = meta.adAccounts;
        }

        // Fallback: fetch from API if not in metadata
        if (adAccounts.length === 0) {
            try {
                const data = await snap.getAdAccounts(orgId);
                adAccounts = (data.adaccounts || [])
                    .map((a: any) => a.adaccount)
                    .filter(Boolean)
                    .map((a: any) => ({ id: a.id, name: a.name }));
            } catch (e) {
                console.error('Snapchat ad accounts fetch failed:', e);
            }
        }

        // Aggregate stats across ALL ad accounts (lifetime totals)
        const totals = {
            impressions: 0, swipes: 0, spend: 0, videoViews: 0,
            reach: 0, frequency: 0, uniques: 0, campaignCount: 0
        };

        let freqSum = 0;
        let freqAccounts = 0;

        await Promise.allSettled(
            adAccounts.map(async (acc) => {
                try {
                    const s = await snap.getAdAccountStats(acc.id);
                    totals.impressions += s.impressions;
                    totals.swipes += s.swipes;
                    totals.spend += s.spend;
                    totals.videoViews += s.videoViews;
                    totals.reach += s.reach;
                    totals.uniques += s.uniques;
                    totals.campaignCount += s.campaignCount;
                    if (s.frequency > 0) { freqSum += s.frequency; freqAccounts++; }
                } catch (e) {
                    console.error(`Snapchat stats failed for ${acc.id}:`, e);
                }
            })
        );

        if (freqAccounts > 0) totals.frequency = freqSum / freqAccounts;

        return NextResponse.json({
            platform: 'SNAPCHAT',
            accountName: connection.platformAccountName || 'Snapchat',
            adAccountsCount: adAccounts.length,
            stats: totals,
            period: 'lifetime',
            status: 'success'
        });
    } catch (error: any) {
        console.error('Snapchat Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
