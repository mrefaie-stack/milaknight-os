import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;

    // PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    const cookieStore = await cookies();
    cookieStore.set('google_code_verifier', codeVerifier, { httpOnly: true, secure: true, maxAge: 600, sameSite: 'lax', path: '/' });
    cookieStore.set('google_state', state, { httpOnly: true, secure: true, maxAge: 600, sameSite: 'lax', path: '/' });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/yt-analytics.readonly',
            'https://www.googleapis.com/auth/adwords'
        ].join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent'
    });

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
