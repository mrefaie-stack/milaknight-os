export class MetaAPI {
    private accessToken: string;
    private baseUrl = 'https://graph.facebook.com/v19.0';

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetch(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.append('access_token', this.accessToken);
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
     * Fetch insights for a specific ad account
     */
    async getAdAccountInsights(adAccountId: string, datePreset: string = 'today') {
        return this.fetch(`/${adAccountId}/insights`, {
            fields: 'spend,impressions,clicks,cpc,ctr,reach',
            date_preset: datePreset
        });
    }

    /**
     * Fetch page insights (Organic)
     */
    async getPageInsights(pageId: string) {
        return this.fetch(`/${pageId}/insights`, {
            metric: 'page_impressions_unique,page_post_engagements,page_fans',
            period: 'days_28'
        });
    }

    /**
     * Fetch basic page info
     */
    async getPageInfo(pageId: string) {
        return this.fetch(`/${pageId}`, {
            fields: 'name,fan_count,username,picture'
        });
    }

    /**
     * Fetch all pages associated with the token
     */
    async getPages() {
        return this.fetch('/me/accounts', {
            fields: 'name,id,access_token,category,picture',
            limit: '100'
        });
    }
}
