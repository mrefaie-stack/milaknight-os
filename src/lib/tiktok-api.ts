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
            fields: JSON.stringify(['name', 'currency', 'timezone', 'status', 'balance', 'industry', 'advertiser_id', 'description', 'country'])
        });
    }

    /**
     * Fetch ad account stats split into 4 independent groups.
     * If a group fails (metrics unavailable for this account), the rest still work.
     */
    async getAdAccountStats(advertiserId: string, since: string, until: string) {
        const base = {
            advertiser_id: advertiserId,
            report_type: 'BASIC',
            data_level: 'AUCTION_ADVERTISER',
            dimensions: ['advertiser_id'],
            start_date: since,
            end_date: until,
            page_size: 1
        };

        // Group 1: Core — always available
        let core: any = {};
        try {
            const d = await this.post('/report/integrated/get/', {
                ...base,
                metrics: ['spend', 'impressions', 'clicks', 'reach', 'frequency', 'ctr', 'cpm', 'cpc']
            });
            core = d?.list?.[0]?.metrics || {};
        } catch (e) {
            console.error('TikTok core metrics failed:', (e as Error).message);
        }

        // Group 2: Video — available for video ad accounts
        let video: any = {};
        try {
            const d = await this.post('/report/integrated/get/', {
                ...base,
                metrics: ['video_play_actions', 'video_watched_2s', 'video_watched_6s',
                    'video_views_p25', 'video_views_p50', 'video_views_p75', 'video_views_p100']
            });
            video = d?.list?.[0]?.metrics || {};
        } catch { /* not a video account */ }

        // Group 3: Engagement — available when identity is linked
        let eng: any = {};
        try {
            const d = await this.post('/report/integrated/get/', {
                ...base,
                metrics: ['profile_visits', 'follows', 'likes', 'comments', 'shares']
            });
            eng = d?.list?.[0]?.metrics || {};
        } catch { /* identity not linked */ }

        // Group 4: Conversion — available when pixel is set up
        let conv: any = {};
        try {
            const d = await this.post('/report/integrated/get/', {
                ...base,
                metrics: ['conversion', 'cost_per_conversion', 'purchase_roas']
            });
            conv = d?.list?.[0]?.metrics || {};
        } catch { /* no pixel */ }

        return {
            spend: Number(core.spend) || 0,
            impressions: Number(core.impressions) || 0,
            clicks: Number(core.clicks) || 0,
            reach: Number(core.reach) || 0,
            frequency: Number(core.frequency) || 0,
            ctr: Number(core.ctr) || 0,
            cpm: Number(core.cpm) || 0,
            cpc: Number(core.cpc) || 0,
            videoViews: Number(video.video_play_actions) || 0,
            video2s: Number(video.video_watched_2s) || 0,
            video6s: Number(video.video_watched_6s) || 0,
            videoP25: Number(video.video_views_p25) || 0,
            videoP50: Number(video.video_views_p50) || 0,
            videoP75: Number(video.video_views_p75) || 0,
            videoP100: Number(video.video_views_p100) || 0,
            profileVisits: Number(eng.profile_visits) || 0,
            follows: Number(eng.follows) || 0,
            likes: Number(eng.likes) || 0,
            comments: Number(eng.comments) || 0,
            shares: Number(eng.shares) || 0,
            conversions: Number(conv.conversion) || 0,
            costPerConversion: Number(conv.cost_per_conversion) || 0,
            roas: Number(conv.purchase_roas) || 0
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
        } catch (e) {
            console.error('TikTok campaigns list failed:', (e as Error).message);
            return [];
        }

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
        } catch { /* ignore — show campaigns without stats */ }

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
        } catch (e) {
            console.error('TikTok top ads failed:', (e as Error).message);
            return [];
        }
    }

    /**
     * Get TikTok identities (organic accounts) linked to an advertiser account.
     * Returns display_name, profile_image_url, etc.
     */
    async getTikTokIdentities(advertiserId: string) {
        try {
            const data = await this.get('/tiktok_account/get/', {
                advertiser_id: advertiserId,
                page_size: '10'
            });
            return (data?.list || []).map((a: any) => ({
                id: a.tiktok_account_id,
                displayName: a.display_name || '',
                profileImage: a.profile_image_url || '',
                type: a.type || ''
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
