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
        if (data.code !== 0) throw new Error(`TikTok API Error: ${JSON.stringify(data)}`);
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
        if (data.code !== 0) throw new Error(`TikTok API Error: ${JSON.stringify(data)}`);
        return data.data;
    }

    /**
     * Get advertiser info for a list of advertiser IDs
     */
    async getAdvertiserInfo(advertiserIds: string[]) {
        return this.get('/advertiser/info/', {
            advertiser_ids: JSON.stringify(advertiserIds)
        });
    }

    /**
     * Get aggregate stats for an ad account for a date range.
     * since/until: YYYY-MM-DD
     */
    async getAdAccountStats(advertiserId: string, since: string, until: string) {
        const data = await this.post('/report/integrated/get/', {
            advertiser_id: advertiserId,
            report_type: 'BASIC',
            data_level: 'AUCTION_ADVERTISER',
            dimensions: ['advertiser_id'],
            metrics: ['spend', 'impressions', 'clicks', 'reach', 'video_play_actions'],
            start_date: since,
            end_date: until,
            page_size: 10
        });

        const row = data?.list?.[0]?.metrics || {};
        return {
            impressions: Number(row.impressions) || 0,
            clicks: Number(row.clicks) || 0,
            spend: Number(row.spend) || 0,
            reach: Number(row.reach) || 0,
            videoViews: Number(row.video_play_actions) || 0
        };
    }

    /**
     * Exchange auth code for access token.
     */
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
