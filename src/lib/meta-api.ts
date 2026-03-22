export class MetaAPI {
    private accessToken: string;
    private baseUrl = 'https://graph.facebook.com/v19.0';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        
        if (!params.access_token) {
            url.searchParams.append('access_token', this.accessToken);
        }
        
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Meta API Error: ${JSON.stringify(error)}`);
        }
        return response.json();
    }

    /**
     * Fetch all ad accounts associated with the token
     */
    async getAdAccounts() {
        return this.fetch('/me/adaccounts', {
            fields: 'name,account_id,id,currency,account_status',
            limit: '100'
        });
    }

    /**
     * Fetch insights for a specific ad account.
     * Pass since/until (YYYY-MM-DD) for a specific range, or leave empty for last_30d.
     */
    async getAdAccountInsights(adAccountId: string, datePreset: string = 'last_30d', since?: string, until?: string) {
        const params: Record<string, string> = {
            fields: 'spend,impressions,clicks,cpc,ctr,reach'
        };
        if (since && until) {
            params.time_range = JSON.stringify({ since, until });
        } else {
            params.date_preset = datePreset;
        }
        return this.fetch(`/${adAccountId}/insights`, params);
    }

    /**
     * Fetch active ads for a specific ad account
     */
    async getActiveAds(adAccountId: string) {
        return this.fetch(`/${adAccountId}/ads`, {
            fields: 'name,status,insights.date_preset(last_30d){spend,impressions,clicks}',
            filtering: '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]',
            limit: '5'
        });
    }

    /**
     * Fetch page insights (Organic).
     * Pass since/until (YYYY-MM-DD) for a specific month, else falls back to days_28.
     */
    async getPageInsights(pageId: string, pageToken?: string, since?: string, until?: string) {
        const params: Record<string, string> = {
            metric: 'page_impressions,page_impressions_unique,page_post_engagements,page_views_total,page_fan_adds_unique',
            period: 'day'
        };
        if (since && until) {
            params.since = since;
            params.until = until;
        }
        if (pageToken) params.access_token = pageToken;

        return this.fetch(`/${pageId}/insights`, params);
    }

    /**
     * Fetch basic page info
     */
    async getPageInfo(pageId: string) {
        return this.fetch(`/${pageId}`, {
            fields: 'name,fan_count,username,picture,access_token,instagram_business_account{id,username,followers_count,media_count,profile_picture_url}'
        });
    }

    /**
     * Fetch all Instagram account-level insights for a date range.
     * Returns reach, impressions, total_interactions, profile_views — all from the official Insights API.
     */
    async getIgInsights(igAccountId: string, pageToken: string, since?: string, until?: string) {
        const params: Record<string, string> = {
            metric: 'reach,impressions,total_interactions,profile_views',
            period: 'day',
            access_token: pageToken
        };
        if (since && until) {
            params.since = since;
            params.until = until;
        }
        return this.fetch(`/${igAccountId}/insights`, params);
    }

    /**
     * Fetch all pages associated with the token (with pagination loop)
     */
    async getPages() {
        let pages: any[] = [];
        let after = '';
        
        try {
            do {
                const params: any = { fields: 'name,id,access_token,category,picture', limit: '100' };
                if (after) params.after = after;
                
                const res: any = await this.fetch('/me/accounts', params);
                if (res.data) pages = pages.concat(res.data);
                
                after = res.paging?.cursors?.after || '';
                if (!res.paging?.next) break;
            } while (after);
        } catch (e) {
            console.error('Error fetching pages globally', e);
        }
        
        return { data: pages };
    }
}
