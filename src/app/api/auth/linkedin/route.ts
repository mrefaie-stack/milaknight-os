import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse('Unauthorized', { status: 401 });

    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/linkedin/callback`;
    const state = Math.random().toString(36).substring(7);

    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'openid profile email r_organization_social w_member_social');

    return NextResponse.redirect(authUrl.toString());
}
