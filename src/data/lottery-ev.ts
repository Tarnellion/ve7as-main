/**
 * Данные калькулятора матожидания лотерейного билета.
 *
 * Все константы сняты с официальных источников 26.10.2026 и перепроверены
 * пересчётом: odds каждого тира выводятся из гипергеометрики, а официальный
 * чарт служит перекрёстной проверкой. В этом инструменте математика и есть
 * источник — в отличие от блэкджека, где дельты приходилось замерять.
 * Пре-шип гейт: `node scripts/verify-lottery-data.mjs`.
 *
 * Сырые замеры и расхождения — docs/seo/lottery-odds-verification-2026-10-26.json.
 */

export type Tier = {
  /** Совпало главных шаров. */
  main: number;
  /** Совпало бонусных шаров. */
  bonus: number;
  /** Фиксированный приз в валюте игры. `null` — джекпот (задаётся пользователем). */
  prize: number | null;
  /** Официальные odds «1 из N». Для сверки с пересчётом. */
  officialOdds: number | null;
  /** Доля призового фонда для пари-мютюэль игр, в процентах. */
  fundShare?: number;
};

/**
 * Как налог применяется к порогу. Различие не косметическое:
 *   full   — налог на ВСЮ сумму приза, если она достигла порога (модель US:
 *            приз это доход целиком, порог лишь включает удержание);
 *   excess — налог только на ПРЕВЫШЕНИЕ над порогом (модель ES: gravamen
 *            especial, Ley 16/2012 — первые 40 000 € освобождены всегда).
 * Для приза 100 000 € разница составляет 8 000 € — поэтому режим хранится
 * в данных, а не захардкожен одной формулой.
 */
export type ThresholdMode = 'full' | 'excess';

export type GamePreset = {
  id: string;
  /** k из n главных шаров, b из m бонусных. */
  pick: { k: number; n: number; b: number; m: number };
  ticketPrice: number;
  currency: 'USD' | 'EUR';
  /**
   * Анонсированный джекпот, с которого открывается пресет. Нужен, потому
   * что джекпоты игр несопоставимы: EuroMillions ограничен €250 млн по
   * правилам, и перенос американских $500 млн на него даёт заведомо
   * невозможный тираж — с положительным матожиданием прямо на старте,
   * то есть ровно то, что рамка инструмента запрещает показывать как
   * нормальное состояние.
   */
  defaultJackpot: number;
  /**
   * Доля анонсированного джекпота, выплачиваемая деньгами сразу.
   * US-игры анонсируют аннуитет на 30 лет: 0.46 — типичное отношение
   * cash/annuity. EuroMillions платит кэшем, поэтому 1.0.
   */
  cashRatio: number;
  defaultTaxRate: number;
  taxThreshold: number;
  thresholdMode: ThresholdMode;
  tiers: Tier[];
  /** Официальные overall odds любого приза, для сверки. */
  officialOverallOdds: number;
  /**
   * Пари-мютюэль: призы не фиксированы, а делят долю фонда. Тогда вклад
   * тира в матожидание равен share × prizeFundRatio × цена билета и НЕ
   * зависит от числа билетов — сокращается. Абсолютный размер приза при
   * этом от тиража зависит, поэтому показывается только когда задан N.
   */
  pariMutuel?: { prizeFundRatio: number; jackpotShare: number };
  /** Множитель на непризовые тиры, применяемый к каждому билету. */
  multiplier?: { values: number[]; oddsOneIn: number[] };
  source: string;
  dateChecked: string;
};

/**
 * Powerball. Цена $2, 5 из 69 + 1 из 26.
 * Джекпот 1:292 201 338 = C(69,5) × 26.
 */
export const POWERBALL: GamePreset = {
  id: 'powerball',
  pick: { k: 5, n: 69, b: 1, m: 26 },
  ticketPrice: 2,
  currency: 'USD',
  defaultJackpot: 500_000_000,
  cashRatio: 0.46,
  defaultTaxRate: 0.37,
  taxThreshold: 5000,
  thresholdMode: 'full',
  officialOverallOdds: 24.87,
  tiers: [
    { main: 5, bonus: 1, prize: null, officialOdds: 292_201_338 },
    { main: 5, bonus: 0, prize: 1_000_000, officialOdds: 11_688_053.52 },
    { main: 4, bonus: 1, prize: 50_000, officialOdds: 913_129.18 },
    { main: 4, bonus: 0, prize: 100, officialOdds: 36_525.17 },
    { main: 3, bonus: 1, prize: 100, officialOdds: 14_494.11 },
    { main: 3, bonus: 0, prize: 7, officialOdds: 579.76 },
    { main: 2, bonus: 1, prize: 7, officialOdds: 701.33 },
    { main: 1, bonus: 1, prize: 4, officialOdds: 91.98 },
    { main: 0, bonus: 1, prize: 4, officialOdds: 38.32 },
  ],
  source: 'https://www.powerball.com/powerball-prize-chart',
  dateChecked: '2026-10-26',
};

/**
 * Mega Millions после реформы апреля 2025: цена $5, 5 из 70 + 1 из 24,
 * джекпот 1:290 472 336.
 *
 * Главная особенность — встроенный множитель, который применяется к КАЖДОМУ
 * билету, а не покупается отдельно. ТЗ предполагало, что распределение
 * множителя захватить не удастся, и разрешало урезанный пресет. Распределение
 * захвачено с официального оператора штата: вероятности 1/32, 1/16, 1/8,
 * 1/3.2, 1/2.13 суммируются в 1.0007 (округление публикации), а ожидаемый
 * множитель выходит ровно 3.0 — это проектное число игры. Поэтому тиры
 * считаются полноценно: вклад = базовый приз × E[множителя].
 */
export const MEGA_MILLIONS: GamePreset = {
  id: 'mega-millions',
  pick: { k: 5, n: 70, b: 1, m: 24 },
  ticketPrice: 5,
  currency: 'USD',
  defaultJackpot: 500_000_000,
  cashRatio: 0.46,
  defaultTaxRate: 0.37,
  taxThreshold: 5000,
  thresholdMode: 'full',
  officialOverallOdds: 23.07,
  multiplier: { values: [2, 3, 4, 5, 10], oddsOneIn: [2.13, 3.2, 8, 16, 32] },
  tiers: [
    { main: 5, bonus: 1, prize: null, officialOdds: 290_472_336 },
    { main: 5, bonus: 0, prize: 1_000_000, officialOdds: 12_629_232 },
    { main: 4, bonus: 1, prize: 10_000, officialOdds: 893_761 },
    { main: 4, bonus: 0, prize: 500, officialOdds: 38_859 },
    { main: 3, bonus: 1, prize: 200, officialOdds: 13_965 },
    { main: 3, bonus: 0, prize: 10, officialOdds: 607 },
    { main: 2, bonus: 1, prize: 7, officialOdds: 665 },
    { main: 1, bonus: 1, prize: 7, officialOdds: 86 },
    { main: 0, bonus: 1, prize: 5, officialOdds: 35 },
  ],
  source: 'https://lottery.sd.gov/mega-millions-update/',
  dateChecked: '2026-10-26',
};

/**
 * EuroMillions: €2.50, 5 из 50 + 2 из 12, джекпот 1:139 838 160.
 *
 * Непризовые тиры пари-мютюэль — фиксированных сумм не существует, и это
 * та самая «самая медленная задача данных» из ТЗ. Решение оказалось точнее
 * усреднения выплат: при пари-мютюэль вклад тира в матожидание равен
 * доля_фонда × доля_продаж_в_фонд × цена билета, потому что число
 * победителей сокращается с размером приза. Суммарно непризовые тиры
 * забирают ровно 40 % фонда (проверяется в гейте), фонд — 50 % продаж.
 *
 * Доля джекпота 50 % в тиражах 1–5 и 42 % далее (остаток уходит в Prize
 * Guarantee Fund) — на матожидание билета не влияет, потому что джекпот
 * вводится пользователем, но объясняет, откуда берётся сумма 100 %.
 */
export const EUROMILLIONS: GamePreset = {
  id: 'euromillions',
  pick: { k: 5, n: 50, b: 2, m: 12 },
  ticketPrice: 2.5,
  currency: 'EUR',
  defaultJackpot: 50_000_000,
  cashRatio: 1,
  defaultTaxRate: 0.2,
  taxThreshold: 40_000,
  thresholdMode: 'excess',
  officialOverallOdds: 13,
  pariMutuel: { prizeFundRatio: 0.5, jackpotShare: 0.5 },
  tiers: [
    { main: 5, bonus: 2, prize: null, officialOdds: 139_838_160, fundShare: 50 },
    { main: 5, bonus: 1, prize: null, officialOdds: 6_991_908, fundShare: 2.61 },
    { main: 5, bonus: 0, prize: null, officialOdds: 3_107_515, fundShare: 0.61 },
    { main: 4, bonus: 2, prize: null, officialOdds: 621_503, fundShare: 0.19 },
    { main: 4, bonus: 1, prize: null, officialOdds: 31_075, fundShare: 0.35 },
    { main: 3, bonus: 2, prize: null, officialOdds: 14_125, fundShare: 0.37 },
    { main: 4, bonus: 0, prize: null, officialOdds: 13_811, fundShare: 0.26 },
    { main: 2, bonus: 2, prize: null, officialOdds: 985, fundShare: 1.3 },
    { main: 3, bonus: 1, prize: null, officialOdds: 706, fundShare: 1.45 },
    { main: 3, bonus: 0, prize: null, officialOdds: 314, fundShare: 2.7 },
    { main: 1, bonus: 2, prize: null, officialOdds: 188, fundShare: 3.27 },
    { main: 2, bonus: 1, prize: null, officialOdds: 49, fundShare: 10.3 },
    { main: 2, bonus: 0, prize: null, officialOdds: 22, fundShare: 16.59 },
  ],
  source: 'https://en.wikipedia.org/wiki/EuroMillions',
  dateChecked: '2026-10-26',
};

export const PRESETS: GamePreset[] = [POWERBALL, MEGA_MILLIONS, EUROMILLIONS];

/** Приёмочный сценарий из ТЗ. Воспроизводится гейтом, менять нельзя. */
export const ACCEPTANCE = {
  preset: 'powerball',
  jackpot: 500_000_000,
  cashValue: 230_000_000,
  tickets: 25_000_000,
  taxRate: 0.37,
  expectedEv: -1.26,
  expectedBreakEvenAdvertised: 1.82e9,
} as const;
