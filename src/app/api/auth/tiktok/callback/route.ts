import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TikTokAPI } from '@/lib/tiktok-api';

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const appUrl = process.env.NEXTAUTH_URL!;
    const isClient = session.user.role === 'CLIENT';
    const returnUrl = isClient ? '/client/connections' : '/admin/connections';

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('auth_code');
    const error = searchParams.get('error');

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_denied`);
    }

    let accessToken = '';
    let advertiserIds: string[] = [];

    try {
        const result = await TikTokAPI.exchangeCode(code);
        accessToken = result.access_token;
        advertiserIds = result.advertiser_ids;
    } catch (e) {
        console.error('TikTok token exchange failed:', e);
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_token`);
    }

    if (!accessToken || advertiserIds.length === 0) {
        console.error('TikTok: no access token or advertiser IDs');
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_no_account`);
    }

    // Fetch advertiser info
    let advertiserName = '';
    try {
        const tiktok = new TikTokAPI(accessToken);
        const info = await tiktok.getAdvertiserInfo(advertiserIds);
        advertiserName = info?.list?.[0]?.advertiser_name || '';
    } catch (e) {
        console.error('TikTok advertiser info failed:', e);
    }

    // Use first advertiser as the primary account
    const primaryId = advertiserIds[0];

    let clientRecord: any = null;
    if (isClient) {
        clientRecord = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    }

    await (prisma as any).socialConnection.upsert({
        where: {
            userId_platform_platformAccountId: {
                userId: session.user.id,
                platform: 'TIKTOK',
                platformAccountId: primaryId
            }
        },
        update: {
            accessToken,
            isActive: true,
            platformAccountName: advertiserName || undefined,
            clientId: clientRecord?.id || undefined,
            metadata: JSON.stringify({ advertiserIds })
        },
        create: {
            userId: session.user.id,
            platform: 'TIKTOK',
            platformAccountId: primaryId,
            platformAccountName: advertiserName || null,
            accessToken,
            isActive: true,
            clientId: clientRecord?.id || null,
            metadata: JSON.stringify({ advertiserIds })
        }
    });

    const needsSelect = advertiserIds.length > 1;
    return NextResponse.redirect(`${appUrl}${returnUrl}?success=tiktok${needsSelect ? '&select=1' : ''}`);
}
