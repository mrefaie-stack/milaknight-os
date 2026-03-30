import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MetaAPI } from '@/lib/meta-api';
import { TikTokAPI } from '@/lib/tiktok-api';
import { SnapchatAPI } from '@/lib/snapchat-api';
import { GoogleAdsAPI } from '@/lib/google-ads-api';
import { YouTubeAPI } from '@/lib/youtube-api';

export async function GET(request: Request) {
    console.log("[DEV LIVE TEST] Executing...");
    const results: any = {};
    const errors: any = {};

    try {
        const clients = await prisma.client.findMany({ select: { id: true, name: true } });
        results.clientsFound = clients.length;

        const connections = await prisma.socialConnection.findMany({
            where: { isActive: true },
            include: { client: true }
        });

        results.activeConnections = connections.length;

        for (const conn of connections) {
            const key = `${conn.platform}_${conn.id.substring(0, 5)}`;
            try {
                if (conn.platform === 'META' || conn.platform === 'FACEBOOK') {
                    const meta = new MetaAPI(conn.accessToken);
                    const info = await meta.getAdAccountInfo(conn.platformAccountId || "");
                    results[key] = { status: 'success', accountInfo: info };
                } else if (conn.platform === 'TIKTOK') {
                    const api = new TikTokAPI(conn.accessToken);
                    const info = await api.getBusinessProfile(conn.platformAccountId || "").catch(() => 'no organic');
                    const advInfo = await api.getAdvertiserInfo([conn.platformAccountId || ""]).catch((e) => e.message);
                    results[key] = { status: 'success', organic: info, advInfo };
                } else if (conn.platform === 'SNAPCHAT') {
                    const api = new SnapchatAPI(conn.accessToken);
                    const accounts = await api.getAdAccounts(conn.platformAccountId || "").catch(e => e.message);
                    results[key] = { status: 'success', accountsData: accounts };
                } else if (conn.platform === 'GOOGLE_ADS') {
                    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
                    if (!devToken) {
                        results[key] = { status: 'skipped', reason: 'No Dev Token' };
                        continue;
                    }
                    const api = new GoogleAdsAPI(conn.accessToken, devToken);
                    const cust = await api.listAccessibleCustomers().catch((e) => e.message);
                    results[key] = { status: 'success', customersData: cust };
                } else if (conn.platform === 'YOUTUBE') {
                    const api = new YouTubeAPI(conn.accessToken);
                    const channel = await api.getChannelStats().catch(e => e.message);
                    results[key] = { status: 'success', channelData: channel };
                } else {
                    results[key] = { status: 'skipped', reason: 'Unrecognized / No test logic' };
                }
            } catch (err: any) {
                errors[key] = err.message || JSON.stringify(err);
            }
        }

        return NextResponse.json({ success: true, results, errors });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 });
    }
}
