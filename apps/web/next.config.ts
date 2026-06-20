import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Consume the workspace TS packages (both browser-safe) without prebuilding their dist in dev.
  transpilePackages: ['@deepbookie/core', '@deepbookie/predict-client'],
  // Linting is owned by the root flat config (`pnpm lint` → `eslint .`); don't double-lint in build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
