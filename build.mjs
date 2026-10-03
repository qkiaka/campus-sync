// esbuild で拡張機能を dist/ にビルドします。
import { build, context } from 'esbuild';
import fs from 'node:fs';

const watch = process.argv.includes('--watch');
const cfg = JSON.parse(fs.readFileSync('config.json', 'utf8'));

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist/icons', { recursive: true });

// manifest.json = manifest.base.json + config.json の橋渡し先
const manifest = JSON.parse(fs.readFileSync('manifest.base.json', 'utf8'));
const bridge = manifest.content_scripts.find((c) => c.js.includes('bridge.js'));
bridge.matches = cfg.bridgeMatches;
fs.writeFileSync('dist/manifest.json', JSON.stringify(manifest, null, 2));

fs.copyFileSync('src/popup/popup.html', 'dist/popup.html');
fs.copyFileSync('src/popup/popup.css', 'dist/popup.css');
for (const f of fs.readdirSync('icons')) fs.copyFileSync(`icons/${f}`, `dist/icons/${f}`);

const options = {
  entryPoints: {
    background: 'src/background.ts',
    content: 'src/content/index.ts',
    bridge: 'src/bridge.ts',
    popup: 'src/popup/popup.ts',
  },
  bundle: true,
  format: 'iife',
  target: 'chrome110',
  outdir: 'dist',
  define: { __WEB_APP_URL__: JSON.stringify(cfg.webAppUrl) },
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('watching...');
} else {
  await build(options);
  console.log('built: extension/dist');
}
