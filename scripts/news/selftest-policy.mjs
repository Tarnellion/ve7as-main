#!/usr/bin/env node
/**
 * Проверка гейтов политики. Каждый гейт ломается по отдельности на заведомо
 * хорошей записи: если запись с одним дефектом всё равно проходит, гейт мёртв,
 * и узнаёшь об этом, когда он уже должен был сработать.
 *
 * Отдельный блок — «обходы», найденные ревью перед запуском: каждый воспроизведён
 * рецензентами скриптом-пробой на прежней политике и там давал publish=true.
 *
 *   node scripts/news/selftest-policy.mjs
 */
import { decide, holdTopics } from './policy.mjs';

let failed = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) failed++;
};

const checkOk = { ok: true, issues: [] };
const verdict = () => ({ ok: true, namesPrivateIndividuals: false, individuals: [], blockers: [], notes: '' });
const good = () => ({
  live: true,
  event: 'KSA imposes record fine on unlicensed operator',
  factsParsed: {
    event: 'The Dutch regulator fined an operator EUR 37 million',
    facts: [{ statement: 'KSA fined the operator EUR 37 million on 20 October 2026', attribution: 'regulator', sourceGroups: ['a', 'b', 'c'] }],
    unconfirmed: [],
  },
  eventMeta: { verdict: 'confirmed', confirmingGroups: ['a', 'b', 'c'], voices: 3 },
  fetched: [{ group: 'a', chars: 2000 }, { group: 'b', chars: 2100 }, { group: 'c', chars: 1900 }],
  truncated: {},
  verify: verdict(),
  verifyEs: verdict(),
  en: { text: 'The regulator fined an operator for offering games without a licence.', check: checkOk, meta: { title: 'T', description: 'D', slug: 'ksa-record-fine', section: 'casino-slots' } },
  es: { text: 'El regulador multó a un operador por ofrecer juegos sin licencia.', check: checkOk, meta: { title: 'T', description: 'D', slug: 'ksa-multa-record' } },
});
const clone = (o) => JSON.parse(JSON.stringify(o));
const codes = (r) => r.reasons.map((x) => x.code);
const quiet = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn(); } finally { console.warn = w; } };

console.log('\nЭталонная запись');
const base = decide(good(), 'auto');
ok(base.publish && base.eligible && base.reasons.length === 0, 'проходит все гейты в режиме auto', JSON.stringify(base.reasons));
const asDraft = decide(good(), 'draft');
ok(!asDraft.publish && asDraft.eligible, 'в режиме draft не публикуется, но «прошёл бы» = да');
ok(codes(asDraft).includes('mode'), 'причина «режим draft» названа');

console.log('\nКаждый гейт по отдельности (режим auto)');
const cases = [
  ['not-live', (r) => { r.live = false; }],
  ['truncated', (r) => { r.truncated.draft = true; }],
  ['check-en', (r) => { r.en.check = { ok: false, issues: [{ kind: 'ритм' }] }; }],
  ['check-es', (r) => { r.es.check = null; }],
  ['verify-missing', (r) => { r.verify = null; }],
  ['verify', (r) => { r.verify.ok = false; }],
  ['blockers', (r) => { r.verify.blockers = [{ kind: 'invented', quote: 'x', problem: 'y' }]; }],
  ['named-individuals', (r) => { r.verify.namesPrivateIndividuals = true; r.verify.individuals = ['A B']; }],
  ['verify-es-missing', (r) => { r.verifyEs = null; }],
  ['verify-es', (r) => { r.verifyEs.ok = false; }],
  ['blockers-es', (r) => { r.verifyEs.blockers = [{ kind: 'overstated', quote: 'récord', problem: 'y' }]; }],
  ['named-individuals-es', (r) => { r.verifyEs.namesPrivateIndividuals = true; }],
  ['groups', (r) => { r.eventMeta.confirmingGroups = ['a', 'b']; }],
  ['retrieval-missing', (r) => { delete r.fetched; }],
  ['retrieval', (r) => { r.fetched = [{ group: 'a', chars: 2000 }]; }],
  ['source-suspicious', (r) => { r.fetched[0].suspicious = true; }],
  ['no-facts', (r) => { r.factsParsed.facts = []; }],
  ['facts-unconfirmed', (r) => { r.factsParsed.facts[0].sourceGroups = ['a']; }],
  ['duplicate', (r) => { r.eventMeta.nearDuplicateOf = 'abc123'; }],
  ['hold-topic', (r) => { r.factsParsed.facts[0].statement = 'He was sentenced to 10 months'; }],
  ['meta-en', (r) => { r.en.meta.slug = 'Bad Slug!'; }],
  ['meta-es', (r) => { r.es.meta.title = ''; }],
  ['section', (r) => { r.en.meta.section = 'other'; }],
  // Настоящий провал боевого прогона: мета-описание кончалось служебной пометкой, а гейт `meta-*` проверял только полноту.
  ['meta-check-en', (r) => { r.en.meta.description = 'The Dutch regulator fined an operator. The EUR 37m figure is only in the headline. Not verified.'; }],
  ['meta-check-es', (r) => { r.es.meta.title = 'Multa récord, sin confirmar'; }],
];
for (const [code, mutate] of cases) {
  const r = clone(good()); mutate(r);
  const d = decide(r, 'auto');
  ok(!d.publish && !d.eligible && codes(d).includes(code), `закрывает: ${code}`, JSON.stringify(codes(d)));
}

console.log('\nМета: те же правила, что у текста');
const metaOnly = (mutate) => { const r = clone(good()); mutate(r); return codes(decide(r, 'auto')); };
ok(metaOnly((r) => { r.en.meta.title = 'Ключ: not for publication'; }).includes('meta-check-en'), 'кириллица и пометка «not for publication» в заголовке');
ok(metaOnly((r) => { r.en.meta.description = 'Details at https://example.com/fine now.'; }).includes('meta-check-en'), 'ссылка в описании');
ok(metaOnly((r) => { r.es.meta.description = 'Multa a un operador <b>récord</b> en octubre.'; }).includes('meta-check-es'), 'HTML в описании');
ok(metaOnly((r) => { r.es.meta.description = 'Elaborado con ayuda de IA y revisado por el equipo editorial.'; }).includes('meta-check-es'), 'испанская пометка о подготовке');
ok(metaOnly((r) => { r.en.meta.description = 'Awaiting a second source before this is confirmed.'; }).includes('meta-check-en'), 'ожидание второго источника');
ok(!metaOnly((r) => { r.en.meta.description = 'The KSA says the fine is EUR 37m. The operator has not confirmed the figure.'; }).some((c) => c.startsWith('meta-check')),
  'оговорка атрибуцией («the operator has not confirmed») — законная, не пометка');
ok(!metaOnly((r) => { r.es.meta.description = 'El regulador dice que la multa es de 37 millones; el operador no ha confirmado la cifra.'; }).some((c) => c.startsWith('meta-check')),
  'то же по-испански («no ha confirmado»)');
ok(metaOnly((r) => { r.en.meta = null; }).includes('meta-en'), 'мета не разобрана (null) — закрыта прежним гейтом полноты, не падением');

console.log('\nОбходы, найденные ревью (на прежней политике каждый давал publish=true)');
const synd = clone(good()); synd.eventMeta = { verdict: 'confirmed', confirmingGroups: ['a', 'b', 'c'], voices: 2 };
ok(!decide(synd, 'auto').publish && codes(decide(synd, 'auto')).includes('groups'),
  'три группы, но два голоса (синдикация) — это не «три независимых издания»');

const noRead = clone(good()); noRead.fetched = [{ group: 'a', chars: 2000 }, { group: 'b', chars: 100 }, { group: 'c', chars: 50 }];
ok(codes(decide(noRead, 'auto')).includes('retrieval'), 'три группы подтверждены кластером, а прочитана одна: тексты 100 и 50 символов не считаются');

const allUnconf = clone(good()); allUnconf.factsParsed.facts = []; allUnconf.factsParsed.unconfirmed = ['Operator X launched slot Y (one outlet)'];
ok(codes(decide(allUnconf, 'auto')).includes('no-facts'), 'всё из одного источника (основной список пуст) — не публикуется');

const nullFacts = clone(good()); nullFacts.factsParsed = null;
ok(!decide(nullFacts, 'auto').publish, 'факты не разобраны (null) — не публикуется');

// Слова-ловушки живут не только в извлечённых фактах: тема может прийти в итоговом тексте или в оригинале заголовка.
const inBody = clone(good()); inBody.en.text = 'Operator founder was found guilty of fraud last week.';
ok(codes(decide(inBody, 'auto')).includes('hold-topic'), 'приговор есть только в итоговом английском тексте — ловится');
const inEs = clone(good()); inEs.es.text = 'El fundador fue condenado a prisión.';
ok(codes(decide(inEs, 'auto')).includes('hold-topic'), 'приговор есть только в испанском тексте — ловится');
const inOriginal = clone(good()); inOriginal.event = 'Oprichter van aanbieder veroordeeld tot gevangenisstraf';
ok(codes(decide(inOriginal, 'auto')).includes('hold-topic'), 'нидерландский оригинал заголовка («veroordeeld») — ловится');

console.log('\nКлючевые слова: что держит и что не должно');
const hold = (s) => holdTopics({ event: s }).length > 0;
for (const s of ['Operator founder found guilty of fraud', 'Kalshi sues Louisiana regulator', 'Player died after a dispute',
  'El empresario fue condenado a prisión', 'Der Betreiber wurde verurteilt', 'Le fondateur a été condamné', 'Operator accused of rigging games']) {
  ok(hold(s), `держит: ${s}`);
}
for (const s of ['The MGA fined the licensee EUR 5 million for AML failures after an investigation',
  'Nieuwe recordboete illegaal kansspelaanbod opgelegd: 37 miljoen voor EOD Code', 'Operator pays a licence fee of EUR 5 million']) {
  ok(!hold(s), `не держит: ${s.slice(0, 70)}`);
}

console.log('\nГраницы и переменные окружения');
const regulator = clone(good());
regulator.eventMeta = { verdict: 'regulator-primary', confirmingGroups: ['ukgc'], voices: 1 };
regulator.fetched = [{ group: 'ukgc', chars: 2000 }];
regulator.factsParsed.facts[0].sourceGroups = ['ukgc'];
ok(decide(regulator, 'auto').publish, 'регулятор-первоисточник проходит с одной группой, если его текст прочитан');

const tight = clone(good()); tight.eventMeta.confirmingGroups = ['a', 'b']; tight.eventMeta.voices = 2;
ok(!quiet(() => decide(tight, 'auto', { NEWS_AUTO_MIN_GROUPS: '2' })).publish,
  'порог ниже трёх переменной НЕ опускается: публичный текст обещает «не менее трёх»');
ok(!quiet(() => decide(good(), 'auto', { NEWS_AUTO_MIN_GROUPS: '4' })).publish, 'порог можно поднять: три голоса при требовании четырёх — не публикуется');
ok(quiet(() => decide(good(), 'auto', { NEWS_AUTO_MIN_GROUPS: 'three' })).publish,
  'опечатка в пороге («three») не отключает проверку: берётся значение по умолчанию, а не NaN');
tight.eventMeta.confirmingGroups = ['a', 'b'];
ok(!quiet(() => decide(tight, 'auto', { NEWS_AUTO_MIN_GROUPS: '' })).publish, 'пустая переменная — значение по умолчанию (3)');

console.log('\nСтарая запись без нового формата');
const legacy = { live: true, event: 'x', en: { check: checkOk }, es: { check: checkOk } };
const dl = decide(legacy, 'auto');
ok(!dl.publish, 'запись прошлых прогонов без verify/eventMeta/fetched не публикуется', JSON.stringify(codes(dl)));

console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
