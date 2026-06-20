import type { ReactNode } from 'react';
import { Footer } from '../shell/Footer';
import { Toc, type TocHeading } from './Toc';
import { ContentNav } from './ContentNav';

/**
 * Server wrapper for MDX content pages — keeps the page a Server Component
 * (so frontmatter `metadata` export is allowed). Interactive bits
 * (breadcrumb, prev/next, TOC) are isolated client children.
 */
export function ContentShell({ children, toc }: { children: ReactNode; toc?: TocHeading[] }) {
  return (
    <>
      <div style={{ flex: 1, maxWidth: 760, padding: '34px 44px', minWidth: 0 }}>
        <ContentNav position="top" />
        <div className="dbk-prose">{children}</div>
        <ContentNav position="bottom" />
        <Footer />
      </div>
      {toc && toc.length > 0 && <Toc toc={toc} />}
    </>
  );
}
