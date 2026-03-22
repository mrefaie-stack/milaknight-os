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
            // Maps to Business Manager: Views, Viewers, Content interactions, Visits, Follows
            // page_fan_adds_unique is deprecated (v18+) — use page_fan_adds instead
            metric: 'page_impressions,page_impressions_unique,page_post_engagements,page_views_total,page_fan_adds',
            period: 'day'
        };
        if (since && until) {
            params.since = since;
            params.until = until;
        }
        // Try page token first; fall back to user token (this.accessToken) if not provided
        params.access_token = pageToken || this.accessToken;

        return this.fetch(`/${pageId}/insights`, params);
    }

    /**
     * Fallback page insights with only safe (non-deprecated) metrics.
     * Used when the full getPageInsights batch fails.
     */
    async getPageInsightsSafe(pageId: string, pageToken?: string, since?: string, until?: string) {
        const params: Record<string, string> = {
            metric: 'page_impressions,page_impressions_unique,page_views_total',
            period: 'day'
        };
        if (since && until) { params.since = since; params.until = until; }
        params.access_token = pageToken || this.accessToken;
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
    /**
     * Instagram only supports: day, week, days_28, month, lifetime.
     * We use period=day with since/until so each metric is summed across the month.
     * impressions, total_interactions, profile_views are additive (correct).
     * reach is approximate (daily unique counts summed — may slightly overcount).
     */
    /**
     * Instagram Insights — two calls:
     * 1. reach: still uses period=day (time-series, sum daily values)
     * 2. views + interactions + clicks + visits + follows: require metric_type=total_value
     *    Returns combined results. total_value metrics have { total_value: { value: N } }
     *    instead of { values: [...] }
     */
    async getIgInsights(igAccountId: string, pageToken: string, since?: string, until?: string) {
        const results: any[] = [];

        // 1. Reach via time-series
        try {
            const params: Record<string, string> = { metric: 'reach', period: 'day', access_token: pageToken };
            if (since && until) { params.since = since; params.until = until; }
            const r = await this.fetch(`/${igAccountId}/insights`, params);
            if (r.data) results.push(...r.data);
        } catch (e: any) {
            console.error('IG reach (time-series) failed:', e?.message || e);
        }

        // 2. Other metrics via total_value
        try {
            const params: Record<string, string> = {
                metric: 'views,total_interactions,website_clicks,profile_views,follows_and_unfollows',
                metric_type: 'total_value',
                period: 'day',
                access_token: pageToken
            };
            if (since && until) { params.since = since; params.until = until; }
            const r = await this.fetch(`/${igAccountId}/insights`, params);
            if (r.data) results.push(...r.data);
        } catch (e: any) {
            console.error('IG total_value metrics failed:', e?.message || e);
        }

        return { data: results };
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
