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
    const state = searchParams.get('state') || '';
    const isOrganicFlow = state.startsWith('organic_');

    if (error || !code) {
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_denied`);
    }

    let accessToken = '';
    let advertiserIds: string[] = [];

    try {
        const result = await TikTokAPI.exchangeCode(code);
        accessToken = result.access_token;
        advertiserIds = result.advertiser_ids || [];
    } catch (e) {
        console.error('TikTok token exchange failed:', e);
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_token`);
    }

    if (!accessToken) {
        console.error('TikTok: no access token');
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_no_account`);
    }

    let clientRecord: any = null;
    if (isClient) {
        clientRecord = await (prisma as any).client.findFirst({ where: { userId: session.user.id } });
    }

    // ── Organic-only flow ──────────────────────────────────────────────────────
    if (isOrganicFlow) {
        const primaryId = advertiserIds[0] || 'organic';
        try {
            const tiktokClient = new TikTokAPI(accessToken);
            const identities = await tiktokClient.getTikTokIdentities(primaryId);
            if (identities.length > 0) {
                const identity = identities[0];
                const organicMeta = JSON.stringify({
                    displayName: identity.displayName,
                    profileImage: identity.profileImage,
                    type: identity.type,
                    advertiserId: primaryId,
                    allIdentities: identities
                });
                await (prisma as any).socialConnection.upsert({
                    where: {
                        userId_platform_platformAccountId: {
                            userId: session.user.id,
                            platform: 'TIKTOK_ORGANIC',
                            platformAccountId: identity.id
                        }
                    },
                    update: {
                        accessToken,
                        isActive: true,
                        platformAccountName: identity.displayName || undefined,
                        clientId: clientRecord?.id || undefined,
                        metadata: organicMeta
                    },
                    create: {
                        userId: session.user.id,
                        platform: 'TIKTOK_ORGANIC',
                        platformAccountId: identity.id,
                        platformAccountName: identity.displayName || null,
                        accessToken,
                        isActive: true,
                        clientId: clientRecord?.id || null,
                        metadata: organicMeta
                    }
                });
            }
        } catch (e) {
            console.error('TikTok organic flow failed:', e);
            return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_organic_failed`);
        }
        return NextResponse.redirect(`${appUrl}${returnUrl}?success=tiktok_organic`);
    }

    // ── Ads flow ───────────────────────────────────────────────────────────────
    if (advertiserIds.length === 0) {
        console.error('TikTok: no advertiser IDs');
        return NextResponse.redirect(`${appUrl}${returnUrl}?error=tiktok_no_account`);
    }

    // Fetch advertiser info
    let advertiserName = '';
    try {
        const tiktok = new TikTokAPI(accessToken);
        const info = await tiktok.getAdvertiserInfo(advertiserIds);
        advertiserName = info?.list?.[0]?.name || '';
    } catch (e) {
        console.error('TikTok advertiser info failed:', e);
    }

    const primaryId = advertiserIds[0];

    // Preserve selectedAdvertiserId if it's still valid in the new advertiserIds list
    const existing = await (prisma as any).socialConnection.findFirst({
        where: { userId: session.user.id, platform: 'TIKTOK' }
    });
    const existingMeta = existing?.metadata ? JSON.parse(existing.metadata) : {};
    const preservedSelected = existingMeta.selectedAdvertiserId && advertiserIds.includes(existingMeta.selectedAdvertiserId)
        ? existingMeta.selectedAdvertiserId : primaryId;

    const newMeta = JSON.stringify({ advertiserIds, selectedAdvertiserId: preservedSelected });

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
            metadata: newMeta
        },
        create: {
            userId: session.user.id,
            platform: 'TIKTOK',
            platformAccountId: primaryId,
            platformAccountName: advertiserName || null,
            accessToken,
            isActive: true,
            clientId: clientRecord?.id || null,
            metadata: newMeta
        }
    });

    const needsSelect = advertiserIds.length > 1;
    return NextResponse.redirect(`${appUrl}${returnUrl}?success=tiktok${needsSelect ? '&select=1' : ''}`);
}
