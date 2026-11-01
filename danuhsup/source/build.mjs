// 빌드: node build.mjs  →  dist/ (Firebase Hosting용), demo/단어숲-체험.html (단일 파일 미리보기)
import * as esbuild from 'esbuild';
import fs from 'fs';
fs.rmSync('dist', { recursive: true, force: true }); fs.mkdirSync('dist'); fs.mkdirSync('demo', { recursive: true });
const r = await esbuild.build({ entryPoints: ['src/main.js'], bundle: true, format: 'esm', minify: true, target: ['es2020', 'safari14'], loader: { '.json': 'json' }, write: false, legalComments: 'none' });
const js = r.outputFiles[0].text;
const css = (await esbuild.build({ entryPoints: ['src/styles.css'], bundle: true, minify: true, write: false })).outputFiles[0].text;
fs.writeFileSync('dist/app.js', js); fs.writeFileSync('dist/app.css', css);
fs.copyFileSync('index.html', 'dist/index.html');
for (const f of fs.readdirSync('public')) fs.copyFileSync('public/' + f, 'dist/' + f);
// 서비스 워커: 앱 파일 내용이 바뀔 때마다 버전이 바뀌어 학생 기기에 새 버전이 깔림
const { createHash } = await import('crypto');
const ver = createHash('sha1').update(js).update(css).update(fs.readFileSync('index.html')).digest('hex').slice(0, 10);
fs.writeFileSync('dist/sw.js', fs.readFileSync('sw.js', 'utf8').replace('__VERSION__', ver));
const fonts = fs.readFileSync('index.html', 'utf8').match(/<link rel="stylesheet" href="https:\/\/fonts[^>]+>/)[0];
fs.writeFileSync('demo/vocab-demo.html', `<title>단어숲</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
<style>${css}</style>
<div id="app"></div>
<script type="module">${js.replace(/<\/script/g, '<\\/script')}</script>
`);
console.log('dist/app.js', (js.length / 1024).toFixed(0) + 'KB', 'css', (css.length / 1024).toFixed(0) + 'KB');
