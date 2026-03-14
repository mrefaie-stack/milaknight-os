import nodemailer from "nodemailer";

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
    let transporter;

    if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
        // Use Gmail with App Password
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === "production"
            }
        });
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Use generic SMTP
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback: Just log it in development if no env variables exist
        console.warn("⚠️ No email config found (.env: GMAIL_EMAIL/GMAIL_APP_PASSWORD). Simulating email:");
        console.log(`\n📧 TO: ${to}\n📝 SUBJECT: ${subject}\n📑 BODY: ${html}\n`);
        return true;
    }

    try {
        const fromEmail = process.env.GMAIL_EMAIL || process.env.SMTP_USER || 'noreply@milaknight.com';
        const info = await transporter.sendMail({
            from: `"MilaKnight OS" <${fromEmail}>`,
            to,
            subject,
            html,
        });
        console.log("✅ Email sent successfully: " + info.messageId);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return false;
    }
}
