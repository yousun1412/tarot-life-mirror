import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
let html = fs.readFileSync(path.join(root,'index.html'),'utf8');
const mime = file => file.endsWith('.webp') ? 'image/webp' : file.endsWith('.png') ? 'image/png' : 'application/octet-stream';
const assetMap = {};
for (const group of ['major','minor']) {
  const dir = path.join(root,'assets/decks/classic-rws',group);
  for (const name of fs.readdirSync(dir)) {
    if (!/\.(webp|png)$/i.test(name)) continue;
    const rel = `./assets/decks/classic-rws/${group}/${name}`;
    const data = fs.readFileSync(path.join(dir,name)).toString('base64');
    assetMap[rel] = `data:${mime(name)};base64,${data}`;
  }
}

html = html.replace(/<link href="\.\/css\/([^"]+)" rel="stylesheet"\/>/g, (_, file) => {
  const css = fs.readFileSync(path.join(root,'css',file),'utf8');
  return `<style data-source="css/${file}">\n${css}\n</style>`;
});
html = html.replace(/<link href="\.\/manifest\.webmanifest" rel="manifest"\/>/g,'');
html = html.replace(/<link href="\.\/icons\/[^>]+>/g,'');
const assetScript = `<script>window.LIFE_MIRROR_ASSET_MAP=${JSON.stringify(assetMap)};<\/script>`;
html = html.replace('</head>', `${assetScript}</head>`);
html = html.replace(/<script defer="" src="\.\/([^"]+)"><\/script>/g, (_, file) => {
  const js = fs.readFileSync(path.join(root,file),'utf8');
  return `<script data-source="${file}">\n${js}\n<\/script>`;
});
html = html.replace(/<meta content="v22-multi-deck-system" name="tarot-build"\/>/, '<meta content="v22-multi-deck-system-standalone" name="tarot-build"/>');
fs.writeFileSync(path.join(root,'online-preview-v22.html'), html);
console.log(`preview ${Math.round(Buffer.byteLength(html)/1024)} KB`);
