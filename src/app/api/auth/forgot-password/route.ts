import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: Request) {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to avoid email enumeration
    const user = await (prisma as any).user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return NextResponse.json({ success: true });

    // Delete any existing tokens for this email
    await (prisma as any).passwordResetToken.deleteMany({ where: { email: normalizedEmail } });

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await (prisma as any).passwordResetToken.create({
        data: { email: normalizedEmail, tokenHash, expiresAt }
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

    await sendEmail({
        to: normalizedEmail,
        subject: 'Reset your MilaKnight OS password',
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f0f12;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f12;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="padding:32px 32px 24px;border-bottom:1px solid #27272a;text-align:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;margin-bottom:16px">
              <span style="color:#fff;font-weight:900;font-size:18px">MK</span>
            </div>
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">MilaKnight OS</h1>
            <p style="margin:4px 0 0;color:#71717a;font-size:13px">Password Reset Request</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;color:#a1a1aa;font-size:13px">Hello ${user.firstName || user.email},</p>
            <p style="margin:0 0 24px;color:#d4d4d8;font-size:14px;line-height:1.6">
              We received a request to reset your password. Click the button below to set a new password. This link will expire in <strong style="color:#fff">1 hour</strong>.
            </p>
            <div style="text-align:center;margin:0 0 24px">
              <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:10px">
                Reset Password
              </a>
            </div>
            <p style="margin:0 0 8px;color:#52525b;font-size:12px;line-height:1.6">
              Or copy and paste this URL into your browser:
            </p>
            <p style="margin:0 0 24px;word-break:break-all">
              <a href="${resetUrl}" style="color:#6366f1;font-size:11px;text-decoration:none">${resetUrl}</a>
            </p>
            <div style="border-top:1px solid #27272a;padding-top:20px">
              <p style="margin:0;color:#52525b;font-size:12px;line-height:1.6">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #27272a;text-align:center">
            <p style="margin:0;color:#3f3f46;font-size:11px">© 2026 MilaKnight · os.mila-knight.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });

    return NextResponse.json({ success: true });
}
