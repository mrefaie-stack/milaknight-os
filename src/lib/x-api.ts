import crypto from 'crypto';

export class XAPI {
    private consumerKey: string;
    private consumerSecret: string;
    private accessToken: string;
    private tokenSecret: string;

    constructor(opts: { consumerKey: string; consumerSecret: string; accessToken: string; tokenSecret: string }) {
        this.consumerKey = opts.consumerKey;
        this.consumerSecret = opts.consumerSecret;
        this.accessToken = opts.accessToken;
        this.tokenSecret = opts.tokenSecret;
    }

    private buildAuthHeader(method: string, baseUrl: string, queryParams: Record<string, string> = {}) {
        const oauthParams: Record<string, string> = {
            oauth_consumer_key: this.consumerKey,
            oauth_nonce: crypto.randomBytes(16).toString('hex'),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: String(Math.floor(Date.now() / 1000)),
            oauth_token: this.accessToken,
            oauth_version: '1.0'
        };

        const allParams = { ...oauthParams, ...queryParams };
        const paramStr = Object.keys(allParams).sort()
            .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(allParams[k]))
            .join('&');

        const base = method.toUpperCase() + '&' + encodeURIComponent(baseUrl) + '&' + encodeURIComponent(paramStr);
        const sigKey = encodeURIComponent(this.consumerSecret) + '&' + encodeURIComponent(this.tokenSecret);
        const sig = crypto.createHmac('sha1', sigKey).update(base).digest('base64');
        oauthParams['oauth_signature'] = sig;

        return 'OAuth ' + Object.entries(oauthParams)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
            .join(', ');
    }

    async getAccountInfo() {
        const baseUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';
        const params = { include_entities: 'false', skip_status: 'true', include_email: 'false' };
        const auth = this.buildAuthHeader('GET', baseUrl, params);
        const url = baseUrl + '?' + new URLSearchParams(params).toString();
        const res = await fetch(url, { headers: { Authorization: auth } });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`X API Error: ${JSON.stringify(err)}`);
        }
        return res.json();
    }
}
