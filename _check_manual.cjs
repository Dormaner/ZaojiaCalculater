const fs = require('fs');
const os = require('os');
const path = require('path');

const x = path.join(os.tmpdir(), 'manual_check', 'x');
const doc = fs.readFileSync(path.join(x, 'word', 'document.xml'), 'utf8');
const rels = fs.readFileSync(path.join(x, 'word', '_rels', 'document.xml.rels'), 'utf8');

const drawings = (doc.match(/<w:drawing>/g) || []).length;
const embeds = [...doc.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
const relIds = new Set([...rels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]));
const missing = embeds.filter((e) => !relIds.has(e));
console.log('drawings =', drawings, '| embeds =', embeds.length, '| missing rels =', missing.length);

const caps = [...doc.matchAll(/图 \d+-\d+/g)].map((m) => m[0]);
console.log('figure captions =', caps.length);
console.log('caption list =', [...new Set(caps)].join(' '));

const tabs = (doc.match(/<w:tbl>/g) || []).length;
const paras = (doc.match(/<w:p[ >]/g) || []).length;
console.log('tables =', tabs, '| paragraphs =', paras);

const heads = [...doc.matchAll(/<w:t[^>]*>(第 \d+ 章[^<]*|附录 [A-C][^<]*)<\/w:t>/g)].map((m) => m[1]);
console.log('headings =', heads.join(' / '));

const media = path.join(x, 'word', 'media');
const imgs = fs.readdirSync(media);
console.log('media files =', imgs.length, '| total KB =', Math.round(imgs.reduce((s, f) => s + fs.statSync(path.join(media, f)).size, 0) / 1024));

// 文本总字数（近似）
const text = [...doc.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join('');
console.log('total text chars =', text.length);
