import React from 'react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 text-foreground/80 leading-relaxed">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Terms of Service</h1>
      <p className="mb-4">Last Updated: March 2026</p>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
        <p>By accessing MilaKnight OS, you agree to be bound by these terms. Our platform provides dashboard and reporting tools for social media management.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. API Usage</h2>
        <p>Our service integrates with third-party APIs (Meta, TikTok). You must comply with their respective terms of service when connecting your accounts through our platform.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Limitation of Liability</h2>
        <p>MilaKnight OS is provided "as is". We are not responsible for any data discrepancies caused by third-party platform API changes or downtime.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Contact</h2>
        <p>For any questions regarding these terms, please contact support@mila-knight.com.</p>
      </section>
    </div>
  );
}
