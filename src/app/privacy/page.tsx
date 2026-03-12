import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-20 px-6 text-foreground/80 leading-relaxed">
      <h1 className="text-4xl font-bold mb-8 text-foreground">Privacy Policy</h1>
      <p className="mb-4">Last Updated: March 2026</p>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
        <p>MilaKnight OS ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform and connect your social media accounts.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Data Collection via Meta/TikTok APIs</h2>
        <p>When you connect your Meta (Facebook/Instagram) or TikTok accounts, we collect professional data including:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Ad account performance metrics (Spend, CPC, Impressions).</li>
          <li>Page insights (Follower count, engagement rates).</li>
          <li>Public profile information necessary for authentication.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Data</h2>
        <p>Your data is used solely to provide you with the Live Dashboard services, including performance visualization and reporting. We do not sell your data to third parties.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Deletion</h2>
        <p>You can disconnect your accounts at any time via the settings panel. To request complete deletion of your account data, please contact us at support@mila-knight.com.</p>
      </section>
    </div>
  );
}
