import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { XAPI } from '@/lib/x-api';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const consumerKey = process.env.X_API_KEY;
    const consumerSecret = process.env.X_API_SECRET;
    const accessToken = process.env.X_ACCESS_TOKEN;
    const tokenSecret = process.env.X_ACCESS_SECRET;

    if (!consumerKey || !consumerSecret || !accessToken || !tokenSecret) {
        return NextResponse.json({ error: 'X not configured' }, { status: 404 });
    }

    try {
        const x = new XAPI({ consumerKey, consumerSecret, accessToken, tokenSecret });
        const user = await x.getAccountInfo();

        return NextResponse.json({
            platform: 'X',
            accountName: user.name || 'X Account',
            username: user.screen_name,
            profileImageUrl: user.profile_image_url_https,
            stats: {
                followers: user.followers_count || 0,
                following: user.friends_count || 0,
                tweets: user.statuses_count || 0,
                likes: user.favourites_count || 0,
                listed: user.listed_count || 0,
            },
            createdAt: user.created_at,
            verified: user.verified || false,
            status: 'success'
        });
    } catch (error: any) {
        console.error('X Live API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
