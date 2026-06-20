'use client';

import Link from 'next/link';
import { Page, PageHeader } from '@/components/shell/Page';
import { Card } from '@/components/ui/Card';

/**
 * History stub — wallet-keyed transcript persistence (Neon + Drizzle) lands in Phase 6. Until then
 * this is an honest empty state rather than a faked sessions list.
 */
export default function HistoryPage() {
  return (
    <Page>
      <PageHeader title="History" subtitle="Every chat you sign is saved here, restored exactly" />
      <Card className="p-10 text-center">
        <div className="text-[15px] font-semibold">No saved sessions yet</div>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          When you talk to the agent and sign a trade, that conversation is saved as a session — the
          immutable receipt plus the market’s live outcome. Start a chat to create your first one.
        </p>
        <Link
          href="/chat"
          className="mt-5 inline-flex rounded-card-in bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          Open chat →
        </Link>
      </Card>
    </Page>
  );
}
