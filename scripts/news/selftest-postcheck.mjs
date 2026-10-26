#!/usr/bin/env node
/**
 * Регрессионные тесты постпроверки. Строки взяты из НАСТОЯЩИХ провалов первого
 * боевого прогона автоматической цепочки (26.10.2026): каждая — то, что модель
 * реально вписала в статью, и что без этих проверок ушло бы на сайт.
 *
 *   node scripts/news/selftest-postcheck.mjs
 */
import { postcheck, translationFidelity } from './postcheck.mjs';

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

console.log(failed ? `\nПРОВАЛЕНО: ${failed}\n` : '\nВсе проверки пройдены.\n');
process.exit(failed ? 1 : 0);
