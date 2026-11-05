import fs from 'fs';
import path from 'path';
import * as esbuild from 'esbuild';

const root = process.cwd();
const vercelDir = path.join(root, '.vercel');
const outDir = path.join(root, '.vercel', 'output');
const staticDir = path.join(outDir, 'static');
const funcDir = path.join(outDir, 'functions', 'api.func');

try {
  fs.unlinkSync(path.join(vercelDir, 'project.json'));
} catch {
  // ignore
}
try {
  fs.unlinkSync(path.join(vercelDir, 'anonymous.json'));
} catch {
  // ignore
}
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(funcDir, { recursive: true });

// 1. Copy dist/ to .vercel/output/static/
fs.cpSync(path.join(root, 'dist'), staticDir, { recursive: true });

// 2. Bundle Express + PostgreSQL API into .vercel/output/functions/api.func/index.cjs
await esbuild.build({
  entryPoints: [path.join(root, 'api', 'index.js')],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  outfile: path.join(funcDir, 'index.cjs'),
  external: ['pg-native']
});

fs.writeFileSync(
  path.join(funcDir, '.vc-config.json'),
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.cjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: true
    },
    null,
    2
  )
);

// 3. Write .vercel/output/config.json (Build Output API v3)
fs.writeFileSync(
  path.join(outDir, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: '^/api/(.*)$', dest: '/api' },
        { handle: 'filesystem' },
        { src: '/(.*)', dest: '/index.html' }
      ]
    },
    null,
    2
  )
);

console.log('✅ Built .vercel/output (Build Output API v3) successfully!');
