import type { Language } from '../i18n/languages';
import type { SectionId } from '../i18n/sections';

/**
 * Реестр калькуляторов — один на весь сайт.
 *
 * Раньше список жил внутри `/[lang]/tools/index.astro`, и это означало, что
 * инструмент существует ровно в одном месте: страница-указатель. Search Console
 * показала, чем это кончается — на `/en/tools/` вела единственная внутренняя
 * ссылка со всего портала, на сами калькуляторы с главной не вело ни одной, и
 * все десять их URL (en + es) висели в статусе «обнаружена, не проиндексирована»
 * с пустым полем «последнее сканирование». Робот про них знал из sitemap и не
 * приходил.
 *
 * Поэтому данные вынесены сюда: указатель, главная и хабы рубрик берут их
 * отсюда, и добавление шестого калькулятора автоматически ставит ссылки во всех
 * трёх местах, а не только там, где о нём вспомнили.
 */
export type Tool = {
  id: string;
  /** Сегменты пути после языкового префикса. */
  segments: readonly string[];
  /** Рубрика, к которой инструмент относится по смыслу — для блока в хабе. */
  section: SectionId;
  /**
   * Дата последнего содержательного изменения инструмента, YYYY-MM-DD.
   *
   * Проставляется руками и намеренно НЕ берётся из даты сборки. `<lastmod>`,
   * который обновляется на каждом деплое, — это ложь в адрес краулера: Google
   * сверяет его с тем, что реально изменилось на странице, и, поймав на
   * расхождении, перестаёт доверять `lastmod` по всему сайту. Лучше дата,
   * отставшая на неделю, чем свежая и неверная.
   *
   * Меняя расчёт, тексты или данные калькулятора, обновите и дату.
   */
  updated: string;
  name: Record<Language, string>;
  blurb: Record<Language, string>;
};

export const TOOLS: readonly Tool[] = [
  {
    id: 'wagering-calculator',
    segments: ['tools', 'wagering-calculator'],
    section: 'casino-slots',
    updated: '2026-08-24',
    name: {
      ru: 'Калькулятор вейджера',
      en: 'Wagering calculator',
      es: 'Calculadora de rollover',
      pt: 'Calculadora de rollover',
      de: 'Umsatzbedingungen-Rechner',
      fr: 'Calculateur de wagering',
      br: 'Calculadora de rollover',
    },
    blurb: {
      ru: 'Оборот по бонусу и ожидаемые потери на этом обороте при заданном RTP.',
      en: 'Bonus turnover and the expected loss on that turnover at a given RTP.',
      es: 'Volumen del bono y pérdida esperada con un RTP dado.',
      pt: 'Volume do bónus e perda esperada com um dado RTP.',
      de: 'Bonusumsatz und erwarteter Verlust bei gegebenem RTP.',
      fr: 'Volume du bonus et perte attendue à RTP donné.',
      br: 'Volume do bônus e perda esperada com um dado RTP.',
    },
  },
  {
    id: 'odds-converter',
    segments: ['tools', 'odds-converter'],
    section: 'sports-betting',
    updated: '2026-08-27',
    name: {
      ru: 'Конвертер коэффициентов',
      en: 'Odds converter',
      es: 'Conversor de cuotas',
      pt: 'Conversor de odds',
      de: 'Quotenrechner',
      fr: 'Convertisseur de cotes',
      br: 'Conversor de odds',
    },
    blurb: {
      ru: 'Десятичный, американский и дробный форматы плюс подразумеваемая вероятность.',
      en: 'Decimal, American and fractional formats plus the implied probability.',
      es: 'Formatos decimal, americano y fraccional más la probabilidad implícita.',
      pt: 'Formatos decimal, americano e fracionário mais a probabilidade implícita.',
      de: 'Dezimal-, US- und Bruchformat plus implizite Wahrscheinlichkeit.',
      fr: 'Formats décimal, américain et fractionnaire plus la probabilité implicite.',
      br: 'Formatos decimal, americano e fracionário mais a probabilidade implícita.',
    },
  },
  {
    id: 'margin-calculator',
    segments: ['tools', 'margin-calculator'],
    section: 'sports-betting',
    updated: '2026-08-25',
    name: {
      ru: 'Калькулятор маржи букмекера',
      en: 'Bookmaker margin calculator',
      es: 'Calculadora de margen',
      pt: 'Calculadora de margem',
      de: 'Margen-Rechner',
      fr: 'Calculateur de marge',
      br: 'Calculadora de margem',
    },
    blurb: {
      ru: 'Маржа линии и честные коэффициенты без маржи (no-vig).',
      en: 'A line’s margin and the fair no-vig odds.',
      es: 'Margen de una línea y cuotas justas sin margen (no-vig).',
      pt: 'Margem de uma linha e odds justas sem margem (no-vig).',
      de: 'Marge einer Linie und faire No-Vig-Quoten.',
      fr: 'Marge d’une ligne et cotes justes sans marge (no-vig).',
      br: 'Margem de uma linha e odds justas sem margem (no-vig).',
    },
  },
  {
    id: 'blackjack-house-edge',
    segments: ['tools', 'blackjack-house-edge'],
    section: 'poker-table-games',
    updated: '2026-08-27',
    name: {
      ru: 'Калькулятор house edge: блэкджек',
      en: 'Blackjack house edge calculator',
      es: 'Calculadora de house edge: blackjack',
      pt: 'Calculadora de house edge: blackjack',
      de: 'Blackjack-Hausvorteil-Rechner',
      fr: 'Calculateur d’avantage maison : blackjack',
      br: 'Calculadora de house edge: blackjack',
    },
    blurb: {
      ru: 'Кромка казино по правилам стола: 3:2 или 6:5, S17/H17, DAS, число колод.',
      en: 'The house edge from table rules: 3:2 vs 6:5, S17/H17, DAS, deck count.',
      es: 'La ventaja de la casa según las reglas de la mesa: 3:2 o 6:5, S17/H17, DAS, barajas.',
      pt: 'A vantagem da casa pelas regras da mesa: 3:2 ou 6:5, S17/H17, DAS, baralhos.',
      de: 'Der Hausvorteil aus den Tischregeln: 3:2 oder 6:5, S17/H17, DAS, Decks.',
      fr: 'L’avantage maison selon les règles de la table : 3:2 ou 6:5, S17/H17, DAS, jeux.',
      br: 'A vantagem da casa pelas regras da mesa: 3:2 ou 6:5, S17/H17, DAS, baralhos.',
    },
  },
  {
    id: 'lottery-expected-value',
    segments: ['tools', 'lottery-expected-value'],
    section: 'lottery-esports',
    updated: '2026-10-26',
    name: {
      ru: 'Калькулятор матожидания лотереи',
      en: 'Lottery expected value calculator',
      es: 'Calculadora de valor esperado de la lotería',
      pt: 'Calculadora de valor esperado da lotaria',
      de: 'Lotto-Erwartungswert-Rechner',
      fr: 'Calculateur d’espérance au loto',
      br: 'Calculadora de valor esperado da loteria',
    },
    blurb: {
      ru: 'Честная цена билета: шансы, налог, делёжка джекпота и дисконт кэш-выплаты.',
      en: 'What a ticket really costs: odds, tax, jackpot splitting and the cash-value discount.',
      es: 'Lo que cuesta de verdad un boleto: probabilidades, impuesto, reparto del bote y descuento del pago en efectivo.',
      pt: 'Quanto custa realmente um bilhete: probabilidades, imposto, partilha do jackpot e desconto do pagamento a pronto.',
      de: 'Was ein Lottoschein wirklich kostet: Chancen, Steuer, Jackpot-Teilung und Abschlag der Sofortauszahlung.',
      fr: 'Ce que coûte vraiment un billet : probabilités, impôt, partage du jackpot et décote du paiement comptant.',
      br: 'Quanto um bilhete custa de verdade: probabilidades, imposto, divisão do prêmio e desconto do pagamento à vista.',
    },
  },
];

/** Инструменты рубрики — для блока «посчитать» в хабе. */
export function toolsForSection(sectionId: string): readonly Tool[] {
  return TOOLS.filter((tool) => tool.section === sectionId);
}

/**
 * Путь инструмента относительно языкового корня, `tools/odds-converter`.
 * Нужен sitemap'у, который работает сегментами, а не массивами.
 */
export const TOOL_SEGMENTS: readonly string[] = TOOLS.map((tool) => tool.segments.join('/'));

/** Дата последнего изменения инструмента по его сегментам. */
export const TOOL_UPDATED: Readonly<Record<string, string>> = Object.fromEntries(
  TOOLS.map((tool) => [tool.segments.join('/'), tool.updated]),
);
