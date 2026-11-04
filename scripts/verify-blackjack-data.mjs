#!/usr/bin/env node
/**
 * Пре-шип гейт данных калькулятора блэкджека, по образцу verify-lottery-data.mjs:
 *   node --experimental-strip-types scripts/verify-blackjack-data.mjs
 *
 * Проверяет три РАЗНЫХ класса утверждений, и только два из них могут поймать
 * настоящую ошибку. Это важно понимать, иначе гейт создаёт ложное спокойствие:
 *
 *   1. СОХРАННОСТЬ. Дельты в BJ_DELTAS равны (exact[rule].cut − exact.benchmark.cut)
 *      из артефакта захвата. Это тождество: дельты оттуда и выведены. Проверка
 *      ловит только расхождение файла с артефактом — правку руками, неудачный
 *      мёрж, переснятый захват. Ошибку в самих данных WoO она поймать не может.
 *
 *   2. НЕЗАВИСИМЫЙ РАСЧЁТ. Штраф за выплату 6:5 пересчитывается в замкнутой
 *      форме точными дробями и сверяется с картой pay65. Здесь первична
 *      математика: карта в данных — это НЕ снятые числа, а наш расчёт, и
 *      разойтись они могут только если кто-то их поправил. Дополнительно
 *      восьмиколодное значение сверяется с тем, что реально снято с WoO, —
 *      единственная точка, где наша формула встречается с их калькулятором.
 *
 *   3. ТОЧНОСТЬ МОДЕЛИ. Ошибка аддитивной модели считается на трёх стековых
 *      наборах из артефакта и сравнивается с BJ_MODEL_TOLERANCE — числом,
 *      которое страница инструмента показывает читателю. Если модель станет
 *      хуже обещанного, гейт падает раньше, чем это увидит пользователь.
 *
 * Чего гейт НЕ проверяет и проверить не может: все три стека — на 2, 6 и 8
 * колодах. Одноколодных наборов не захватывали ни одного, поэтому для них
 * граница точности не измерена. Скрипт говорит об этом вслух, чтобы дырку
 * не забыли (подпись инструмента обещает границу только для проверенных
 * наборов — ровно по этой причине).
 *
 * Выходной код ненулевой при любом расхождении больше допуска.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BJ_BASE_EDGE, BJ_DELTAS, BJ_MODEL_TOLERANCE } from '../src/data/blackjack-house-edge.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const matrix = JSON.parse(
  readFileSync(join(root, 'docs/seo/woo-blackjack-matrix-2026-08-27.json'), 'utf8'),
).exact;

let failures = 0;
const ok = (cond, label, detail = '') => {
  if (cond) console.log(`  ✓ ${label}`);
  else { console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`); failures++; }
};
const near = (a, b, eps) => Math.abs(a - b) <= eps;

// ── 1. Сохранность: данные не разошлись с артефактом захвата ──
console.log('\n1. Дельты против артефакта захвата (тождество — ловит только правку руками)');

const BENCH = matrix.benchmark.cut;
ok(near(BJ_BASE_EDGE, BENCH, 1e-9), `база ${BJ_BASE_EDGE} = benchmark.cut`, `артефакт: ${BENCH}`);

/** Имя правила в артефакте → значение в BJ_DELTAS. pay65 проверяется отдельно. */
const SIMPLE = {
  decks1: BJ_DELTAS.decks[1], decks2: BJ_DELTAS.decks[2], decks4: BJ_DELTAS.decks[4],
  decks5: BJ_DELTAS.decks[5], decks6: BJ_DELTAS.decks[6],
  h17: BJ_DELTAS.h17, noDas: BJ_DELTAS.noDas,
  dbl911: BJ_DELTAS.double['9-11'], dbl1011: BJ_DELTAS.double['10-11'],
  resplit2: BJ_DELTAS.resplit[2], resplit3: BJ_DELTAS.resplit[3],
  rsa: BJ_DELTAS.rsa, hsa: BJ_DELTAS.hsa,
  enhcFullLoss: BJ_DELTAS.enhcFullLoss, lateSurrender: BJ_DELTAS.lateSurrender,
};
for (const [rule, declared] of Object.entries(SIMPLE)) {
  const captured = matrix[rule].cut - BENCH;
  ok(near(declared, captured, 1e-5), `${rule} = ${declared}`, `из артефакта ${captured.toFixed(5)}`);
}

// ── 2. Независимый расчёт: штраф за выплату 6:5 ──
console.log('\n2. Штраф 6:5 в замкнутой форме (настоящая проверка: математика против данных)');

/**
 * Игрок теряет 0.3 ставки на каждом своём блэкджеке, который не спарен
 * с блэкджеком дилера: 3:2 платит 1.5, 6:5 платит 1.2. Считаем точными
 * дробями через BigInt, чтобы результат не зависел от порядка умножений.
 */
function pay65(decks) {
  const c = BigInt(52 * decks), tens = BigInt(16 * decks), aces = BigInt(4 * decks);
  // P(блэкджек) = 2 · (десятки/c) · (тузы/(c−1))
  const pbjNum = 2n * tens * aces, pbjDen = c * (c - 1n);
  // У игрока туз и десятка, осталось c−2 карты: P(блэкджек дилера | блэкджек игрока)
  const pdNum = 2n * (aces - 1n) * (tens - 1n), pdDen = (c - 2n) * (c - 3n);
  // pbj · (1 − pd) · 3/10, в процентных пунктах
  const num = pbjNum * (pdDen - pdNum) * 3n * 100n;
  const den = pbjDen * pdDen * 10n;
  return Number(num) / Number(den);
}

for (const decks of [1, 2, 4, 5, 6, 8]) {
  const exact = pay65(decks);
  const declared = BJ_DELTAS.pay65[decks];
  ok(near(declared, exact, 5e-6), `${decks} колод: ${declared}`, `замкнутая форма ${exact.toFixed(5)}`);
}

const captured65 = matrix.pay65.cut - BENCH;
ok(near(pay65(8), captured65, 2e-5),
   `8 колод сходится со снятым с WoO (${captured65.toFixed(5)})`,
   `формула даёт ${pay65(8).toFixed(5)}`);

// ── 3. Точность аддитивной модели на захваченных стеках ──
console.log('\n3. Ошибка аддитивной модели против обещанного читателю допуска');

/** Стеки из артефакта: имя кодирует набор правил, здесь он разложен явно. */
const STACKS = [
  { key: 'stack_8d_h17_65', decks: 8, rules: ['h17', 'pay65'] },
  { key: 'stack_6d_h17_noDas_65', decks: 6, rules: ['h17', 'noDas', 'pay65'] },
  { key: 'stack_2d_h17', decks: 2, rules: ['h17'] },
];

let worst = 0;
for (const { key, decks, rules } of STACKS) {
  let model = BJ_BASE_EDGE + BJ_DELTAS.decks[decks];
  for (const r of rules) model += r === 'pay65' ? BJ_DELTAS.pay65[decks] : BJ_DELTAS[r];
  const error = model - matrix[key].cut;
  worst = Math.max(worst, Math.abs(error));
  console.log(`  · ${key}: модель ${model.toFixed(5)}, снято ${matrix[key].cut.toFixed(5)}, ошибка ${error >= 0 ? '+' : ''}${error.toFixed(5)}`);
}
ok(worst <= BJ_MODEL_TOLERANCE,
   `максимум ${worst.toFixed(5)} п.п. не превышает заявленных ${BJ_MODEL_TOLERANCE}`,
   'подпись инструмента обещает читателю меньшее число, чем модель даёт на самом деле');

const deckCoverage = [...new Set(STACKS.map((s) => s.decks))].sort((a, b) => a - b);
console.log(`\n  ! Допуск измерен только на ${deckCoverage.join(', ')} колодах.`);
console.log('    Одноколодных стеков не захватывали — для них граница НЕ проверена.');
console.log('    Подпись инструмента поэтому говорит «на проверенных наборах», а не вообще.');

console.log(failures === 0 ? '\nВсе проверки пройдены.' : `\nПровалено проверок: ${failures}.`);
process.exit(failures === 0 ? 0 : 1);
