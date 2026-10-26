#!/usr/bin/env node
/**
 * Регрессионные тесты постпроверки. Строки взяты из НАСТОЯЩИХ провалов первого
 * боевого прогона автоматической цепочки (26.10.2026): каждая — то, что модель
 * реально вписала в статью, и что без этих проверок ушло бы на сайт.
 *
 *   node scripts/news/selftest-postcheck.mjs
 */
import { postcheck, translationFidelity, metaCheck } from './postcheck.mjs';

let failed = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${!cond && detail ? ` — ${detail}` : ''}`);
  if (!cond) failed++;
};

// Тело нормальной длины и ритма, к которому дописывают дефекты.
// Предложение ~28 слов: чистый текст обязан укладываться в пределы объёма, иначе тест
// проверяет не то, что заявлено.
const para = (n) => Array.from({ length: n }, (_, i) => `The regulator announced decision number ${i} on 20 October 2026 after reviewing the operator's records, interviewing staff and comparing player complaints filed over the previous eighteen months.`).join(' ');
const clean = [para(2), para(1), para(4), para(1), para(3), para(1), para(2), para(4), para(1)].join('\n\n');
const kinds = (r) => r.issues.map((i) => i.kind);

console.log('\nЧистый текст');
const base = postcheck(clean, 'en');
ok(base.ok, 'проходит без замечаний', JSON.stringify(base.issues));

console.log('\nНастоящие провалы прогона');
const cases = [
  ['строка о проверке редактором (<small>)', '\n\n<small>This article was prepared with AI assistance and reviewed by the Ve7as editorial team.</small>'],
  ['та же строка без HTML', '\n\nThis article was prepared with AI assistance and reviewed by the Ve7as editorial team.'],
  ['служебная записка по-русски', '\n\n*Примечание для редакции (не для публикации):*\n\n- **Блокер: материал не проходит постпроцессор.**'],
  ['пометка «not for publication»', '\n\nEditor note: this draft is not for publication until a second source appears.'],
  ['испанская пометка об ИИ', '\n\nElaborado con ayuda de IA y revisado por el equipo editorial.'],
  ['испанская записка редакции', '\n\nNota para la redacción: falta una segunda fuente.'],
];
for (const [label, tail] of cases) {
  const r = postcheck(clean + tail, label.includes('испан') ? 'es' : 'en');
  ok(!r.ok && kinds(r).includes('служебное'), label, JSON.stringify(r.issues.map((i) => i.detail.slice(0, 60))));
}

console.log('\nЛожные срабатывания не должны появляться');
const benign = clean.replace('regulator', 'Malta Gaming Authority') + '\n\nThe AI-powered tools the operator uses are not covered by the decision.';
ok(postcheck(benign, 'en').ok, '«AI-powered» в фактах про оператора — не пометка о подготовке текста',
  JSON.stringify(postcheck(benign, 'en').issues));
ok(postcheck(clean + '\n\nThe fine is below 5 000 EUR and above 1 000 EUR.', 'en').ok, 'знаки сравнения в тексте — не HTML');

console.log('\nОбъём: короткая новость на тонком источнике допустима');
const short = [para(2), para(1), para(3), para(1), para(2), para(1), para(2)].join('\n\n');
const rs = postcheck(short, 'en');
ok(rs.words >= 250 && !rs.issues.some((i) => i.kind === 'объём'), `${rs.words} слов не режутся по объёму`, JSON.stringify(rs.issues.filter((i) => i.kind === 'объём')));

console.log('\nПеревод: структура вместо ритма');
// Те же 9 абзацев, но предложения склеены — ритм ES «хуже», структура цела.
const esMerged = [para(1), para(1), para(2), para(1), para(2), para(1), para(1), para(2), para(1)].join('\n\n');
const esRhythm = postcheck(esMerged, 'es');
ok(!esRhythm.issues.some((i) => i.kind === 'ритм'), 'ритм у испанской версии не меряется (пороги откалиброваны на английском)', JSON.stringify(esRhythm.issues));
ok(postcheck(esMerged, 'en').issues.some((i) => i.kind === 'ритм'), 'тот же текст как английский по ритму проваливается — проверка жива');
ok(translationFidelity(clean, clean.replace(/regulator/g, 'regulador')).length === 0, 'верный перевод проходит проверку структуры');
const lostPara = clean.split('\n\n').slice(0, -2).join('\n\n');
ok(translationFidelity(clean, lostPara).some((i) => i.detail.includes('абзацев')), 'потерянные абзацы ловятся');
const half = clean.split('\n\n').map((p, i) => (i % 2 ? p : p.split(' ').slice(0, 6).join(' ') + '.')).join('\n\n');
ok(translationFidelity(clean, half).some((i) => i.detail.includes('объём')), 'обрезанный перевод (объём ×0.5) ловится');
const padded = clean.split('\n\n').map((p) => p + ' ' + p).join('\n\n');
ok(translationFidelity(clean, padded).some((i) => i.detail.includes('объём')), 'раздутый перевод (объём ×2) ловится');

console.log('\nСсылки, картинки и адреса: рендерер markdown их пропускает, поэтому ловим здесь');
for (const [label, tail, hit] of [
  ['markdown-ссылка', '\n\nSee [the site](https://x.com) for details.', true],
  ['картинка', '\n\n![a](http://x/y.png)', true],
  ['голый адрес со схемой', '\n\nDetails at https://example.com/page now.', true],
  ['адрес с www', '\n\nVisit www.example.com for more.', true],
  ['просто название сайта без схемы', '\n\nThe operator ran skyhills.com among others.', false],
]) {
  const r = postcheck(clean + tail, 'en');
  ok(r.issues.some((i) => i.kind === 'ссылки') === hit, `${hit ? 'ловится' : 'не ловится'}: ${label}`, JSON.stringify(r.issues.map((i) => i.kind)));
}

console.log('\nЧисла перевода: подмена цифры внутри нормального по форме текста');
const enN = 'The fine is EUR 37,000,000 announced on 22 October 2026. Turnover reached 1 250 000 euros. 11 sites were named.';
const esCases = [
  ['верный перевод, три записи разделителей тысяч', 'La multa es de 37.000.000 euros anunciada el 22 de octubre de 2026. La facturación alcanzó 1.250.000 euros. Se nombraron 11 sitios.', false],
  ['подмена 37 на 73', 'La multa es de 73.000.000 euros anunciada el 22 de octubre de 2026. La facturación alcanzó 1.250.000 euros. Se nombraron 11 sitios.', true],
  ['потеряна дата', 'La multa es de 37.000.000 euros. La facturación alcanzó 1.250.000 euros. Se nombraron 11 sitios.', true],
  ['число добавлено из воздуха', 'La multa es de 37.000.000 euros anunciada el 22 de octubre de 2026. La facturación alcanzó 1.250.000 euros. Se nombraron 11 sitios y 45 usuarios.', true],
];
for (const [label, es, hit] of esCases) {
  const found = translationFidelity(enN, es).some((i) => i.detail.startsWith('числа'));
  ok(found === hit, `${hit ? 'ловится' : 'проходит'}: ${label}`);
}

console.log('\nМета: служебные пометки в читательском поле');
const M = (title, description, lang = 'en') => metaCheck({ title, description }, lang);
const realFail = M('Dutch regulator fines unlicensed operator EUR 37m',
  'The Dutch regulator fined an operator for offering games without a licence. The EUR 37m figure is only in the headline. Not verified.');
ok(!realFail.ok && realFail.issues.some((i) => i.kind === 'статус-проверки' && i.field === 'description'),
  'настоящая строка прогона: «Not verified.» в конце описания ловится', JSON.stringify(realFail.issues));
ok(realFail.issues.every((i) => i.field === 'description'), 'замечание указывает поле (description), заголовок чист');
for (const [label, title, description, lang] of [
  ['unconfirmed', 'Regulator fines operator', 'Unconfirmed reports say an operator was fined EUR 37m.', 'en'],
  ['unverified', 'Unverified: operator fined', 'The Dutch regulator fined an operator.', 'en'],
  ['is not verified', 'Operator fined', 'The fine of EUR 37m is not verified.', 'en'],
  ['has not been confirmed', 'Operator fined', 'The figure has not been independently confirmed.', 'en'],
  ['пометка без точки перед ней', 'Operator fined', 'The Dutch regulator fined an operator EUR 37m for offering games without a licence - not verified', 'en'],
  ['пометка через запятую', 'Operator fined', 'The Dutch regulator fined an operator EUR 37m, not confirmed.', 'en'],
  ['пометка в скобках', 'Operator fined', 'The Dutch regulator fined an operator EUR 37m (not verified).', 'en'],
  ['single source', 'Operator fined', 'Single-source report on a fine of EUR 37m.', 'en'],
  // Настоящие строки из черновиков Sanity после боевого прогона 40410013715 (26.10.2026).
  ['реальная ES-мета KSA: «no está verificado todavía»', 'Multa de la Ksa a EOD Code por casinos sin licencia', 'El regulador neerlandés Ksa sanciona a EOD Code por ofrecer 12 sitios de juego sin licencia. El importe de 37 M€ no está verificado todavía.', 'es'],
  ['реальная ES-мета: «solo aparece en el titular»', 'Multa de la Ksa a EOD Code', 'La Ksa multa a EOD Code por casinos sin licencia. La cifra de 37 M€ solo aparece en el titular.', 'es'],
  ['реальная EN-мета: «reported amount unconfirmed»', 'Ksa fines EOD Code over unlicensed Dutch casino sites', 'Dutch regulator Ksa fined EOD Code SRL for unlicensed casino games. Decision not yet public; reported amount unconfirmed.', 'en'],
  ['реальная ES-мета: «repasamos las fuentes»', 'Brasil prohíbe las apuestas de cuota fija', 'La Medida Provisória 1.394 prohíbe las apuestas de cuota fija en Brasil; repasamos las fuentes.', 'es'],
  ['«only in the headline»', 'Operator fined', 'The Dutch regulator fined an operator. The figure of EUR 37m appears only in the headline.', 'en'],
  ['«we checked the sources»', 'Operator fined', 'We checked the sources: the Dutch regulator fined an operator.', 'en'],
  ['sin confirmar', 'Multa sin confirmar a un operador', 'El regulador multó a un operador.', 'es'],
  ['no verificado', 'Multa a un operador', 'La cifra de 37 millones, no verificado.', 'es'],
  ['fuente única', 'Multa a un operador', 'Dato de fuente única sobre una multa de 37 millones.', 'es'],
  ['prepared with AI', 'Operator fined', 'Prepared with AI assistance from public sources.', 'en'],
  ['кириллица', 'Operator fined', 'Заметка редактора: проверить сумму.', 'en'],
  ['markdown-ссылка', 'Operator fined', 'See [the notice](https://x.com/a) for the fine.', 'en'],
  ['HTML', 'Operator <small>fined</small>', 'The Dutch regulator fined an operator.', 'en'],
]) {
  const r = M(title, description, lang);
  ok(!r.ok, `ловится: ${label}`, JSON.stringify(r.issues));
}
for (const [label, title, description, lang] of [
  ['чистая мета', 'Dutch regulator fines operator EUR 37m', 'The Dutch regulator fined an operator EUR 37m for offering games without a licence, the largest such penalty on record in the country.', 'en'],
  ['оговорка атрибуцией', 'Operator fined EUR 37m', 'The KSA says the fine is EUR 37m. The operator has not confirmed the figure or said whether it will appeal.', 'en'],
  ['то же по-испански', 'Multa de 37 millones a un operador', 'El regulador dice que la multa es de 37 millones; el operador no ha confirmado la cifra.', 'es'],
  ['пассив с «by»: атрибуция', 'Operator fined EUR 37m', 'The fine of EUR 37m is not confirmed by the operator, which has not said whether it will appeal.', 'en'],
  ['испанская атрибуция «por»', 'Multa a un operador', 'La cifra no ha sido confirmada por el operador, que no dijo si apelará.', 'es'],
  ['реальная мета MGA: нехватка текста — факт о событии, а не пометка', 'MGA and MCCAA Sign Player Protection Memorandum', "Malta's MGA and MCCAA signed a memorandum on consumer affairs and player protection on 23 October 2026. Text is unpublished; procedures remain unclear.", 'en'],
  ['реальная ES-мета MGA', 'MGA y MCCAA firman memorando sobre protección del jugador', 'El 23 de octubre de 2026 la MGA y la MCCAA de Malta firmaron memorando para coordinar reclamaciones y protección del jugador. El texto no se ha publicado.', 'es'],
  ['«aún no confirmado por el regulador»: атрибуция', 'Multa a un operador', 'La cifra de 37 millones aún no ha sido confirmada por el regulador.', 'es'],
  ['название сайта без схемы', 'Operator fined', 'The regulator named skyhills.com among the sites it fined.', 'en'],
]) {
  const r = M(title, description, lang);
  ok(r.ok, `проходит: ${label}`, JSON.stringify(r.issues));
}
ok(metaCheck(null, 'en').ok && metaCheck({}, 'en').ok, 'нет меты (null/пусто) — это не нарушение правил, а отказ полноты выше по цепочке');
// В ТЕКСТЕ та же фраза — нормальная атрибуция неопределённости; список статусов к телу не применяется.
ok(postcheck(clean + '\n\nThe operator has not confirmed the figure, and the amount is not verified by a second publication.', 'en').ok,
  'в теле «not verified» не считается нарушением (там это законная оговорка)');

console.log('\nНезависимое ревью: пропуски и ложные срабатывания (скептики воспроизвели каждый)');
const D = (text, lang = 'en') => !metaCheck({ title: 'Operator fined', description: text }, lang).ok;
// Пропуски. Часть — из-за \b перед «ú» без флага u: «Única fuente» не ловилось вовсе.
for (const [text, lang] of [
  ['Fine of EUR 2m. Not verified yet.', 'en'], ['Fine of EUR 2m. Not confirmed yet.', 'en'], ['Fine of EUR 2m. Not verified so far.', 'en'],
  ['Fine of EUR 2m. Not verified…', 'en'], ['Fine of EUR 2m. "Not verified"', 'en'], ['Fine of EUR 2m. *Not verified*', 'en'],
  ['Fine of EUR 2m. **Not verified**', 'en'], ['Fine of EUR 2m. _Not verified_', 'en'], ['Fine of EUR 2m. Not-verified.', 'en'],
  ['Fine of EUR 2m. Non-verified.', 'en'], ['Fine of EUR 2m. Not fully verified.', 'en'], ['Fine of EUR 2m. Not officially confirmed.', 'en'],
  ['Fine of EUR 2m. Not verified in the source.', 'en'],
  ['Fine of EUR 2m. Pending verification.', 'en'], ['Fine of EUR 2m. Awaiting confirmation.', 'en'], ['Fine of EUR 2m. Per our review.', 'en'],
  ['Fine of EUR 2m. Yet to be verified.', 'en'], ["Fine of EUR 2m. Isn't verified.", 'en'], ["Fine of EUR 2m. Can't be verified.", 'en'],
  ["Fine of EUR 2m. Couldn't be confirmed.", 'en'], ["Fine of EUR 2m. Hasn't been verified.", 'en'], ['Fine of EUR 2m. We were unable to verify the figure.', 'en'],
  // Самоссылка: атрибуция «by …» законна только третьему лицу.
  ['Fine of EUR 2m. The figure is not verified by us.', 'en'], ['Fine of EUR 2m. Not verified by our team.', 'en'], ['Fine of EUR 2m. Verified by Ve7as.', 'en'],
  ['Fine of EUR 2m. Fact-checked by our team.', 'en'], ['Fine of EUR 2m. Checked by our editors.', 'en'], ['Fine of EUR 2m. Reviewed by our editorial team.', 'en'],
  ['Multa de 2 M€ al operador. Única fuente.', 'es'], ['Según una única fuente, el regulador multó al operador.', 'es'],
  ['Multa de 2 M€ al operador. Sólo una fuente.', 'es'], ['Multa de 2 M€. La cifra no ha sido verificada por nuestro equipo.', 'es'],
  ['Multa de 2 M€. Aún no verificado por nuestro equipo.', 'es'], ['Multa de 2 M€. Verificado por Ve7as.', 'es'],
  ['Multa de 2 M€. Comprobado por nuestra redacción.', 'es'], ['Multa de 2 M€. Verificación pendiente.', 'es'],
  ['Multa de 2 M€. Pendiente de verificación.', 'es'], ['Multa de 2 M€. A la espera de confirmación.', 'es'],
  ['Multa de 2 M€. Por confirmar.', 'es'], ['Multa de 2 M€. Sin contrastar.', 'es'], ['Multa de 2 M€. No se pudo verificar la cifra.', 'es'],
  ['Multa sin confirmar a un operador neerlandés.', 'es'],
]) ok(D(text, lang), `ловится: ${text}`);

// Законное: атрибуция третьему лицу, деловые обороты, KYC-тема отрасли.
for (const [text, lang] of [
  ['Not confirmed by the operator, the fine of EUR 2m was announced on Monday.', 'en'],
  ['The fine of EUR 2m is not confirmed by the operator.', 'en'],
  ['The ruling is pending confirmation by the senate.', 'en'],
  ['Awaiting confirmation from the court, the club stays in the league.', 'en'],
  ['Verified accounts get higher withdrawal limits at the operator.', 'en'],
  ['The fine of EUR 2m was confirmed by the regulator on Monday.', 'en'],
  ["The regulator fined the casino for failing to verify players' age.", 'en'],
  ['The single source of truth for odds is the data feed.', 'en'],
  ['Only one source of funds was declared by the operator.', 'en'],
  ['La cifra no ha sido confirmada por el regulador.', 'es'],
  ['Multa por no verificar la edad de los jugadores.', 'es'],
  ['Multa a un casino por operar sin verificar la identidad de sus clientes.', 'es'],
  ['La única fuente de ingresos del casino son las tragaperras.', 'es'],
  ['La segunda fuente de ingresos del casino es el póquer.', 'es'],
  ['La cifra está pendiente de verificación por el regulador.', 'es'],
]) ok(!D(text, lang), `проходит: ${text}`);

console.log('\nReDoS: новые шаблоны на враждебном входе в 100 КБ');
for (const [label, unit] of [['not ', 'not '], ['un', 'un'], ['пробелы', ' '], ['not-', 'not-'], ['sin ', 'sin '], ['a la espera ', 'a la espera ']]) {
  const big = unit.repeat(Math.ceil(100000 / unit.length));
  const t0 = process.hrtime.bigint();
  metaCheck({ title: 'x', description: big }, 'en'); metaCheck({ title: 'x', description: big }, 'es');
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  ok(ms < 1000, `100 КБ «${label}»: ${ms.toFixed(0)} мс (предел 1000)`);
}

console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
