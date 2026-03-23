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

    const clientId = process.env.SALLA_CLIENT_ID!;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/salla/callback`;
    const state = crypto.randomBytes(16).toString('hex');

    const cookieStore = await cookies();
    cookieStore.set('salla_state', state, {
        httpOnly: true,
        secure: true,
        maxAge: 600,
        sameSite: 'lax',
        path: '/'
    });

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'offline_access',
        state
    });

    return NextResponse.redirect(`https://accounts.salla.sa/oauth2/auth?${params}`);
}
