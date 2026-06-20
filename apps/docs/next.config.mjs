import nextra from 'nextra';

const withNextra = nextra({
  // Nextra v4: MDX content lives in /content, served via the [...mdxPath] catch-all.
  // We supply a fully custom theme; content maps to the URL root (no /docs prefix).
  contentDirBasePath: '/',
  defaultShowCopyCode: true,
});

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Real app widgets get wired in for the showcase (added when first imported).
  // transpilePackages: ['@deepbookie/web', '@deepbookie/core', '@deepbookie/predict-client'],
};

export default withNextra(config);
