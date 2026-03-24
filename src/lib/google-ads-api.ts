const GADS_BASE = 'https://googleads.googleapis.com/v20';

export interface GoogleAdsCampaign {
    id: string;
    name: string;
    status: string;
    channelType: string;
    impressions: number;
    clicks: number;
    costMicros: number;
    cost: number;
    conversions: number;
    ctr: number;
    avgCpc: number;
    costPerConversion: number;
}

export class GoogleAdsAPI {
    constructor(
        private accessToken: string,
        private developerToken: string
    ) {}

    private headers(loginCustomerId?: string) {
        const h: Record<string, string> = {
            Authorization: `Bearer ${this.accessToken}`,
            'developer-token': this.developerToken,
            'Content-Type': 'application/json'
        };
        if (loginCustomerId) h['login-customer-id'] = loginCustomerId;
        return h;
    }

    async getCustomerInfo(customerId: string): Promise<{ id: string; name: string; currencyCode: string } | null> {
        const query = `SELECT customer.id, customer.descriptive_name, customer.currency_code FROM customer LIMIT 1`;
        try {
            const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
                method: 'POST',
                headers: this.headers(customerId),
                body: JSON.stringify({ query })
            });
            if (!res.ok) return null;
            const data = await res.json();
            const row = data.results?.[0];
            if (!row) return null;
            return {
                id: String(row.customer?.id || customerId),
                name: row.customer?.descriptiveName || `Account ${customerId}`,
                currencyCode: row.customer?.currencyCode || 'USD'
            };
        } catch {
            return null;
        }
    }

    async listAccessibleCustomers(): Promise<string[]> {
        const res = await fetch(`${GADS_BASE}/customers:listAccessibleCustomers`, {
            headers: this.headers()
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Google Ads listAccessibleCustomers: ${res.status} — ${JSON.stringify(err)}`);
        }
        const data = await res.json();
        return (data.resourceNames || []).map((r: string) => r.replace('customers/', ''));
    }

    async getDeviceBreakdown(customerId: string, since: string, until: string): Promise<Record<string, { impressions: number; clicks: number; cost: number }>> {
        const query = `
            SELECT segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros
            FROM campaign
            WHERE segments.date BETWEEN '${since}' AND '${until}'
            ORDER BY metrics.impressions DESC
        `.trim();
        try {
            const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
                method: 'POST',
                headers: this.headers(customerId),
                body: JSON.stringify({ query })
            });
            if (!res.ok) return {};
            const data = await res.json();
            const map: Record<string, { impressions: number; clicks: number; cost: number }> = {};
            for (const r of (data.results || [])) {
                const dev = r.segments?.device || 'UNKNOWN';
                if (!map[dev]) map[dev] = { impressions: 0, clicks: 0, cost: 0 };
                map[dev].impressions += Number(r.metrics?.impressions) || 0;
                map[dev].clicks += Number(r.metrics?.clicks) || 0;
                map[dev].cost += (Number(r.metrics?.costMicros) || 0) / 1_000_000;
            }
            return map;
        } catch {
            return {};
        }
    }

    async getTopKeywords(customerId: string, since: string, until: string): Promise<any[]> {
        const query = `
            SELECT
                ad_group_criterion.keyword.text,
                ad_group_criterion.keyword.match_type,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.average_cpc
            FROM keyword_view
            WHERE segments.date BETWEEN '${since}' AND '${until}'
              AND ad_group_criterion.status != 'REMOVED'
            ORDER BY metrics.impressions DESC
            LIMIT 10
        `.trim();
        try {
            const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
                method: 'POST',
                headers: this.headers(customerId),
                body: JSON.stringify({ query })
            });
            if (!res.ok) return [];
            const data = await res.json();
            return (data.results || []).map((r: any) => ({
                keyword: r.adGroupCriterion?.keyword?.text || '',
                matchType: r.adGroupCriterion?.keyword?.matchType || '',
                impressions: Number(r.metrics?.impressions) || 0,
                clicks: Number(r.metrics?.clicks) || 0,
                cost: (Number(r.metrics?.costMicros) || 0) / 1_000_000,
                conversions: Number(r.metrics?.conversions) || 0,
                avgCpc: (Number(r.metrics?.averageCpc) || 0) / 1_000_000
            }));
        } catch {
            return [];
        }
    }

    async getCampaigns(
        customerId: string,
        since: string,
        until: string
    ): Promise<GoogleAdsCampaign[]> {
        // GAQL query for campaign stats in the given date range
        const query = `
            SELECT
                campaign.id,
                campaign.name,
                campaign.status,
                campaign.advertising_channel_type,
                metrics.impressions,
                metrics.clicks,
                metrics.cost_micros,
                metrics.conversions,
                metrics.ctr,
                metrics.average_cpc,
                metrics.cost_per_conversion
            FROM campaign
            WHERE segments.date BETWEEN '${since}' AND '${until}'
            ORDER BY metrics.impressions DESC
            LIMIT 20
        `.trim();

        const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
            method: 'POST',
            headers: this.headers(customerId),
            body: JSON.stringify({ query })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Google Ads search (${customerId}): ${res.status} — ${JSON.stringify(err)}`);
        }

        const data = await res.json();
        console.log('Google Ads raw results count:', data.results?.length ?? 0);
        if (data.results?.length > 0) console.log('Google Ads first row sample:', JSON.stringify(data.results[0]));
        return (data.results || []).map((r: any) => {
            const costMicros = Number(r.metrics?.costMicros) || 0;
            return {
                id: r.campaign?.id || '',
                name: r.campaign?.name || '',
                status: r.campaign?.status || '',
                channelType: r.campaign?.advertisingChannelType || '',
                impressions: Number(r.metrics?.impressions) || 0,
                clicks: Number(r.metrics?.clicks) || 0,
                costMicros,
                cost: costMicros / 1_000_000,
                conversions: Number(r.metrics?.conversions) || 0,
                ctr: Number(r.metrics?.ctr) || 0,
                avgCpc: (Number(r.metrics?.averageCpc) || 0) / 1_000_000,
                costPerConversion: (Number(r.metrics?.costPerConversion) || 0) / 1_000_000
            };
        });
    }

    async getAccountSummary(
        customerId: string,
        since: string,
        until: string
    ): Promise<{
        totalImpressions: number;
        totalClicks: number;
        totalCost: number;
        totalConversions: number;
        campaigns: GoogleAdsCampaign[];
        activeCampaigns: GoogleAdsCampaign[];
    }> {
        const campaigns = await this.getCampaigns(customerId, since, until);

        const totals = campaigns.reduce(
            (acc, c) => ({
                totalImpressions: acc.totalImpressions + c.impressions,
                totalClicks: acc.totalClicks + c.clicks,
                totalCost: acc.totalCost + c.cost,
                totalConversions: acc.totalConversions + c.conversions
            }),
            { totalImpressions: 0, totalClicks: 0, totalCost: 0, totalConversions: 0 }
        );

        return {
            ...totals,
            campaigns,
            activeCampaigns: campaigns.filter(c => c.status === 'ENABLED' || c.status === 'PAUSED')
        };
    }
}
