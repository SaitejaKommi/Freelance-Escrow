import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TrustlessEscrow — AI-Verified Freelance Payments',
    template: '%s | TrustlessEscrow',
  },
  description:
    'An AI-powered escrow platform that verifies GitHub progress against milestones and recommends automated payment releases on Monad.',
  keywords: ['escrow', 'AI', 'freelance', 'GitHub', 'Monad', 'smart contract', 'verification'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
