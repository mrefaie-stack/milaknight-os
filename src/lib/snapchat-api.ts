export class SnapchatAPI {
    private accessToken: string;
    private baseUrl = 'https://adsapi.snapchat.com/v1';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }
        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Snapchat API Error: ${JSON.stringify(error)}`);
        }
        return response.json();
    }

    async getOrganizations() {
        return this.fetch('/me/organizations');
    }

    async getAdAccounts(orgId: string) {
        return this.fetch(`/organizations/${orgId}/adaccounts`);
    }

    /**
     * Fetch aggregate ad account stats for a date range.
     * since/until: YYYY-MM-DD
     * Returns: { impressions, swipes, spend_cents, video_views, reach }
     */
    async getAdAccountStats(adAccountId: string, since: string, until: string) {
        const startTime = new Date(since + 'T00:00:00Z').getTime();
        const endTime = new Date(until + 'T23:59:59Z').getTime();

        const data = await this.fetch(`/adaccounts/${adAccountId}/stats`, {
            granularity: 'TOTAL',
            fields: 'impressions,swipes,spend,video_views,reach',
            start_time: startTime.toString(),
            end_time: endTime.toString()
        });

        const stat = data.timeseries_stats?.[0]?.timeseries_stat?.stats || {};
        return {
            impressions: stat.impressions || 0,
            swipes: stat.swipes || 0,              // Link/swipe-up clicks
            spend: (stat.spend || 0) / 1_000_000,  // Snapchat spend is in micro-currency
            videoViews: stat.video_views || 0,
            reach: stat.reach || 0
        };
    }

    /**
     * Refresh an expired access token using the stored refresh token.
     */
    static async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
        const res = await fetch('https://accounts.snapchat.com/accounts/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.SNAPCHAT_CLIENT_ID!,
                client_secret: process.env.SNAPCHAT_CLIENT_SECRET!,
                refresh_token: refreshToken
            })
        });
        const data = await res.json();
        if (!data.access_token) {
            throw new Error(`Snapchat token refresh failed: ${JSON.stringify(data)}`);
        }
        return data;
    }
}
