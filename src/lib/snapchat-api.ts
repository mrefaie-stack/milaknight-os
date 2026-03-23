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

    async getAdSquads(adAccountId: string) {
        const data = await this.fetch(`/adaccounts/${adAccountId}/adsquads`);
        return (data.adsquads || []).map((a: any) => a.adsquad).filter(Boolean);
    }

    /**
     * Lifetime campaign stats — no date range (Snapchat timestamp queries are broken for 2026 dates).
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
            spend: (stat.spend || 0) / 1_000_000,
            videoViews: stat.video_views || 0,
            reach: stat.reach || 0,
            frequency: stat.frequency || 0,
            uniques: stat.uniques || 0
        };
    }

    /**
     * Full account data: aggregated stats + enriched campaign list + targeting overview.
     */
    async getFullAccountData(adAccountId: string) {
        const [campaigns, adSquads] = await Promise.all([
            this.getCampaigns(adAccountId),
            this.getAdSquads(adAccountId).catch(() => [])
        ]);

        // Fetch stats for all campaigns in parallel
        const campaignResults = await Promise.allSettled(
            campaigns.map(async (c: any) => {
                const stats = await this.getCampaignStats(c.id).catch(() => ({
                    impressions: 0, swipes: 0, spend: 0, videoViews: 0, reach: 0, frequency: 0, uniques: 0
                }));
                return { ...c, stats };
            })
        );

        const enrichedCampaigns = campaignResults
            .filter(r => r.status === 'fulfilled')
            .map((r: any) => r.value);

        // Aggregate totals
        const totals = { impressions: 0, swipes: 0, spend: 0, videoViews: 0, reach: 0, uniques: 0 };
        let freqSum = 0, freqCount = 0;

        for (const c of enrichedCampaigns) {
            totals.impressions += c.stats.impressions;
            totals.swipes += c.stats.swipes;
            totals.spend += c.stats.spend;
            totals.videoViews += c.stats.videoViews;
            totals.reach += c.stats.reach;
            totals.uniques += c.stats.uniques;
            if (c.stats.frequency > 0) { freqSum += c.stats.frequency; freqCount++; }
        }
        const frequency = freqCount > 0 ? freqSum / freqCount : 0;

        // Objective breakdown
        const objectiveBreakdown: Record<string, number> = {};
        for (const c of enrichedCampaigns) {
            const obj = c.objective || 'OTHER';
            objectiveBreakdown[obj] = (objectiveBreakdown[obj] || 0) + 1;
        }

        // Active campaigns sorted by spend
        const activeCampaigns = enrichedCampaigns
            .filter((c: any) => c.status === 'ACTIVE')
            .sort((a: any, b: any) => b.stats.spend - a.stats.spend)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                objective: c.objective,
                status: c.status,
                startTime: c.start_time,
                endTime: c.end_time,
                stats: c.stats
            }));

        // Top campaigns by impressions (active + paused)
        const topCampaigns = enrichedCampaigns
            .sort((a: any, b: any) => b.stats.impressions - a.stats.impressions)
            .slice(0, 5)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                objective: c.objective,
                status: c.status,
                stats: c.stats
            }));

        // Targeting overview from active ad squads
        const activeSquads = adSquads.filter((s: any) => s.status === 'ACTIVE');
        let targetingOverview: any = null;
        if (activeSquads.length > 0) {
            const sq = activeSquads[0];
            const demo = sq.targeting?.demographics?.[0] || {};
            const geos = sq.targeting?.geos || [];
            targetingOverview = {
                ageMin: demo.min_age,
                ageMax: demo.max_age,
                countries: geos.filter((g: any) => g.operation === 'INCLUDE').map((g: any) => g.country_code.toUpperCase()),
                dailyBudget: (sq.daily_budget_micro || 0) / 1_000_000,
                optimizationGoal: sq.optimization_goal,
                bidStrategy: sq.bid_strategy,
                endTime: sq.end_time
            };
        }

        return {
            totals: { ...totals, frequency },
            campaignCount: enrichedCampaigns.length,
            activeCampaignCount: activeCampaigns.length,
            objectiveBreakdown,
            activeCampaigns,
            topCampaigns,
            targeting: targetingOverview
        };
    }

    /** @deprecated use getFullAccountData */
    async getAdAccountStats(adAccountId: string) {
        const data = await this.getFullAccountData(adAccountId);
        return { ...data.totals, campaignCount: data.campaignCount };
    }

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
