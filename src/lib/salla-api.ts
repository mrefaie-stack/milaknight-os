const SALLA_BASE = 'https://api.salla.dev/admin/v2';
const SALLA_TOKEN_URL = 'https://accounts.salla.sa/oauth2/token';

export class SallaApi {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch(path: string, params: Record<string, string> = {}) {
        const url = new URL(`${SALLA_BASE}${path}`);
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        const res = await globalThis.fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                Accept: 'application/json'
            }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error((err as any)?.error?.message || `Salla API ${res.status}`);
        }
        return res.json();
    }

    async getStoreInfo() {
        const data = await this.fetch('/store/info');
        return (data as any).data || {};
    }

    async getOrdersSummary(since?: string, until?: string) {
        const params: Record<string, string> = { per_page: '50', sort: 'created_at', order: 'desc' };
        if (since) params['date_from'] = since;
        if (until) params['date_to'] = until;
        const data = await this.fetch('/orders', params);
        return {
            orders: (data as any).data || [],
            total: (data as any).pagination?.total || 0
        };
    }

    async getTopProducts(limit = 8) {
        try {
            const data = await this.fetch('/products', { per_page: String(limit) });
            return ((data as any).data || []).map((p: any) => ({
                id: p.id,
                name: typeof p.name === 'object' ? (p.name?.ar || p.name?.en || '') : (p.name || ''),
                price: p.price?.amount || 0,
                currency: p.price?.currency || 'SAR',
                status: p.status || 'active',
                sku: p.sku || ''
            }));
        } catch {
            return [];
        }
    }

    async getProductsCount() {
        const data = await this.fetch('/products', { per_page: '1' });
        return (data as any).pagination?.total || 0;
    }

    async getCustomersCount() {
        const data = await this.fetch('/customers', { per_page: '1' });
        return (data as any).pagination?.total || 0;
    }

    async getAbandonedCartsCount(): Promise<number> {
        try {
            const data = await this.fetch('/abandoned-carts', { per_page: '1' });
            return (data as any).pagination?.total || 0;
        } catch {
            return 0;
        }
    }
}

export async function refreshSallaToken(refreshToken: string) {
    const res = await globalThis.fetch(SALLA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.SALLA_CLIENT_ID!,
            client_secret: process.env.SALLA_CLIENT_SECRET!
        })
    });
    const data = await res.json();
    if (!(data as any).access_token) throw new Error('Salla token refresh failed');
    return data as any;
}
