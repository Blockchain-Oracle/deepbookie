import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  banner: { js: '#!/usr/bin/env node' },
  // Bundle the internal signer in — @deepbookie/node is NOT published, so its code ships inside
  // this binary (core/predict-client stay external; they're published registry deps).
  noExternal: ['@deepbookie/node'],
});
