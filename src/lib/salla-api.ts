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

    async getOrdersSummary() {
        const data = await this.fetch('/orders', { per_page: '50', sort: 'created_at', order: 'desc' });
        return {
            orders: (data as any).data || [],
            total: (data as any).pagination?.total || 0
        };
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
