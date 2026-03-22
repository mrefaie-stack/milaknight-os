import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'AM')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const clientId = process.env.SNAPCHAT_CLIENT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/snapchat/callback`;

    const authUrl = new URL('https://accounts.snapchat.com/accounts/oauth2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'snapchat-marketing-api');

    return NextResponse.redirect(authUrl.toString());
}
