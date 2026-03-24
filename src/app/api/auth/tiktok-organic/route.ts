import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const appId = process.env.TIKTOK_APP_KEY!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/tiktok/callback`;
    const state = `organic_${Math.random().toString(36).substring(7)}`;

    const authUrl = new URL('https://business-api.tiktok.com/portal/auth');
    authUrl.searchParams.set('app_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'advertiser.read,tiktok.account.read');

    return NextResponse.redirect(authUrl.toString());
}
