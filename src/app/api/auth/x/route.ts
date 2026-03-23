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

    const clientId = process.env.X_CLIENT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/x/callback`;

    // PKCE
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    // Save verifier + state in cookies for callback
    const cookieStore = await cookies();
    cookieStore.set('x_code_verifier', codeVerifier, { httpOnly: true, secure: true, maxAge: 600, sameSite: 'lax', path: '/' });
    cookieStore.set('x_state', state, { httpOnly: true, secure: true, maxAge: 600, sameSite: 'lax', path: '/' });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'tweet.read users.read offline.access',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });

    return NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${params}`);
}
