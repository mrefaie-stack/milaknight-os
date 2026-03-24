const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const YT_ANALYTICS = 'https://youtubeanalytics.googleapis.com/v2';

export class YouTubeAPI {
    constructor(private accessToken: string) {}

    private authHeader() {
        return { Authorization: `Bearer ${this.accessToken}` };
    }

    async getChannelStats(): Promise<{
        channelId: string;
        title: string;
        description: string;
        subscribers: number;
        totalViews: number;
        videoCount: number;
        thumbnail: string;
    } | null> {
        const res = await fetch(
            `${YT_BASE}/channels?part=snippet,statistics&mine=true`,
            { headers: this.authHeader() }
        );
        if (!res.ok) throw new Error(`YouTube channels API: ${res.status}`);
        const data = await res.json();
        const ch = data.items?.[0];
        if (!ch) return null;
        return {
            channelId: ch.id,
            title: ch.snippet?.title || '',
            description: ch.snippet?.description || '',
            subscribers: Number(ch.statistics?.subscriberCount) || 0,
            totalViews: Number(ch.statistics?.viewCount) || 0,
            videoCount: Number(ch.statistics?.videoCount) || 0,
            thumbnail: ch.snippet?.thumbnails?.default?.url || ''
        };
    }

    async getAnalytics(
        channelId: string,
        startDate: string,
        endDate: string
    ): Promise<{
        views: number;
        estimatedMinutesWatched: number;
        averageViewDuration: number;
        subscribersGained: number;
        subscribersLost: number;
        likes: number;
        comments: number;
        shares: number;
    }> {
        const params = new URLSearchParams({
            ids: `channel==${channelId}`,
            startDate,
            endDate,
            metrics: 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost,likes,comments,shares'
        });

        const res = await fetch(`${YT_ANALYTICS}/reports?${params}`, {
            headers: this.authHeader()
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`YouTube Analytics API: ${res.status} — ${JSON.stringify(err)}`);
        }

        const data = await res.json();
        const row = data.rows?.[0] || [];
        const headers: string[] = (data.columnHeaders || []).map((h: any) => h.name);

        const get = (name: string) => Number(row[headers.indexOf(name)]) || 0;

        return {
            views: get('views'),
            estimatedMinutesWatched: get('estimatedMinutesWatched'),
            averageViewDuration: get('averageViewDuration'),
            averageViewPercentage: get('averageViewPercentage'),
            subscribersGained: get('subscribersGained'),
            subscribersLost: get('subscribersLost'),
            likes: get('likes'),
            comments: get('comments'),
            shares: get('shares')
        };
    }

    async getRecentVideos(maxResults = 6): Promise<Array<{
        id: string;
        title: string;
        publishedAt: string;
        thumbnail: string;
        views: number;
        likes: number;
        comments: number;
    }>> {
        // Search for latest uploads
        const searchRes = await fetch(
            `${YT_BASE}/search?part=id,snippet&forMine=true&type=video&order=date&maxResults=${maxResults}`,
            { headers: this.authHeader() }
        );
        if (!searchRes.ok) return [];
        const searchData = await searchRes.json();
        const videoIds: string[] = (searchData.items || []).map((i: any) => i.id?.videoId).filter(Boolean);
        if (videoIds.length === 0) return [];

        // Fetch stats for those videos
        const statsRes = await fetch(
            `${YT_BASE}/videos?part=snippet,statistics&id=${videoIds.join(',')}`,
            { headers: this.authHeader() }
        );
        if (!statsRes.ok) return [];
        const statsData = await statsRes.json();

        return (statsData.items || []).map((v: any) => ({
            id: v.id,
            title: v.snippet?.title || '',
            publishedAt: v.snippet?.publishedAt || '',
            thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
            views: Number(v.statistics?.viewCount) || 0,
            likes: Number(v.statistics?.likeCount) || 0,
            comments: Number(v.statistics?.commentCount) || 0
        }));
    }

    static async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
        const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: refreshToken
            })
        });
        const data = await res.json();
        if (!data.access_token) throw new Error(`Google token refresh failed: ${JSON.stringify(data)}`);
        return { access_token: data.access_token, expires_in: data.expires_in || 3600 };
    }
}
