import { useMDXComponents as getNextraComponents } from 'nextra/mdx-components';
import type { MDXComponents } from 'mdx/types';
import { ContentShell } from '@/components/content/ContentShell';
import { Callout } from '@/components/content/Callout';
import { Steps } from '@/components/content/Steps';
import { ArchDiagram } from '@/components/content/ArchDiagram';
import { OddsCurve } from '@/components/content/OddsCurve';
import { PromptDemo } from '@/components/content/PromptDemo';
import { SignReceiptStates } from '@/components/content/SignReceiptStates';
import { Roadmap } from '@/components/content/Roadmap';

const nextraComponents = getNextraComponents({
  wrapper({ children, toc }) {
    return <ContentShell toc={toc as never}>{children}</ContentShell>;
  },
});

/** Brand MDX components: prose styling via .dbk-prose, plus our widgets. */
export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...nextraComponents,
    Callout,
    Steps,
    ArchDiagram,
    OddsCurve,
    PromptDemo,
    SignReceiptStates,
    Roadmap,
    ...components,
  };
}
