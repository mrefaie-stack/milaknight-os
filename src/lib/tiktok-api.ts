export class TikTokAPI {
    private accessToken: string;
    private baseUrl = 'https://business-api.tiktok.com/open_api/v1.3';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async get(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v);
        const res = await fetch(url.toString(), {
            headers: { 'Access-Token': this.accessToken }
        });
        const data = await res.json();
        if (data.code !== 0) throw new Error(`TikTok API Error ${data.code}: ${data.message}`);
        return data.data;
    }

    private async post(endpoint: string, body: any) {
        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Access-Token': this.accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.code !== 0) throw new Error(`TikTok API Error ${data.code}: ${data.message}`);
        return data.data;
    }

    async getAdvertiserInfo(advertiserIds: string[]) {
        return this.get('/advertiser/info/', {
            advertiser_ids: JSON.stringify(advertiserIds),
            fields: JSON.stringify(['name', 'currency', 'timezone', 'status', 'balance', 'industry', 'advertiser_id'])
        });
    }

    async getAdAccountStats(advertiserId: string, since: string, until: string) {
        const data = await this.post('/report/integrated/get/', {
            advertiser_id: advertiserId,
            report_type: 'BASIC',
            data_level: 'AUCTION_ADVERTISER',
            dimensions: ['advertiser_id'],
            metrics: [
                'spend', 'impressions', 'clicks', 'reach', 'frequency',
                'ctr', 'cpm', 'cpc',
                'video_play_actions', 'video_watched_2s', 'video_watched_6s',
                'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100',
                'profile_visits', 'follows', 'likes', 'comments', 'shares',
                'conversion', 'cost_per_conversion', 'purchase_roas'
            ],
            start_date: since,
            end_date: until,
            page_size: 10
        });

        const row = data?.list?.[0]?.metrics || {};
        return {
            spend: Number(row.spend) || 0,
            impressions: Number(row.impressions) || 0,
            clicks: Number(row.clicks) || 0,
            reach: Number(row.reach) || 0,
            frequency: Number(row.frequency) || 0,
            ctr: Number(row.ctr) || 0,
            cpm: Number(row.cpm) || 0,
            cpc: Number(row.cpc) || 0,
            videoViews: Number(row.video_play_actions) || 0,
            video2s: Number(row.video_watched_2s) || 0,
            video6s: Number(row.video_watched_6s) || 0,
            videoP25: Number(row.video_views_p25) || 0,
            videoP50: Number(row.video_views_p50) || 0,
            videoP75: Number(row.video_views_p75) || 0,
            videoP100: Number(row.video_views_p100) || 0,
            profileVisits: Number(row.profile_visits) || 0,
            follows: Number(row.follows) || 0,
            likes: Number(row.likes) || 0,
            comments: Number(row.comments) || 0,
            shares: Number(row.shares) || 0,
            conversions: Number(row.conversion) || 0,
            costPerConversion: Number(row.cost_per_conversion) || 0,
            roas: Number(row.purchase_roas) || 0
        };
    }

    async getCampaigns(advertiserId: string, since: string, until: string) {
        let campaigns: any[] = [];
        try {
            const data = await this.get('/campaign/get/', {
                advertiser_id: advertiserId,
                fields: JSON.stringify(['campaign_id', 'campaign_name', 'objective_type', 'operation_status', 'budget', 'budget_mode']),
                page_size: '20'
            });
            campaigns = data?.list || [];
        } catch { return []; }

        if (campaigns.length === 0) return [];

        let statsMap: Record<string, any> = {};
        try {
            const report = await this.post('/report/integrated/get/', {
                advertiser_id: advertiserId,
                report_type: 'BASIC',
                data_level: 'AUCTION_CAMPAIGN',
                dimensions: ['campaign_id'],
                metrics: ['spend', 'impressions', 'clicks', 'ctr', 'reach', 'cpm'],
                start_date: since,
                end_date: until,
                page_size: 20
            });
            for (const s of (report?.list || [])) {
                statsMap[s.dimensions?.campaign_id] = s.metrics || {};
            }
        } catch { /* ignore */ }

        return campaigns.map((c: any) => {
            const m = statsMap[c.campaign_id] || {};
            return {
                id: c.campaign_id,
                name: c.campaign_name,
                status: c.operation_status,
                objective: c.objective_type,
                budget: c.budget,
                budgetMode: c.budget_mode,
                stats: {
                    spend: Number(m.spend) || 0,
                    impressions: Number(m.impressions) || 0,
                    clicks: Number(m.clicks) || 0,
                    ctr: Number(m.ctr) || 0,
                    reach: Number(m.reach) || 0,
                    cpm: Number(m.cpm) || 0
                }
            };
        });
    }

    async getTopAds(advertiserId: string, since: string, until: string) {
        try {
            const report = await this.post('/report/integrated/get/', {
                advertiser_id: advertiserId,
                report_type: 'BASIC',
                data_level: 'AUCTION_AD',
                dimensions: ['ad_id'],
                metrics: ['spend', 'impressions', 'clicks', 'ctr', 'video_play_actions', 'reach'],
                order_field: 'spend',
                order_type: 'DESC',
                start_date: since,
                end_date: until,
                page_size: 8
            });
            return (report?.list || []).map((item: any) => ({
                id: item.dimensions?.ad_id,
                spend: Number(item.metrics?.spend) || 0,
                impressions: Number(item.metrics?.impressions) || 0,
                clicks: Number(item.metrics?.clicks) || 0,
                ctr: Number(item.metrics?.ctr) || 0,
                videoViews: Number(item.metrics?.video_play_actions) || 0,
                reach: Number(item.metrics?.reach) || 0
            }));
        } catch { return []; }
    }

    static async exchangeCode(code: string): Promise<{ access_token: string; advertiser_ids: string[] }> {
        const res = await fetch('https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app_id: process.env.TIKTOK_APP_KEY!,
                secret: process.env.TIKTOK_APP_SECRET!,
                auth_code: code
            })
        });
        const data = await res.json();
        if (data.code !== 0) throw new Error(`TikTok token exchange failed: ${JSON.stringify(data)}`);
        return {
            access_token: data.data.access_token,
            advertiser_ids: data.data.advertiser_ids || []
        };
    }
}
