#!/usr/bin/env node
/**
 * Проверка доставки на моке Sanity. Настоящий датасет не затрагивается:
 * deliver.mjs запускается дочерним процессом с SANITY_API_HOST на локальный
 * сервер, который записывает каждую мутацию.
 *
 *   node scripts/news/selftest-deliver.mjs
 *
 * Здесь проверяется то, что нельзя сломать молча: нет createOrReplace, потолок
 * публикаций держится, черновик имеет префикс drafts., автор — не человек, публичный
 * лог не содержит имён, а сбой одной записи не прячет остальные.
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
let failed = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) failed++;
};

const SECTIONS = ['casino-slots', 'sports-betting', 'poker-table-games', 'lottery-esports'];
const words = (n) => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');
const verdict = () => ({ ok: true, namesPrivateIndividuals: false, individuals: [], blockers: [], notes: 'ок' });

function record(id, patch = {}) {
  return {
    id, live: true, event: `Event ${id}`,
    factsParsed: { event: 'A regulator fined an operator', facts: [{ statement: 'Fine of EUR 5 million on 20 October 2026', attribution: 'regulator', sourceGroups: ['a', 'b', 'c'] }], unconfirmed: ['One outlet says the fine was paid'] },
    eventMeta: { verdict: 'confirmed', confirmingGroups: ['a', 'b', 'c'], voices: 3 },
    fetched: [{ group: 'a', chars: 2000 }, { group: 'b', chars: 2000 }, { group: 'c', chars: 2000 }],
    sources: [{ group: 'a', url: `https://a.example/${id}` }],
    truncated: {},
    critique: { text: 'Замечаний нет.' },
    verify: verdict(), verifyEs: verdict(),
    en: { text: words(400), check: { ok: true, issues: [], words: 400, rhythm: { cv: 0.5, singleShare: 0.3 } },
      meta: { title: `Title ${id}`, description: 'D'.repeat(120), slug: `slug-${id}`, section: 'casino-slots' } },
    es: { text: words(450), check: { ok: true, issues: [] },
      meta: { title: `Titulo ${id}`, description: 'D'.repeat(120), slug: `slug-es-${id}` } },
    ...patch,
  };
}

const existing = new Set(['news-already', 'drafts.news-already']);
const mutations = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    res.setHeader('content-type', 'application/json');
    if (req.method === 'GET' && url.pathname.includes('/data/query/')) {
      const q = url.searchParams.get('query');
      if (q.includes('_type == "section"')) return res.end(JSON.stringify({ result: SECTIONS.map((s) => `section-${s}`), ms: 1 }));
      if (q.includes('newsReview')) {
        // прежняя доставка того же события: адрес источника уже есть в закрытом документе заметок
        const urls = JSON.parse(url.searchParams.get('$urls') ?? '[]');
        const seen = urls.some((u) => u.includes('seen.example'));
        return res.end(JSON.stringify({ result: seen ? { _id: 'drafts.news-review-old', articleId: 'news-oldid' } : null, ms: 1 }));
      }
      const slug = JSON.parse(url.searchParams.get('$slug') ?? 'null');
      if (slug === 'slug-boom') { res.statusCode = 500; return res.end(JSON.stringify({ error: { description: 'boom' } })); }
      return res.end(JSON.stringify({ result: slug === 'slug-collide' ? 'someone-elses-doc' : null, ms: 1 }));
    }
    if (req.method === 'GET' && url.pathname.includes('/data/doc/')) {
      const id = decodeURIComponent(url.pathname.split('/').pop());
      return res.end(JSON.stringify({ documents: existing.has(id) ? [{ _id: id, _type: 'article' }] : [] }));
    }
    if (req.method === 'POST' && url.pathname.includes('/data/mutate/')) {
      const { mutations: m } = JSON.parse(body);
      mutations.push(...m);
      return res.end(JSON.stringify({ transactionId: 't', results: m.map((x) => ({ id: (x.createIfNotExists ?? x.create ?? x.createOrReplace)?._id, operation: 'create' })) }));
    }
    res.statusCode = 404;
    res.end('{}');
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const host = `http://127.0.0.1:${server.address().port}`;

function runDeliver(records, { mode, write, cap = 3, env = {} }) {
  const dir = mkdtempSync(join(tmpdir(), 'deliver-test-'));
  mkdirSync(join(dir, 'drafts'));
  for (const r of records) writeFileSync(join(dir, 'drafts', `${r.id}.json`), JSON.stringify(r));
  const outFile = join(dir, 'gh-output.txt');
  writeFileSync(outFile, '');
  return new Promise((resolve) => {
    const child = spawn('node', [join(HERE, 'deliver.mjs'), ...(write ? ['--write'] : [])], {
      env: { ...process.env, NEWS_PIPE_DIR: dir, NEWS_PUBLISH_MODE: mode, NEWS_AUTO_MAX_PER_RUN: String(cap),
        SANITY_PROJECT_ID: 'proj', SANITY_DATASET: 'ds', SANITY_WRITE_TOKEN: write ? 'tok' : '', SANITY_API_HOST: host,
        GITHUB_OUTPUT: outFile, GITHUB_STEP_SUMMARY: join(dir, 'summary.md'), GITHUB_ACTIONS: '', ...env },
    });
    let out = '';
    child.stdout.on('data', (c) => (out += c));
    child.stderr.on('data', (c) => (out += c));
    child.on('close', (code) => resolve({ code, out, dir, outFile }));
  });
}
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');

console.log('\nРежим auto, запись: потолок, слаги, существующие документы');
const batch = [
  record('a1'), record('a2'), record('a3'), record('a4'),
  record('hold', { verify: { ok: false, namesPrivateIndividuals: true, individuals: ['X Y'], blockers: [], notes: '' } }),
  record('collide', { en: { ...record('c').en, meta: { ...record('c').en.meta, slug: 'slug-collide' } } }),
  record('already'),
];
const auto = await runDeliver(batch, { mode: 'auto', write: true, cap: 3 });
ok(auto.code === 0, 'завершился без ошибки', auto.out.slice(-300));
const ops = mutations.map((m) => Object.keys(m)[0]);
ok(ops.every((o) => o === 'createIfNotExists'), 'только createIfNotExists, ни одного createOrReplace', JSON.stringify([...new Set(ops)]));
const all = mutations.map((m) => m.createIfNotExists);
const docs = all.filter((d) => d._type === 'article');
const reviews = all.filter((d) => d._type === 'newsReview');
const pub = docs.filter((d) => !d._id.startsWith('drafts.'));
const drafts = docs.filter((d) => d._id.startsWith('drafts.'));
ok(pub.length === 3, `опубликовано ровно 3 (потолок), а не все четыре подходящих: ${pub.length}`);
ok(drafts.some((d) => d._id === 'drafts.news-a4'), 'четвёртый подходящий ушёл черновиком из-за потолка');
ok(drafts.some((d) => d._id === 'drafts.news-hold'), 'материал с названным человеком — черновик, даже в режиме auto');
ok(!docs.some((d) => d._id.includes('already')), 'уже существующий документ не перезаписан');
ok(docs.every((d) => d.aiDisclosure === 'automated'),
  'пометка «без проверки» у ВСЕХ материалов конвейера, и у черновиков тоже (редактор сам меняет на assisted)');
ok(docs.every((d) => d.author === 'Ve7as' && !d.authorRef), 'автор «Ve7as», ссылки на человека нет');
ok(docs.every((d) => d.title_ru === d.title_en && d.body_ru === d.body_en), 'поля ru заполнены английским (корень фолбэка)');
ok(docs.every((d) => d.section._ref === 'section-casino-slots'), 'раздел задан ссылкой на section-<slug>');
const collided = docs.find((d) => d._id.includes('collide'));
ok(collided?.slug.current === 'slug-collide-coll', `занятый слаг получил хвост: ${collided?.slug.current}`);

// ПРИВАТНОСТЬ. Датасет публичный: поле опубликованной статьи читается любым через API.
ok(docs.every((d) => !('reviewNotes' in d) && !('notes' in d) && !('sourceUrls' in d)), 'в документе СТАТЬИ нет заметок и адресов источников (публичный датасет)');
ok(reviews.length === docs.length, `на каждую статью один документ заметок: ${reviews.length} из ${docs.length}`);
ok(reviews.every((r) => r._id.startsWith('drafts.news-review-')), 'документы заметок — только черновики (drafts.), их не отдаёт анонимный API');
ok(reviews.every((r) => r._type === 'newsReview' && Array.isArray(r.sourceUrls) && r.sourceUrls.length > 0), 'заметки лежат в закрытом newsReview и хранят адреса источников');
ok(reviews.every((r) => r.notes.includes('Создано конвейером')), 'заметки редактора приложены ко всем');
ok(reviews.every((r) => r.notes.includes('Диагностика:') && r.notes.includes('прочитано:')), 'в заметках есть блок диагностики: что реально прочитано');
ok(docs.every((d) => !JSON.stringify(d).includes('Диагностика:')), 'диагностики нет в документе статьи (она только в приватном newsReview)');
const holdNotes = reviews.find((r) => r._id.endsWith('hold')).notes;
ok(/частный человек/.test(holdNotes) && /X Y/.test(holdNotes), 'в закрытых заметках названа причина и имя');
const order = mutations.map((m) => (m.createIfNotExists._type === 'newsReview' ? 'R' : 'A')).join('');
ok(/^(RA)+$/.test(order), `порядок записи: заметки, затем статья (${order})`);
ok(reviews.some((r) => r.wouldAutoPublish === true) && reviews.some((r) => r.wouldAutoPublish === false),
  'заметки хранят, ушёл бы материал при auto: есть и «да», и «нет»');
const recFile = JSON.parse(readFileSync(join(auto.dir, 'drafts', 'a1.json'), 'utf8'));
ok(recFile.deliveredAs === 'published' && recFile.sanityId === 'news-a1', 'запись помечена доставленной');
const ids = (read(auto.outFile).match(/^ids=(.*)$/m) ?? [])[1] ?? '';
ok(ids.split(' ').includes('already'), 'в ids для журнала входит и уже существовавшее событие (иначе его регенерируют и оплатят снова)', ids);

console.log('\nПубличный лог GitHub Actions: без имён, цитат и заголовков черновиков');
mutations.length = 0;
const leaky = record('leak', { verify: { ok: false, namesPrivateIndividuals: true, individuals: ['Anthony Lee'], blockers: [{ kind: 'other', quote: 'The Commission names Jeremy Hunt', problem: 'p' }], notes: '' },
  en: { ...record('l').en, meta: { ...record('l').en.meta, title: 'Secret Draft Headline About Someone' } } });
const ci = await runDeliver([leaky], { mode: 'auto', write: true, env: { GITHUB_ACTIONS: 'true' } });
const publicText = ci.out + read(join(ci.dir, 'summary.md')) + read(join(ci.dir, 'delivered.public.json'));
ok(!/Anthony Lee|Jeremy Hunt|Commission names/.test(publicText), 'имена и цитаты блокеров не попали в лог, сводку и публичный отчёт');
ok(!/Secret Draft Headline/.test(publicText), 'заголовок непубликуемого черновика не попал в публичный вывод');
ok(/коды: .*named-individuals/.test(ci.out), 'в логе есть коды причин — по ним можно разбираться');
const local = await runDeliver([leaky], { mode: 'auto', write: false });
ok(/Anthony Lee/.test(local.out), 'локально (не в Actions) причины печатаются полностью');

console.log('\nСбой одной записи не роняет остальные');
mutations.length = 0;
const mixed = await runDeliver([record('m1'), record('m2', { en: { ...record('x').en, meta: { ...record('x').en.meta, slug: 'slug-boom' } } }), record('m3')], { mode: 'draft', write: true });
const mixedDocs = mutations.map((m) => m.createIfNotExists).filter((d) => d._type === 'article').map((d) => d._id).sort();
ok(mixedDocs.join() === 'drafts.news-m1,drafts.news-m3', `m1 и m3 доставлены, несмотря на сбой m2: ${mixedDocs.join()}`);
ok(mixed.code === 1, 'прогон красный (есть ошибка), а не зелёный');
const mixedIds = (read(mixed.outFile).match(/^ids=(.*)$/m) ?? [])[1] ?? '';
ok(mixedIds.split(' ').sort().join() === 'm1,m3', `в журнал пойдут только доставленные: ${mixedIds}`);

console.log('\nЗащита от дубля по адресам источников (идентификатор события мог смениться)');
mutations.length = 0;
const dup = await runDeliver([record('rot', { sources: [{ group: 'a', url: 'https://seen.example/story' }] })], { mode: 'auto', write: true });
ok(mutations.length === 0, 'документ не создан: адрес источника уже есть в закрытых заметках', JSON.stringify(mutations.map((m) => Object.keys(m))));
ok(JSON.parse(readFileSync(join(dup.dir, 'drafts', 'rot.json'), 'utf8')).sanityId === 'news-oldid', 'запись привязана к прежнему документу');
ok(((read(dup.outFile).match(/^ids=(.*)$/m) ?? [])[1] ?? '').includes('rot'), 'событие всё равно уходит в журнал');

console.log('\nРежим draft: публикаций нет вообще');
mutations.length = 0;
const dr = await runDeliver([record('d1'), record('d2')], { mode: 'draft', write: true });
const dd = mutations.map((m) => m.createIfNotExists);
const ddArticles = dd.filter((d) => d._type === 'article');
const ddReviews = dd.filter((d) => d._type === 'newsReview');
ok(ddArticles.length === 2 && ddArticles.every((d) => d._id.startsWith('drafts.')), 'оба — черновики');
ok(ddReviews.every((d) => /ушло бы в публикацию: ДА/.test(d.notes) && d.wouldAutoPublish === true), 'заметки сообщают, что при auto материал бы вышел');
const upper = await runDeliver([record('u1')], { mode: 'Auto', write: true });
ok(upper.code === 0 && mutations.map((m) => m.createIfNotExists).some((d) => d._type === 'article' && !d._id.startsWith('drafts.')),
  'регистр режима не важен: «Auto» работает как auto');

console.log('\nСухой прогон: ничего не пишется');
mutations.length = 0;
const dry = await runDeliver([record('x1')], { mode: 'auto', write: false });
ok(dry.code === 0 && mutations.length === 0, 'ни одной мутации', JSON.stringify(mutations));
ok(existsSync(join(dry.dir, 'delivery-preview', 'x1.json')), 'превью документа сохранено');

console.log('\nОшибка конфигурации');
const bad = await new Promise((resolve) => {
  const c = spawn('node', [join(HERE, 'deliver.mjs')], { env: { ...process.env, NEWS_PUBLISH_MODE: 'yolo', SANITY_PROJECT_ID: 'p', SANITY_DATASET: 'd' } });
  let o = ''; c.stderr.on('data', (x) => (o += x)); c.on('close', (code) => resolve({ code, o }));
});
ok(bad.code === 2 && /draft и auto/.test(bad.o), 'неизвестный режим отвергается, а не трактуется как auto');

server.close();
console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
