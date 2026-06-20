import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';

/** Custom 404 — branded, provider-free (renders under the root layout, no wallet needed). */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <div className="mb-7 flex items-center gap-2">
        <BrandMark size={24} />
        <span className="text-lg font-bold tracking-[-0.03em]">DeepBookie</span>
      </div>
      <div className="font-mono text-[72px] font-extrabold leading-none tracking-[-0.04em] text-ink">404</div>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted">
        This page drifted off the order book. The link may be broken, or the page moved.
      </p>
      <div className="mt-7 flex gap-3">
        <Link
          href="/chat"
          className="rounded-card-in bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          Open the app →
        </Link>
        <Link
          href="/markets"
          className="rounded-card-in border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper"
        >
          Browse markets
        </Link>
      </div>
    </div>
  );
}
