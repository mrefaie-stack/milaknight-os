import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

function verifySignature(rawBody: string, authHeader: string | null): boolean {
    const secret = process.env.SALLA_WEBHOOK_SECRET;
    if (!secret || !authHeader) return false;

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export async function POST(req: Request) {
    const rawBody = await req.text();
    const authHeader = req.headers.get('Authorization');

    if (!verifySignature(rawBody, authHeader)) {
        console.warn('[Salla Webhook] Invalid signature');
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

    console.log(`[Salla Webhook] Event: ${event}`);

    try {
        switch (event) {
            case 'app.store.authorize': {
                // Store connected/reconnected — update token if we have a record
                const merchantId = data?.merchant?.toString();
                if (merchantId) {
                    await (prisma as any).socialConnection.updateMany({
                        where: { platform: 'SALLA', platformAccountId: merchantId },
                        data: { isActive: true }
                    });
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
