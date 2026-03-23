import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function verifySignature(authHeader: string | null): boolean {
    const secret = process.env.SALLA_WEBHOOK_SECRET;
    if (!secret || !authHeader) return false;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
        return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
    } catch {
        return false;
    }
}

export async function POST(req: Request) {
    const rawBody = await req.text();
    const authHeader = req.headers.get('Authorization');

    if (!verifySignature(authHeader)) {
        console.warn('[Salla Webhook] Invalid signature, header:', authHeader?.slice(0, 20));
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const event = payload?.event;
    const data = payload?.data;
    const merchantId = (payload?.merchant ?? data?.merchant)?.toString();

    console.log(`[Salla Webhook] Event: ${event}, merchant: ${merchantId}`);

    try {
        switch (event) {
            case 'app.installed':
            case 'app.store.authorize': {
                // Salla sends tokens directly in webhook payload — save them
                const accessToken = data?.access_token;
                const refreshToken = data?.refresh_token;
                const expiresAt = data?.expires
                    ? new Date(data.expires * 1000)
                    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

                if (merchantId && accessToken) {
                    const existing = await (prisma as any).socialConnection.findFirst({
                        where: { platform: 'SALLA', platformAccountId: merchantId }
                    });

                    if (existing) {
                        await (prisma as any).socialConnection.update({
                            where: { id: existing.id },
                            data: {
                                accessToken,
                                refreshToken: refreshToken ?? existing.refreshToken,
                                expiresAt,
                                isActive: true
                            }
                        });
                        console.log(`[Salla Webhook] Updated tokens for merchant ${merchantId}`);
                    } else {
                        console.log(`[Salla Webhook] No existing connection for merchant ${merchantId} — tokens received but no client linked yet`);
                    }
                }
                break;
            }

            case 'order.created':
            case 'order.updated':
            case 'order.status.updated': {
                // Log for now — future: push real-time notification to client dashboard
                const storeId = data?.store_id?.toString() ?? data?.merchant?.toString();
                if (storeId) {
                    console.log(`[Salla Webhook] Order event for store ${storeId}:`, data?.id);
                }
                break;
            }

            case 'app.uninstall': {
                // Mark connection inactive when app is uninstalled
                const merchantId = data?.merchant?.toString();
                if (merchantId) {
                    await (prisma as any).socialConnection.updateMany({
                        where: { platform: 'SALLA', platformAccountId: merchantId },
                        data: { isActive: false }
                    });
                    console.log(`[Salla Webhook] App uninstalled for store ${merchantId}`);
                }
                break;
            }

            default:
                // Acknowledge all other events
                break;
        }
    } catch (e: any) {
        console.error('[Salla Webhook] Handler error:', e.message);
    }

    return NextResponse.json({ received: true });
}
