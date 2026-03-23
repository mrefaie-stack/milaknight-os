import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SallaApi, refreshSallaToken } from '@/lib/salla-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const clientProfile = await (prisma as any).client.findFirst({
            where: { userId: session.user.id }
        });
        if (!clientProfile) return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });

        const connection = await (prisma as any).socialConnection.findFirst({
            where: { clientId: clientProfile.id, platform: 'SALLA', isActive: true },
            orderBy: { updatedAt: 'desc' }
        });
        if (!connection) return NextResponse.json({ error: 'Salla not connected' }, { status: 404 });

        // Refresh token if expired
        let accessToken = connection.accessToken;
        if (connection.expiresAt && new Date(connection.expiresAt) <= new Date() && connection.refreshToken) {
            try {
                const refreshed = await refreshSallaToken(connection.refreshToken);
                accessToken = refreshed.access_token;
                await (prisma as any).socialConnection.update({
                    where: { id: connection.id },
                    data: {
                        accessToken: refreshed.access_token,
                        refreshToken: refreshed.refresh_token ?? connection.refreshToken,
                        expiresAt: refreshed.expires_in
                            ? new Date(Date.now() + refreshed.expires_in * 1000)
                            : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                    }
                });
            } catch {
                return NextResponse.json({ error: 'Token expired — please reconnect Salla' }, { status: 401 });
            }
        }

        const api = new SallaApi(accessToken);

        const [ordersResult, productsResult, customersResult, abandonedResult] = await Promise.allSettled([
            api.getOrdersSummary(),
            api.getProductsCount(),
            api.getCustomersCount(),
            api.getAbandonedCartsCount()
        ]);

        const ordersData = ordersResult.status === 'fulfilled' ? ordersResult.value : { orders: [], total: 0 };
        const totalProducts = productsResult.status === 'fulfilled' ? productsResult.value : 0;
        const totalCustomers = customersResult.status === 'fulfilled' ? customersResult.value : 0;
        const abandonedCarts = abandonedResult.status === 'fulfilled' ? abandonedResult.value : 0;

        // Aggregate order stats
        let revenue = 0;
        let pendingOrders = 0;
        const recentOrders: any[] = [];

        for (const order of (ordersData.orders as any[])) {
            const amount = parseFloat(order.amounts?.total?.amount ?? order.total ?? 0);
            revenue += isNaN(amount) ? 0 : amount;
            if (order.status?.slug === 'pending' || order.status?.slug === 'under_review') pendingOrders++;
            if (recentOrders.length < 6) {
                recentOrders.push({
                    id: order.reference_id || `#${order.id}`,
                    customer: order.customer?.first_name
                        ? `${order.customer.first_name} ${order.customer.last_name || ''}`.trim()
                        : (order.customer?.name || 'Unknown'),
                    total: parseFloat(order.amounts?.total?.amount ?? order.total ?? 0),
                    currency: order.currency || 'SAR',
                    status: order.status?.name || order.status?.slug || 'unknown',
                    statusSlug: order.status?.slug || '',
                    date: order.created_at
                });
            }
        }

        const avgOrderValue = ordersData.orders.length > 0
            ? Math.round((revenue / ordersData.orders.length) * 100) / 100
            : 0;

        const meta = connection.metadata ? JSON.parse(connection.metadata) : {};

        return NextResponse.json({
            platform: 'SALLA',
            storeName: connection.platformAccountName,
            domain: meta.domain,
            stats: {
                totalOrders: ordersData.total,
                revenue: Math.round(revenue * 100) / 100,
                avgOrderValue,
                pendingOrders,
                totalProducts,
                totalCustomers,
                abandonedCarts
            },
            recentOrders,
            status: 'success'
        });
    } catch (error: any) {
        console.error('Salla Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
