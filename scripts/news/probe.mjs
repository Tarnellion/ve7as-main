#!/usr/bin/env node
/**
 * Проба источников. Ничего не пишет в CMS, не вызывает LLM, не требует токенов.
 *
 * Отвечает на один вопрос, от которого зависит весь новостной конвейер:
 * отвечают ли ленты с того адреса, откуда конвейер будет ходить.
 *
 * Смысл в том, что запуск ЛОКАЛЬНО и запуск в GitHub Actions дают разные ответы:
 * раннеры сидят в датацентровых диапазонах Azure, которые Cloudflare и подобные
 * фильтруют жёстче обычных домашних адресов. Двенадцать источников из
 * первоначального списка уже недоступны так даже с домашнего адреса.
 *
 * Вердикты:
 *   live    — отвечает, есть свежие записи
 *   stale   — отвечает, но самая свежая запись старше STALE_DAYS
 *   empty   — HTTP 200, но ноль записей (так ведут себя мёртвые ленты)
 *   blocked — 403/429/503 или таймаут: типичный ответ фильтра
 *   error   — прочее
 *
 * Ключевая ловушка, ради которой всё это: мёртвая лента НЕ ломается.
 * Она отдаёт 200 и старые записи. Поэтому «HTTP 200» сам по себе ничего не значит.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

const TIMEOUT_MS = 20_000;

/**
 * Порог протухания — свой для каждого слоя, и это не придирка.
 * Отраслевые издания публикуют по нескольку раз в сутки, поэтому неделя молчания
 * у них означает поломку. Регуляторы публикуют решения раз в недели: лента MGA
 * с последней записью 23-дневной давности совершенно здорова, и общий порог в
 * 7 суток пометил бы её протухшей — то есть выкинул бы из ротации самый
 * ценный источник, единственный, которому разрешено быть единственным
 * подтверждением новости.
 */
const STALE_DAYS = { A: 7, B: 60, C: 14 };

/** Постоянный User-Agent со ссылкой на страницу о боте: это и вежливость,
 *  и защита от блокировки — анонимный агент режется охотнее. */
const UA = 'Ve7asNewsBot/0.1 (+https://ve7as.com/en/about/; feed availability probe)';

const { sources } = JSON.parse(readFileSync(join(HERE, 'sources.json'), 'utf8'));

/** Записи ленты: RSS <item> и Atom <entry>. */
const countEntries = (xml) =>
  (xml.match(/<item[\s>]/gi) ?? []).length + (xml.match(/<entry[\s>]/gi) ?? []).length;

/** Самая свежая дата публикации из ленты. */
function latestDate(xml) {
  const dates = [];
  for (const re of [/<pubDate>([^<]+)<\/pubDate>/gi, /<updated>([^<]+)<\/updated>/gi, /<published>([^<]+)<\/published>/gi]) {
    for (const m of xml.matchAll(re)) {
      const d = new Date(m[1].trim());
      if (!Number.isNaN(d.getTime())) dates.push(d);
    }
  }
  return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
}

/** Максимальная длина полного текста — есть ли что рерайтить вообще. */
function maxFullText(xml) {
  let max = 0;
  for (const re of [/<content:encoded>([\s\S]*?)<\/content:encoded>/gi, /<content[^>]*>([\s\S]*?)<\/content>/gi]) {
    for (const m of xml.matchAll(re)) {
      const text = m[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
      if (text.length > max) max = text.length;
    }
  }
  return max;
}

async function probe(src) {
  const started = Date.now();
  const base = { id: src.id, layer: src.layer, lang: src.lang, url: src.url, group: src.independenceGroup };
  try {
    const res = await fetch(src.url, {
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ms = Date.now() - started;
    const body = await res.text();

    if (!res.ok) {
      const verdict = [403, 429, 503].includes(res.status) ? 'blocked' : 'error';
      return { ...base, status: res.status, ms, entries: 0, ageDays: null, fullText: 0, verdict };
    }

    if (src.kind === 'html') {
      // У UKGC ленты нет — считаем ссылки на страницы решений в листинге.
      const links = (body.match(/href="[^"]*\/news\/[^"]*"/gi) ?? []).length;
      return { ...base, status: res.status, ms, entries: links, ageDays: null, fullText: 0,
               verdict: links > 0 ? 'live' : 'empty' };
    }

    const entries = countEntries(body);
    const latest = latestDate(body);
    const ageDays = latest ? (Date.now() - latest.getTime()) / 86_400_000 : null;
    const fullText = maxFullText(body);

    const staleAfter = STALE_DAYS[src.layer] ?? 7;
    let verdict = 'live';
    if (entries === 0) verdict = 'empty';
    else if (ageDays !== null && ageDays > staleAfter) verdict = 'stale';

    return { ...base, status: res.status, ms, entries, ageDays, fullText, verdict };
  } catch (e) {
    const ms = Date.now() - started;
    const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return { ...base, status: 0, ms, entries: 0, ageDays: null, fullText: 0,
             verdict: timedOut ? 'blocked' : 'error', error: String(e?.message ?? e).slice(0, 120) };
  }
}

const where = process.env.GITHUB_ACTIONS ? 'GitHub Actions (датацентр)' : 'локально';
console.log(`Проба ${sources.length} источников — ${where}\n`);

const results = [];
for (const src of sources) {
  const r = await probe(src);
  results.push(r);
  const age = r.ageDays === null ? '—' : `${r.ageDays.toFixed(1)} сут`;
  const ft = r.fullText ? `${r.fullText}` : '—';
  console.log(
    `  ${r.verdict.padEnd(8)} ${String(r.status).padStart(3)}  ${String(r.entries).padStart(3)} зап.  ` +
    `свежесть ${age.padStart(9)}  текст ${ft.padStart(6)}  ${String(r.ms).padStart(5)} мс  ${r.id}`
  );
}

const by = (v) => results.filter((r) => r.verdict === v);
console.log(`\n  live ${by('live').length} · stale ${by('stale').length} · empty ${by('empty').length} · blocked ${by('blocked').length} · error ${by('error').length}`);

// Контрольный образец обязан быть распознан как протухший — иначе детектор сломан.
const control = results.find((r) => r.id === 'calvinayre_control');
if (control && !['stale', 'empty', 'blocked', 'error'].includes(control.verdict)) {
  console.error(`\n  ПРОВАЛ САМОПРОВЕРКИ: контрольная протухшая лента распознана как «${control.verdict}».`);
  console.error('  Детектор свежести не работает — цифрам ниже верить нельзя.');
  process.exitCode = 1;
} else if (control) {
  console.log(`  самопроверка: контрольная лента распознана как «${control.verdict}» — детектор работает`);
}

// Живые группы независимости: правило «два источника» считается по ним, а не по лентам.
const liveGroups = new Set([...by('live'), ...by('stale')].filter((r) => r.verdict === 'live').map((r) => r.group));
console.log(`  живых групп независимости: ${liveGroups.size} из ${new Set(sources.map((s) => s.independenceGroup)).size}`);

mkdirSync(join(ROOT, '.pipeline'), { recursive: true });
const stamp = new Date().toISOString();
writeFileSync(join(ROOT, '.pipeline', 'probe.json'), JSON.stringify({ at: stamp, where, results }, null, 2));

const rows = results
  .map((r) => `| ${r.id} | ${r.layer} | ${r.lang} | ${r.verdict} | ${r.status} | ${r.entries} | ${r.ageDays === null ? '—' : r.ageDays.toFixed(1)} | ${r.fullText || '—'} | ${r.group} |`)
  .join('\n');
writeFileSync(join(ROOT, '.pipeline', 'probe-report.md'),
`# Проба источников — ${stamp}

Запуск: **${where}**

Живых групп независимости: **${liveGroups.size}** из ${new Set(sources.map((s) => s.independenceGroup)).size}.
Правило подтверждения считается по группам, а не по лентам: четыре ленты SBC — один голос.

| источник | слой | язык | вердикт | HTTP | записей | свежесть, сут | текст, зн. | группа |
|---|---|---|---|---|---|---|---|---|
${rows}
`);
console.log('\n  отчёт: .pipeline/probe-report.md');
