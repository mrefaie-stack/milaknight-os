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

    async getAds(adAccountId: string) {
        const data = await this.fetch(`/adaccounts/${adAccountId}/ads`);
        return (data.ads || []).map((a: any) => a.ad).filter(Boolean);
    }

    async getAdStats(adId: string, startTime?: string, endTime?: string) {
        // With date range: use DAY granularity and sum results
        if (startTime && endTime) {
            try {
                const data = await this.fetch(`/ads/${adId}/stats`, {
                    granularity: 'DAY',
                    fields: 'impressions,swipes,spend,video_views',
                    start_time: startTime,
                    end_time: endTime
                });
                const days = data.timeseries_stats?.[0]?.timeseries_stat?.timeseries || [];
                const agg = { impressions: 0, swipes: 0, spend: 0, videoViews: 0 };
                for (const d of days) {
                    agg.impressions += d.stats?.impressions || 0;
                    agg.swipes += d.stats?.swipes || 0;
                    agg.spend += (d.stats?.spend || 0) / 1_000_000;
                    agg.videoViews += d.stats?.video_views || 0;
                }
                return agg;
            } catch {
                // Fall through to TOTAL if date params rejected
            }
        }
        // All-time (default)
        const data = await this.fetch(`/ads/${adId}/stats`, {
            granularity: 'TOTAL',
            fields: 'impressions,swipes,spend,video_views'
        });
        const stat = data.total_stats?.[0]?.total_stat?.stats || {};
        return {
            impressions: stat.impressions || 0,
            swipes: stat.swipes || 0,
            spend: (stat.spend || 0) / 1_000_000,
            videoViews: stat.video_views || 0
        };
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
     * Full account data.
     * Totals are derived from ad-level stats (reliable) + reach from campaign stats.
     */
    async getFullAccountData(adAccountId: string, startTime?: string, endTime?: string) {
        const [campaigns, adSquads, ads] = await Promise.all([
            this.getCampaigns(adAccountId),
            this.getAdSquads(adAccountId).catch(() => []),
            this.getAds(adAccountId).catch(() => [])
        ]);

        // --- Ad-level stats (primary source for totals — confirmed reliable) ---
        const adResults = await Promise.allSettled(
            ads.map(async (a: any) => {
                const stats = await this.getAdStats(a.id, startTime, endTime).catch(() => ({
                    impressions: 0, swipes: 0, spend: 0, videoViews: 0
                }));
                const isValid = (a.delivery_status || []).includes('VALID');
                return { ...a, stats, isValid };
            })
        );
        const enrichedAds = adResults
            .filter(r => r.status === 'fulfilled')
            .map((r: any) => r.value);

        // Sum ad-level stats for totals
        const totals = { impressions: 0, swipes: 0, spend: 0, videoViews: 0 };
        for (const a of enrichedAds) {
            totals.impressions += a.stats.impressions;
            totals.swipes += a.stats.swipes;
            totals.spend += a.stats.spend;
            totals.videoViews += a.stats.videoViews;
        }

        // --- Campaign-level stats (best-effort — for reach + objective breakdown) ---
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

        // Objective breakdown
        const objectiveBreakdown: Record<string, number> = {};
        for (const c of enrichedCampaigns) {
            const obj = c.objective || 'OTHER';
            objectiveBreakdown[obj] = (objectiveBreakdown[obj] || 0) + 1;
        }

        // Active campaigns sorted by ad spend
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

        // Top campaigns by impressions
        const topCampaigns = [...enrichedCampaigns]
            .sort((a: any, b: any) => b.stats.impressions - a.stats.impressions)
            .slice(0, 5)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                objective: c.objective,
                status: c.status,
                stats: c.stats
            }));

        // Top ads: valid delivery first, then by impressions
        const topAds = [...enrichedAds]
            .sort((a: any, b: any) => {
                if (a.isValid !== b.isValid) return a.isValid ? -1 : 1;
                return b.stats.impressions - a.stats.impressions;
            })
            .slice(0, 8)
            .map((a: any) => ({
                id: a.id,
                name: a.name,
                status: a.status,
                isValid: a.isValid,
                reviewStatus: a.review_status,
                stats: a.stats
            }));

        const validAdCount = enrichedAds.filter((a: any) => a.isValid).length;

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
            totals,
            campaignCount: enrichedCampaigns.length,
            activeCampaignCount: activeCampaigns.length,
            adCount: ads.length,
            validAdCount,
            objectiveBreakdown,
            activeCampaigns,
            topCampaigns,
            topAds,
            targeting: targetingOverview
        };
    }

    /** @deprecated use getFullAccountData */
    async getAdAccountStats(adAccountId: string) {
        const data = await this.getFullAccountData(adAccountId);
        return { ...data.totals, reach: 0, campaignCount: data.campaignCount };
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
