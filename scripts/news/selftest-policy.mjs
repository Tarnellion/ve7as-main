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
import { decide, holdTopics, holdMatches, firstDateIn, eventDateIssue, absenceClaims } from './policy.mjs';

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

console.log('\nЛожные срабатывания списка тем, найденные разбором живых черновиков (27.10.2026)');
const labelsOf = (t) => holdMatches({ event: t });
ok(!hold('Sue Young, Executive Director of Operations, said the licensee failed its duties'), 'имя «Sue» (директор в релизах регулятора) не гражданский иск');
ok(hold('Kalshi will sue the regulator'), 'глагол «sue» по-прежнему держит');
ok(hold('Kalshi sued the regulator') && hold('Operator is suing its former partner'), 'sued / suing держат');
ok(!hold('y qué debería decir, a su juicio, una advertencia'), '«a su juicio» («по его мнению») не процесс');
ok(hold('Comienza el juicio contra el dueño de una casa de apuestas') && hold('Los juicios están previstos para 2028'), '«juicio» как суд держит');
ok(!hold('A mortgage lender sponsored the brick-and-mortar casino and its mortality tables'), 'mortgage / brick-and-mortar / mortality не «смерть»');
ok(hold('Le joueur est mort') && hold('Les morts sont nombreux'), 'французское «mort/morts» по-прежнему держит');
ok(hold('He took his own life after losing') && hold('Bij berichtgeving over suïcide') && hold('Het aantal zelfdoding is gestegen'), 'добавлены формы суицида: took his own life, suïcide, zelfdoding');
ok(labelsOf('The defendants thanked the court')[0]?.why === 'судебное разбирательство', 'defendant — «судебное разбирательство», а не «гражданский иск»');
ok(labelsOf('Los acusados fueron escuchados')[0]?.why === 'судебное разбирательство', 'acusados — «судебное разбирательство», а не «обвинения»');
ok(labelsOf('He pleaded guilty and was sentenced')[0]?.why === 'уголовное производство', 'holdMatches возвращает метку темы')
ok(labelsOf('He pleaded guilty and was sentenced')[0]?.words.includes('guilty'), 'holdMatches возвращает САМО слово — редактор видит, что сработало');
const quoted = clone(good());
quoted.en.text = 'The regulator fined the operator. Sue Young, Executive Director of Operations, said: "Operators must protect players."';
ok(decide(quoted, 'auto').publish, 'релиз регулятора с цитатой «Sue Young» проходит все гейты (раньше удерживался)');

console.log('\nПоправки по ревью: что список обязан продолжать держать');
for (const t of ['Kalshi Plans to Sue Louisiana Regulator', 'OPERATOR TO SUE REGULATOR OVER FINE', 'Players can Sue the operator for refunds', 'The operator will Sue the authority']) {
  ok(hold(t), `«sue» в Title Case / КАПСОМ / после modal держит: ${t}`);
}
for (const t of ['Sue Young and Sue Gray attended the hearing', 'Interview with Sue Smith, head of compliance']) ok(!hold(t), `имя «Sue» не держит: ${t}`);
for (const t of ['La víctima mortal era un jugador', 'Houve três mortos', 'Jogador é encontrado morto', 'Les blessures mortelles', 'Il a été blessé mortellement', 'Giocatore morto',
  'He was mortally wounded', 'The executive passed away last week', 'He lost his life in the crash', 'Murió el presidente del operador', 'Perdió la vida en un accidente']) {
  ok(hold(t), `форма смерти держит: ${t}`);
}
ok(!hold('The mortgage lender, mortality tables and a brick-and-mortar shop'), 'mortgage / mortality / brick-and-mortar по-прежнему не «смерть»');
ok(hold('El empresario acudió a su juicio ayer') && hold('El caso irá a juicio oral'), '«acudió a su juicio» и «irá a juicio» — суд, держит');
ok(!hold('El regulador dijo que sí. A su juicio, la medida es proporcionada.') && !hold('La medida, a juicio de la DGOJ, es proporcionada.'), 'вводные «A su juicio,» / «, a juicio de» — мнение, не суд');

console.log('\nДата события не позже первого упоминания');
const dated = (eventSentence, firstSeen = '2026-10-23T12:28:00Z') => {
  const r = clone(good());
  r.factsParsed.event = eventSentence;
  r.eventMeta.firstSeen = firstSeen;
  return r;
};
ok(codes(decide(dated('On 26 October 2026, President Lula reiterated that betting will not return.'), 'auto')).includes('date-vs-first-seen'),
  'Бразилия: заявление 22.10, а в тексте 26.10 (дата выхода страницы) — держится');
ok(!codes(decide(dated('On 22 October 2026, President Lula reiterated that betting will not return.'), 'auto')).includes('date-vs-first-seen'), 'верная дата проходит');
ok(!codes(decide(dated('On 24 October 2026, the regulator fined an operator.'), 'auto')).includes('date-vs-first-seen'), 'сутки запаса: пояса и ночная публикация не удерживают');
ok(codes(decide(dated('On 25 October the regulator fined an operator.'), 'auto')).includes('date-vs-first-seen'), 'дата без года тоже сверяется (год берётся у первого упоминания)');
ok(!codes(decide(dated('The regulator fined an operator.'), 'auto')).includes('date-vs-first-seen'), 'в предложении нет даты — сверять нечего');
const noFirst = dated('On 26 October 2026 the regulator fined an operator.'); delete noFirst.eventMeta.firstSeen;
ok(codes(decide(noFirst, 'auto')).includes('date-unverifiable') && !codes(decide(noFirst, 'auto')).includes('date-vs-first-seen'),
  'дата в предложении есть, а даты первого упоминания нет — гейт не молчит (раньше пропускал)');
const noFirstNoDate = dated('The regulator fined an operator.'); delete noFirstNoDate.eventMeta.firstSeen;
ok(!codes(decide(noFirstNoDate, 'auto')).some((c) => c.startsWith('date-')), 'нет ни даты в предложении, ни firstSeen — сверять нечего');
const garbageFirst = dated('On 26 October 2026 the regulator fined an operator.', 'garbage');
ok(codes(decide(garbageFirst, 'auto')).includes('date-unverifiable'), 'нечитаемый firstSeen — тоже date-unverifiable');
ok(!codes(decide(dated('Three days before the 25 October runoff, Lula said on 22 October that betting will not return.'), 'auto')).some((c) => c.startsWith('date-')), 'дата после «on» важнее более ранней в предложении (будущий срок не удерживает)');
ok(!codes(decide(dated('From 1 January 2027 operators must register; the rule was announced on 22 October 2026.'), 'auto')).some((c) => c.startsWith('date-')), 'срок «From 1 January 2027» — не дата события');
ok(codes(decide(dated('Since 1 January 2026 the regulator has fined operators; on 26 October 2026 it fined X.'), 'auto')).includes('date-vs-first-seen'), 'ранняя посторонняя дата не прячет неверную дату события («on 26 October»)');
ok(!codes(decide(dated('Операторы may 5 times'), 'auto')).includes('date-vs-first-seen'), '«may 5» с маленькой буквы — не дата');
ok(firstDateIn('The MGA fined an operator on 1 Sept 2026', Date.parse('2026-10-01')) === Date.UTC(2026, 8, 1), 'сокращение месяца и год разбираются');
ok(firstDateIn('Decided on 31 February', Date.parse('2026-10-01')) === null, '31 февраля — не дата');
ok(firstDateIn('Decided on 28 December', Date.parse('2027-01-03')) === Date.UTC(2026, 11, 28), 'декабрьское событие в январской заметке — прошлый год');
ok(eventDateIssue(dated('On 26 October 2026, x.'))?.eventDate === '2026-10-26', 'проблема называет обе даты для заметки редактору');

console.log('\nУтверждение «других источников нет» допустимо, только если прочитаны все издания события');
const claim = (en, es = good().es.text, read = ['a', 'b', 'c'], groups = ['a', 'b', 'c', 'd']) => {
  const r = clone(good());
  r.eventMeta.confirmingGroups = groups; r.eventMeta.voices = groups.length;
  r.fetched = read.map((g) => ({ group: g, chars: 2000 }));
  r.factsParsed.facts[0].sourceGroups = read;
  r.en.text = en; r.es.text = es;
  return r;
};
ok(codes(decide(claim('It offers figures no other source repeats.'), 'auto')).includes('absence-claim'), '«no other source repeats» при непрочитанной группе — держится');
ok(codes(decide(claim('According to Yogonet alone, 85 authorizations lapsed.'), 'auto')).includes('absence-claim'), '«According to Yogonet alone» — держится');
ok(codes(decide(claim('No second source we checked has confirmed it.'), 'auto')).includes('absence-claim'), '«No second source we checked» — держится');
ok(codes(decide(claim('Only Yogonet reports the figure.'), 'auto')).includes('absence-claim'), '«Only Yogonet reports» — держится');
ok(codes(decide(claim('ok.', 'Ninguna otra fuente lo confirma.'), 'auto')).includes('absence-claim'), 'испанское «ninguna otra fuente» — держится');
ok(codes(decide(claim('ok.', 'Solo Yogonet informa de la cifra.'), 'auto')).includes('absence-claim'), 'испанское «Solo Yogonet informa» — держится');
ok(!codes(decide(claim('It offers figures no other source repeats.', undefined, ['a', 'b', 'c', 'd']), 'auto')).includes('absence-claim'), 'прочитаны ВСЕ группы — фраза проверяема и допустима');
ok(!codes(decide(claim('According to Yogonet, 85 authorizations lapsed. The guide itself was not seen.'), 'auto')).includes('absence-claim'), 'атрибуция «по данным X» и честное «не видели» — не отсутствие');
ok(absenceClaims({ en: { text: 'Only a court can decide.' } }).length === 0, '«Only a court» — не издание');

console.log('\nФразы «других источников нет»: расширения по ревью');
const claimMeta = (field, text, read = ['a', 'b', 'c']) => {
  const r = claim('ok.', undefined, read);
  r.en.meta = { ...r.en.meta, [field]: text };
  return r;
};
ok(codes(decide(claimMeta('description', 'The regulator fined an operator EUR 37m, a figure no other source repeats.'), 'auto')).includes('absence-claim'), 'фраза в описании меты ловится (раньше только в теле)');
ok(codes(decide(claimMeta('title', 'Only Yogonet reports the fine'), 'auto')).includes('absence-claim'), 'фраза в заголовке меты ловится');
for (const t of ['Only iGB reported the figure.', 'Only iGaming Business reports the figure.', 'Only Legal Sports Report has reported the figure.', 'According to Focus Gaming News alone, the fine is EUR 5m.',
  'Only one outlet reports the figure.', 'No one else has reported the figure.', 'The figure has not been confirmed elsewhere.', 'It was reported by a single outlet.', 'No second source confirms it.']) {
  ok(codes(decide(claim(t), 'auto')).includes('absence-claim'), `ловится: ${t}`);
}
for (const t of ['Solo Yogonet ha publicado la cifra.', 'Una sola fuente lo cuenta.', 'Otros medios no la recogen.']) {
  ok(codes(decide(claim('ok.', t), 'auto')).includes('absence-claim'), `ловится по-испански: ${t}`);
}
for (const t of ['No other source of income was disclosed.', 'No other reports of fraud were found.', 'There are no other sources of revenue.']) {
  ok(!codes(decide(claim(t), 'auto')).includes('absence-claim'), `не путает с деньгами: ${t}`);
}
ok(!codes(decide(claim('ok.', 'No hay otra fuente de ingresos declarada.'), 'auto')).includes('absence-claim') && !codes(decide(claim('ok.', 'Ningún otro medio de pago está disponible.'), 'auto')).includes('absence-claim'), 'испанские «fuente de ingresos» / «medio de pago» — не издания');

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
