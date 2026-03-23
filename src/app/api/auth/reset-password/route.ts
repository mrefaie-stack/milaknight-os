import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
    const { token, password } = await req.json();
    if (!token || !password) {
        return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await (prisma as any).passwordResetToken.findUnique({
        where: { tokenHash }
    });

    if (!record) {
        return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    if (new Date() > new Date(record.expiresAt)) {
        await (prisma as any).passwordResetToken.delete({ where: { tokenHash } });
        return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({ where: { email: record.email } });
    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await (prisma as any).user.update({
        where: { email: record.email },
        data: { password: hashedPassword }
    });

    // Delete token so it can't be reused
    await (prisma as any).passwordResetToken.delete({ where: { tokenHash } });

    return NextResponse.json({ success: true });
}

// Validate token (called by the reset page to check if token is valid before showing the form)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ valid: false });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const record = await (prisma as any).passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || new Date() > new Date(record.expiresAt)) {
        return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, email: record.email });
}
