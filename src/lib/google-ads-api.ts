const GADS_BASE = 'https://googleads.googleapis.com/v18';

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
                metrics.average_cpc
            FROM campaign
            WHERE segments.date BETWEEN '${since}' AND '${until}'
            ORDER BY metrics.impressions DESC
            LIMIT 20
        `.trim();

        const res = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
            method: 'POST',
            headers: this.headers(),
            body: JSON.stringify({ query })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Google Ads search (${customerId}): ${res.status} — ${JSON.stringify(err)}`);
        }

        const data = await res.json();
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
                avgCpc: (Number(r.metrics?.averageCpc) || 0) / 1_000_000
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
