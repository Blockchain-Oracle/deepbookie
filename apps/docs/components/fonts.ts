import { Schibsted_Grotesk, IBM_Plex_Mono } from 'next/font/google';

/** Display & UI face — matches apps/web. */
export const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-schibsted',
  display: 'swap',
});

/** Figures, labels, ids — tabular. */
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});
