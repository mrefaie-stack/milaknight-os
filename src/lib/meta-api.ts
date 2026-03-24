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
            fields: 'spend,impressions,clicks,cpc,ctr,reach,frequency,cpp,actions'
        };
        if (since && until) {
            params.time_range = JSON.stringify({ since, until });
        } else {
            params.date_preset = datePreset;
        }
        return this.fetch(`/${adAccountId}/insights`, params);
    }

    /**
     * Fetch campaign-level insights for the ad account
     */
    async getCampaignInsights(adAccountId: string, since?: string, until?: string) {
        const dateParam = since && until
            ? `time_range({"since":"${since}","until":"${until}"})`
            : 'date_preset(last_30d)';
        try {
            const data = await this.fetch(`/${adAccountId}/campaigns`, {
                fields: `id,name,status,objective,insights.${dateParam}{spend,impressions,clicks,ctr,reach,frequency,cpp}`,
                limit: '10'
            });
            return ((data as any).data || []).map((c: any) => {
                const ins = c.insights?.data?.[0] || {};
                return {
                    id: c.id,
                    name: c.name,
                    status: c.status,
                    objective: c.objective || '',
                    spend: ins.spend || '0',
                    impressions: Number(ins.impressions) || 0,
                    clicks: Number(ins.clicks) || 0,
                    ctr: parseFloat(ins.ctr || '0').toFixed(2),
                    reach: Number(ins.reach) || 0,
                    frequency: parseFloat(ins.frequency || '0').toFixed(2),
                    cpp: ins.cpp || '0'
                };
            }).filter((c: any) => c.impressions > 0 || parseFloat(c.spend) > 0);
        } catch {
            return [];
        }
    }

    /**
     * Fetch active ads for a specific ad account
     */
    async getActiveAds(adAccountId: string, since?: string, until?: string) {
        const insightParam = since && until
            ? `insights.time_range({"since":"${since}","until":"${until}"})`
            : 'insights.date_preset(last_30d)';
        return this.fetch(`/${adAccountId}/ads`, {
            fields: `name,status,${insightParam}{spend,impressions,clicks}`,
            filtering: '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]',
            limit: '8'
        });
    }

    /**
     * Fetch page insights (Organic).
     * page_impressions and page_fan_adds are deprecated (removed in Meta API 2024+).
     * Only fetching metrics confirmed to work:
     *   page_impressions_unique → Viewers
     *   page_post_engagements   → Content interactions
     *   page_views_total        → Visits
     *   page_fan_adds_by_paid_non_paid_unique → New follows
     *   page_video_views        → Video views
     */
    async getPageInsights(pageId: string, pageToken?: string, since?: string, until?: string) {
        const params: Record<string, string> = {
            metric: 'page_impressions_unique,page_post_engagements,page_views_total,page_fan_adds_by_paid_non_paid_unique,page_video_views',
            period: 'day'
        };
        if (since && until) {
            params.since = since;
            params.until = until;
        }
        params.access_token = pageToken || this.accessToken;
        return this.fetch(`/${pageId}/insights`, params);
    }

    /**
     * Fallback page insights — minimal safe metrics only.
     */
    async getPageInsightsSafe(pageId: string, pageToken?: string, since?: string, until?: string) {
        const params: Record<string, string> = {
            metric: 'page_impressions_unique,page_post_engagements,page_views_total',
            period: 'day'
        };
        if (since && until) { params.since = since; params.until = until; }
        params.access_token = pageToken || this.accessToken;
        return this.fetch(`/${pageId}/insights`, params);
    }

    async getAdAccountInfo(adAccountId: string): Promise<{ currency: string } | null> {
        try {
            return await this.fetch(`/${adAccountId}`, { fields: 'currency' });
        } catch {
            return null;
        }
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
     * 1. reach, views, total_interactions, website_clicks, profile_views via metric_type=total_value
     * 2. follows_and_unfollows separately with breakdown=follow_type (required to get the data)
     *    NON_FOLLOWER dimension = new follows (non-followers who started following)
     *    FOLLOWER dimension = unfollows (followers who stopped following)
     */
    async getIgInsights(igAccountId: string, pageToken: string, since?: string, until?: string) {
        const results: any[] = [];

        // Main metrics via total_value — gives true monthly aggregates
        try {
            const params: Record<string, string> = {
                metric: 'reach,views,total_interactions,website_clicks,profile_views',
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

        // follows_and_unfollows requires breakdown=follow_type to return actual data
        try {
            const params: Record<string, string> = {
                metric: 'follows_and_unfollows',
                metric_type: 'total_value',
                period: 'day',
                breakdown: 'follow_type',
                access_token: pageToken
            };
            if (since && until) { params.since = since; params.until = until; }
            const r = await this.fetch(`/${igAccountId}/insights`, params);
            if (r.data) results.push(...r.data);
        } catch (e: any) {
            console.error('IG follows_and_unfollows failed:', e?.message || e);
        }

        return { data: results };
    }

    /**
     * Fetch link_click actions from the ad account broken down by publisher_platform.
     * Returns { facebook: N, instagram: N } — the same "Link Clicks" metric shown
     * in Meta Business Manager for each platform (includes stories + ads link clicks).
     */
    async getAdLinkClicksByPlatform(adAccountId: string, since: string, until: string): Promise<{ facebook: number; instagram: number }> {
        const result = { facebook: 0, instagram: 0 };
        const params: Record<string, string> = {
            fields: 'actions',
            breakdowns: 'publisher_platform',
            time_range: JSON.stringify({ since, until })
        };
        const r = await this.fetch(`/${adAccountId}/insights`, params);
        for (const row of r.data || []) {
            const platform = row.publisher_platform as 'facebook' | 'instagram';
            if (platform === 'facebook' || platform === 'instagram') {
                const lc = (row.actions || []).find((a: any) => a.action_type === 'link_click');
                if (lc) result[platform] += Number(lc.value) || 0;
            }
        }
        return result;
    }

    /** @deprecated Use getAdLinkClicksByPlatform instead */
    async getIgAdLinkClicks(adAccountId: string, since: string, until: string): Promise<number> {
        return (await this.getAdLinkClicksByPlatform(adAccountId, since, until)).instagram;
    }

    /**
     * Exchange a user access token for a long-lived token (or re-extend an existing one).
     * Facebook long-lived tokens last ~60 days. Re-extending before expiry resets the clock.
     * Returns null if extension fails (token truly expired — user must reconnect).
     */
    static async extendToken(currentToken: string): Promise<{ access_token: string; expires_in: number } | null> {
        try {
            const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
            url.searchParams.set('grant_type', 'fb_exchange_token');
            url.searchParams.set('client_id', process.env.FACEBOOK_CLIENT_ID!);
            url.searchParams.set('client_secret', process.env.FACEBOOK_CLIENT_SECRET!);
            url.searchParams.set('fb_exchange_token', currentToken);
            const res = await fetch(url.toString());
            const data = await res.json();
            if (!data.access_token) return null;
            // Facebook returns expires_in in seconds (~5184000 = 60 days)
            return { access_token: data.access_token, expires_in: data.expires_in || 5184000 };
        } catch {
            return null;
        }
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
