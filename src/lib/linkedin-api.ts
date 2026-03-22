export class LinkedInAPI {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async get(endpoint: string, params: Record<string, string> = {}) {
        const url = new URL(`https://api.linkedin.com${endpoint}`);
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
        const res = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(`LinkedIn API Error ${res.status}: ${JSON.stringify(err)}`);
        }
        return res.json();
    }

    async getProfile() {
        const res = await fetch('https://api.linkedin.com/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${this.accessToken}` }
        });
        if (!res.ok) throw new Error(`LinkedIn profile error: ${res.status}`);
        return res.json();
    }

    async getOrganizations() {
        return this.get('/v2/organizationAcls', {
            q: 'roleAssignee',
            role: 'ADMINISTRATOR',
            projection: '(elements*(organization~(id,localizedName,logoV2(*))))'
        });
    }

    async getOrganizationFollowers(orgId: string) {
        return this.get('/v2/organizationalEntityFollowerStatistics', {
            q: 'organizationalEntity',
            organizationalEntity: `urn:li:organization:${orgId}`
        });
    }

    async getOrganizationPageStats(orgId: string) {
        return this.get('/v2/organizationPageStatistics', {
            q: 'organization',
            organization: `urn:li:organization:${orgId}`
        });
    }

    async getOrganizationShareStats(orgId: string, since: number, until: number) {
        return this.get('/v2/organizationalEntityShareStatistics', {
            q: 'organizationalEntity',
            organizationalEntity: `urn:li:organization:${orgId}`,
            'timeIntervals.timeGranularityType': 'MONTH',
            'timeIntervals.timeRange.start': since.toString(),
            'timeIntervals.timeRange.end': until.toString()
        });
    }

    static async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
        const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: process.env.LINKEDIN_CLIENT_ID!,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET!
            })
        });
        const data = await res.json();
        if (!data.access_token) throw new Error(`LinkedIn token refresh failed: ${JSON.stringify(data)}`);
        return data;
    }
}
