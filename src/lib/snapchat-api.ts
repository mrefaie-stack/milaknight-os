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

    async getCampaigns(adAccountId: string) {
        const data = await this.fetch(`/adaccounts/${adAccountId}/campaigns`);
        return (data.campaigns || []).map((c: any) => c.campaign).filter(Boolean);
    }

    /**
     * Fetch lifetime campaign stats (no date range — Snapchat timestamp API is broken).
     * Returns aggregated totals across the campaign's full lifetime.
     */
    async getCampaignStats(campaignId: string) {
        const data = await this.fetch(`/campaigns/${campaignId}/stats`, {
            granularity: 'TOTAL',
            fields: 'impressions,swipes,spend,video_views,reach,frequency,uniques'
        });
        const stat = data.total_stats?.[0]?.total_stat?.stats || {};
        return {
            impressions: stat.impressions || 0,
            swipes: stat.swipes || 0,
            spend: (stat.spend || 0) / 1_000_000,  // micro-currency → dollars
            videoViews: stat.video_views || 0,
            reach: stat.reach || 0,
            frequency: stat.frequency || 0,
            uniques: stat.uniques || 0
        };
    }

    /**
     * Aggregate stats across all campaigns in an ad account (lifetime totals).
     */
    async getAdAccountStats(adAccountId: string) {
        const campaigns = await this.getCampaigns(adAccountId);
        const totals = { impressions: 0, swipes: 0, spend: 0, videoViews: 0, reach: 0, frequency: 0, uniques: 0 };
        let freqCount = 0;

        await Promise.allSettled(campaigns.map(async (campaign: any) => {
            try {
                const s = await this.getCampaignStats(campaign.id);
                totals.impressions += s.impressions;
                totals.swipes += s.swipes;
                totals.spend += s.spend;
                totals.videoViews += s.videoViews;
                totals.reach += s.reach;
                totals.uniques += s.uniques;
                if (s.frequency > 0) { totals.frequency += s.frequency; freqCount++; }
            } catch { /* skip failed campaigns */ }
        }));

        if (freqCount > 0) totals.frequency = totals.frequency / freqCount;
        return { ...totals, campaignCount: campaigns.length };
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
