#!/usr/bin/env node
/**
 * Пре-шип гейт данных лотерейного калькулятора.
 *
 * Запускается руками перед деплоем инструмента, как замеры блэкджека:
 *   node --experimental-strip-types scripts/verify-lottery-data.mjs
 *
 * Проверяет три разных класса утверждений, и это не одно и то же:
 *   1. ОDDS каждого тира пересчитываются из гипергеометрики и сверяются
 *      с официальным чартом. Здесь математика первична, чарт — перекрёстная
 *      проверка: если они расходятся, ошибка либо в наборе шаров, либо
 *      в переписанной константе, и то и другое ломает инструмент.
 *   2. ВНУТРЕННЯЯ согласованность пресетов: сумма долей призового фонда,
 *      полнота распределения множителя, заявленные overall odds.
 *   3. ПРИЁМОЧНЫЙ сценарий из ТЗ целиком: EV = −$1.26 и порог
 *      безубыточности ≈ $1.82 млрд. Это защита от «улучшений» формулы,
 *      которые тихо меняют ответ.
 *
 * Выходной код ненулевой при любом расхождении больше допуска — скрипт
 * пригоден для CI, хотя сейчас вызывается вручную.
 */
import { PRESETS, POWERBALL, MEGA_MILLIONS, EUROMILLIONS, ACCEPTANCE } from '../src/data/lottery-ev.ts';

let failures = 0;
/** Собирается только для артефакта: сам гейт решает по failures. */
const record = { generatedAt: new Date().toISOString(), checks: [], games: {} };
const ok = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); failures++; }
  record.checks.push({ pass: Boolean(cond), label, detail: detail || undefined });
};

/** Биномиальный коэффициент без переполнения на C(70,5). */
function comb(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

/** Гипергеометрика: ровно i главных из k и j бонусных из b. */
function tierProbability({ k, n, b, m }, i, j) {
  const main = (comb(k, i) * comb(n - k, k - i)) / comb(n, k);
  const bonus = (comb(b, j) * comb(m - b, b - j)) / comb(m, b);
  return main * bonus;
}

console.log('\n── 1. Odds тиров: пересчёт против официального чарта ──');
for (const g of PRESETS) {
  console.log(`\n${g.id}  (источник ${g.source}, снят ${g.dateChecked})`);
  const jackpotSpace = comb(g.pick.n, g.pick.k) * comb(g.pick.m, g.pick.b);
  ok(jackpotSpace === g.tiers[0].officialOdds, `пространство джекпота = ${jackpotSpace.toLocaleString('en-US')}`,
    `официально ${g.tiers[0].officialOdds}`);

  for (const t of g.tiers) {
    const p = tierProbability(g.pick, t.main, t.bonus);
    const computed = 1 / p;
    const official = t.officialOdds;
    /**
     * Сверка идёт с ТОЧНОСТЬЮ ПУБЛИКАЦИИ, а не с абсолютным допуском.
     * Powerball печатает два знака (1 в 579.76), Mega Millions и
     * EuroMillions округляют мелкие тиры до целых (1 в 35 при точных
     * 35.17). Требовать от целой публикации пяти знаков — значит валить
     * гейт на округлении издателя, а не на ошибке в данных; требовать
     * слабого относительного допуска от двузначной публикации — значит
     * пропустить настоящую опечатку в константе. Поэтому пересчёт
     * округляется до того же числа знаков и сравнивается точно.
     */
    const decimals = (String(official).split('.')[1] ?? '').length;
    const rounded = Number(computed.toFixed(decimals));
    ok(rounded === official,
      `${t.main}+${t.bonus}: 1 в ${computed.toLocaleString('en-US', { maximumFractionDigits: 2 })}` +
        (decimals === 0 && rounded !== Math.trunc(computed) ? ` → ${official}` : ''),
      `официально 1 в ${official.toLocaleString('en-US')}, пересчёт даёт ${rounded}`);
  }

  record.games[g.id] = {
    source: g.source, dateChecked: g.dateChecked, pick: g.pick,
    ticketPrice: g.ticketPrice, currency: g.currency,
    tiers: g.tiers.map((t) => ({
      match: `${t.main}+${t.bonus}`, prize: t.prize, fundShare: t.fundShare,
      officialOdds: t.officialOdds,
      recomputedOdds: Number((1 / tierProbability(g.pick, t.main, t.bonus)).toFixed(4)),
    })),
  };

  const anyPrize = g.tiers.reduce((s, t) => s + tierProbability(g.pick, t.main, t.bonus), 0);
  const overall = 1 / anyPrize;
  ok(Math.abs(overall - g.officialOverallOdds) / g.officialOverallOdds < 0.01,
    `overall odds любого приза: 1 в ${overall.toFixed(2)}`, `официально 1 в ${g.officialOverallOdds}`);
}

console.log('\n── 2. Внутренняя согласованность ──');
const mult = MEGA_MILLIONS.multiplier;
const multProbs = mult.oddsOneIn.map((o) => 1 / o);
const multSum = multProbs.reduce((a, b) => a + b, 0);
const multExpected = mult.values.reduce((s, v, i) => s + v * multProbs[i], 0);
ok(Math.abs(multSum - 1) < 0.002, `распределение множителя MM полное: Σp = ${multSum.toFixed(4)}`);
ok(Math.abs(multExpected - 3) < 0.01, `ожидаемый множитель MM = ${multExpected.toFixed(4)} (проектные 3.0)`);

const shares = EUROMILLIONS.tiers.map((t) => t.fundShare ?? 0);
const nonJackpot = shares.slice(1).reduce((a, b) => a + b, 0);
ok(Math.abs(nonJackpot - 40) < 0.01, `непризовые тиры EM забирают ${nonJackpot.toFixed(2)} % фонда (ожидается 40)`);
ok(Math.abs(shares[0] + nonJackpot + 10 - 100) < 0.01,
  `джекпот ${shares[0]} % + тиры ${nonJackpot.toFixed(2)} % + Prize Guarantee 10 % = 100 %`);

console.log('\n── 3. Приёмочный сценарий ТЗ ──');
const g = POWERBALL;
const { jackpot, cashValue, tickets, taxRate } = ACCEPTANCE;
const pJackpot = tierProbability(g.pick, 5, 1);
const mu = tickets * pJackpot;
const share = (1 - Math.exp(-mu)) / mu;

/** Налог на один приз по режиму порога пресета. */
function net(prize, rate, threshold, mode) {
  if (prize < threshold) return prize;
  return mode === 'excess' ? threshold + (prize - threshold) * (1 - rate) : prize * (1 - rate);
}

let tierSum = 0;
for (const t of g.tiers) {
  if (t.prize === null) continue;
  const p = tierProbability(g.pick, t.main, t.bonus);
  tierSum += p * net(t.prize, taxRate, g.taxThreshold, g.thresholdMode);
}
const jackpotPart = pJackpot * cashValue * share * (1 - taxRate);
const ev = jackpotPart + tierSum - g.ticketPrice;

console.log(`  μ = ${mu.toFixed(5)}, доля джекпота при выигрыше = ${share.toFixed(4)}`);
console.log(`  вклад джекпота $${jackpotPart.toFixed(3)}, тиров $${tierSum.toFixed(3)}`);
ok(Math.abs(share - 0.9584) < 5e-4, `share-фактор ${share.toFixed(4)} (ТЗ 0.9584)`);
ok(Math.abs(ev - ACCEPTANCE.expectedEv) < 0.005, `EV = ${ev.toFixed(4)} (ТЗ ${ACCEPTANCE.expectedEv})`);

const breakEvenCash = ((g.ticketPrice - tierSum) / (share * (1 - taxRate))) * (1 / pJackpot);
const breakEvenAdvertised = breakEvenCash / g.cashRatio;
console.log(`  безубыточность: кэш $${(breakEvenCash / 1e6).toFixed(0)} млн → анонс $${(breakEvenAdvertised / 1e9).toFixed(2)} млрд`);
ok(Math.abs(breakEvenAdvertised - ACCEPTANCE.expectedBreakEvenAdvertised) / ACCEPTANCE.expectedBreakEvenAdvertised < 0.01,
  `порог анонсированного джекпота ${(breakEvenAdvertised / 1e9).toFixed(2)} млрд (ТЗ 1.82)`);
ok(jackpot === 500_000_000, 'сценарий использует анонс $500 млн');

record.acceptance = {
  scenario: ACCEPTANCE, shareFactor: Number(share.toFixed(6)),
  jackpotContribution: Number(jackpotPart.toFixed(6)),
  tierContribution: Number(tierSum.toFixed(6)),
  ev: Number(ev.toFixed(6)),
  breakEvenCash: Math.round(breakEvenCash),
  breakEvenAdvertised: Math.round(breakEvenAdvertised),
};
record.multiplier = { expected: Number(multExpected.toFixed(6)), probabilitySum: Number(multSum.toFixed(6)) };
record.failures = failures;

if (process.argv.includes('--emit')) {
  const { writeFileSync } = await import('node:fs');
  const out = `docs/seo/lottery-odds-verification-${record.generatedAt.slice(0, 10)}.json`;
  writeFileSync(out, JSON.stringify(record, null, 2) + '\n');
  console.log(`  артефакт: ${out}`);
}

console.log(failures ? `\nПРОВАЛЕНО: ${failures} проверок\n` : '\nВсе проверки пройдены.\n');
process.exit(failures ? 1 : 0);
