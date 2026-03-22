import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const appKey = process.env.TIKTOK_APP_KEY!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/tiktok/callback`;

    const authUrl = new URL('https://ads.tiktok.com/marketing_api/auth');
    authUrl.searchParams.set('app_id', appKey);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', Math.random().toString(36).substring(7));

    return NextResponse.redirect(authUrl.toString());
}
