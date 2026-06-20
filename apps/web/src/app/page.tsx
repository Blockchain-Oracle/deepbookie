import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { DemoPhone } from '@/components/landing/DemoPhone';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { TrustBand } from '@/components/landing/TrustBand';
import { OddsGlimpse } from '@/components/landing/OddsGlimpse';
import { OpenProtocol } from '@/components/landing/OpenProtocol';
import { CtaFooter } from '@/components/landing/CtaFooter';

/**
 * The landing page (SSR, provider-free — no wallet hooks). Sections are built to the designer's
 * Landing.dc.html; the hero pairs the text column with the scripted DemoPhone (the one animated,
 * chain-free piece). Order mirrors the design: hero → how → trust → odds → protocol → cta.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <LandingHeader />
      <section className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-12 gap-y-14 px-6 py-16 lg:py-24">
        <Hero />
        <DemoPhone />
      </section>
      <HowItWorks />
      <TrustBand />
      <OddsGlimpse />
      <OpenProtocol />
      <CtaFooter />
    </main>
  );
}
