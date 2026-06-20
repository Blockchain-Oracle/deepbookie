import type { Metadata } from 'next';
import { PageLayout } from '@/components/shell/PageLayout';
import { ToolsCatalog } from '@/components/tools/ToolsCatalog';
import type { Surface } from '@/lib/tools-data';

export const metadata: Metadata = {
  title: 'Tool reference',
  description: 'Every tool the agent can call across Predict and Spot — 44 in eight families.',
};

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ surface?: string }>;
}) {
  const sp = await searchParams;
  const surface: Surface | undefined =
    sp.surface === 'predict' || sp.surface === 'spot' ? sp.surface : undefined;

  return (
    <PageLayout wide showBreadcrumb>
      <ToolsCatalog initialSurface={surface} />
    </PageLayout>
  );
}
