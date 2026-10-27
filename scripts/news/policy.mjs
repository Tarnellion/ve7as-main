/**
 * Политика: что можно выпускать без человека.
 *
 * Чистая функция от записи генератора и режима. Здесь сосредоточены ВСЕ гейты
 * автопубликации, и ни один не размазан по другим скриптам: чтобы понять,
 * почему материал вышел сам или не вышел, достаточно читать этот файл.
 *
 * ДВА РЕЖИМА (переменная репозитория NEWS_PUBLISH_MODE)
 *   draft — всё уходит в Sanity черновиком, публикует человек. По умолчанию.
 *   auto  — материал, прошедший ВСЕ гейты ниже, публикуется сам; остальное
 *           по-прежнему черновик.
 *
 * `eligible` считается независимо от режима. Поэтому в режиме draft редактор
 * видит в заметках к каждому материалу (документ newsReview в Studio), ушёл бы
 * он в публикацию при auto или нет и почему. Это единственный способ оценить
 * автопубликацию ДО того, как включишь её.
 *
 * ПОЛИТИКА И ПУБЛИЧНЫЙ ТЕКСТ СВЯЗАНЫ. Редполитика сайта перечисляет эти гейты
 * читателю. Меняя порог или добавляя гейт, правьте текст раздела «How AI is
 * used» (ru/en/es): обещание, не совпадающее с поведением, хуже отсутствия
 * обещания. Порог подтверждений нельзя опустить ниже трёх переменной
 * окружения именно поэтому: публичный текст говорит «не менее трёх».
 *
 * ЧЕГО ЭТИ ГЕЙТЫ НЕ ГАРАНТИРУЮТ. Список тем «только человек» — ключевые слова, то
 * есть эвристика: она ловит типичные формулировки на пяти языках, но не все. Поэтому
 * публичный текст говорит, что проверки «рассчитаны удерживать» такие материалы, а не
 * что они это гарантируют, и поэтому есть потолок публикаций за прогон.
 */
import { intEnv } from './env.mjs';
import { metaCheck } from './postcheck.mjs';

export const SECTIONS = ['casino-slots', 'sports-betting', 'poker-table-games', 'lottery-esports'];

/**
 * Сколько НЕЗАВИСИМЫХ голосов нужно, чтобы выпустить без человека. Правило
 * публикации вообще — две группы (решение владельца), а без человека планка
 * выше: человек отсекает то, что пропускают две группы, а код — нет.
 * Нижний предел 3 зашит: переменная может планку только поднять.
 */
export const minGroups = (env = process.env) => intEnv('NEWS_AUTO_MIN_GROUPS', 3, { min: 3, max: 10 }, env);
/** Потолок автопубликаций за прогон: цена ошибки гейта. 0 допустим — «не публиковать вовсе». */
export const maxPerRun = (env = process.env) => intEnv('NEWS_AUTO_MAX_PER_RUN', 3, { min: 0, max: 20 }, env);

/**
 * Регулярное выражение по списку слов с границами слов, понимающее юникод.
 * `слово*` — любое продолжение («sentenc*» → sentenced, sentencing), пробел в
 * середине — любой пробельный промежуток. `\\b` для этого не годится: он
 * считает буквой только ASCII и ломается на «prisión» и «décès».
 */
function words(list) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const alt = list
    .map((w) => (w.endsWith('*') ? `${esc(w.slice(0, -1))}\\p{L}*` : esc(w)).replace(/ /g, '\\s+'))
    .join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alt})(?![\\p{L}\\p{N}])`, 'iu');
}

/**
 * Паттерн с особыми правилами: для слов, у которых в обычной новости есть безобидный смысл.
 * Найдено разбором пяти живых событий (27.10.2026): имя «Sue Young» (исполнительный директор
 * в релизах UKGC) давало «гражданский иск», а испанское «a su juicio» («по его мнению») —
 * «уголовное производство». Оба срабатывания держали именно тот класс материала, ради
 * которого нужна автопубликация, — решения регуляторов об операторах.
 */
const GUARDED = {
  // «sue» как глагол: строчное; в заголовках Title Case («Plans to Sue Regulator») и КАПСОМ тоже. Просто «Sue»
  // — имя, но после to/will/may… это глагол, а «SUE» заглавными в заголовке — тоже глагол. Проверено ревью: с одним
  // регистрозависимым шаблоном заголовок «Kalshi Plans to Sue Louisiana Regulator» переставал удерживаться.
  sue: [
    /(?<![\p{L}\p{N}])sue(?![\p{L}\p{N}])/u,
    /(?<=(?<![\p{L}\p{N}])(?:to|will|would|could|may|might|can|shall|should|must)\s{1,3})Sue(?![\p{L}\p{N}])/u,
    /(?<![\p{L}\p{N}])SUE(?![\p{L}\p{N}])/u,
  ],
  // «juicio» — суд. «a su juicio» / «a juicio de» в начале предложения или после запятой — вводный оборот
  // «по его мнению»; «acudió a su juicio» («пришёл на свой суд») по-прежнему удерживается.
  juicio: /(?<!(?:^|[.,;:]\s{0,3})a\s{1,3}(?:(?:su|mi|tu|nuestro|vuestro)\s{1,3})?)(?<![\p{L}\p{N}])juicios?(?![\p{L}\p{N}])/imu,
};

/**
 * Темы, которые не выпускаются без человека, как бы хорошо ни прошли проверки.
 *
 * ЭТО СТРАХОВКА ПОВЕРХ МОДЕЛЬНОЙ ПРОВЕРКИ `namesPrivateIndividuals`, а не замена:
 * слова грубы, модель понимает, назван ли человек. Но у слов есть своё
 * достоинство — они не «рассуждают». Модель можно убедить, что приговор — это
 * нормально, список слов нельзя. Цена перестраховки — часть судебных новостей
 * идёт черновиками.
 *
 * Список пять языков, потому что источники — на нескольких (нидерландский KSA,
 * испанские, португальские, немецкие), а проверяются заголовок события в
 * оригинале, извлечённые факты и итоговые тексты обоих языков.
 *
 * Намеренно НЕ включены «investigation» и «money laundering»: они стоят в
 * большинстве решений регуляторов об операторах (юридических лицах), то есть в
 * главном сценарии автопубликации. Частное лицо в таком тексте ловит проверка модели.
 */
export const HOLD_PATTERNS = [
  [words(['sentenc*', 'convict*', 'guilty', 'verdict', 'jail*', 'imprison*', 'prison*', 'arrest*', 'indict*',
    'charged', 'prosecut*', 'plead*', 'trial', 'police', 'detain*', 'custody', 'remand', 'bail', 'extradit*',
    'fraud*', 'embezzl*', 'scam*', 'smuggl*', 'theft', 'stole*', 'bribe*', 'corrupt*',
    'veroordeel*', 'vervolg*', 'aangehouden', 'gearresteerd', 'gevangenis', 'celstraf', 'fraude', 'oplicht*',
    'condenad*', 'sentencia*', 'detenid*', 'imput*', 'cárcel', 'prisión', 'culpable', 'delito*', 'estafa*',
    'preso*', 'prisão', 'julgament*', 'criminos*', 'golpe',
    'verurteil*', 'festgenommen', 'verhaftet', 'angeklagt*', 'anklage*', 'strafverfahren', 'betrug*', 'haft',
    'condamn*', 'inculp*', 'procès', 'escroquer*']), 'уголовное производство'],
  [GUARDED.juicio, 'уголовное производство'],
  [words(['alleg*', 'accus*', 'suspect*', 'verdacht*', 'beschuldig*']), 'обвинения и подозрения'],
  // Участник процесса без указания рода дела: defendant — и в уголовном, и в гражданском. Прежде
  // «defendant» стоял в «гражданском иске», а «acusad*» в «обвинениях», и редактору называли не ту причину.
  [words(['defendant*', 'acusad*']), 'судебное разбирательство'],
  [words(['lawsuit*', 'sues', 'sued', 'suing', 'litigation', 'plaintiff*', 'class action',
    'rechtszaak', 'demanda*', 'klage*', 'plainte*']), 'гражданский иск'],
  ...GUARDED.sue.map((re) => [re, 'гражданский иск']),
  // 'mort*' ловило mortgage, mortality и brick-and-mortar; оставлены формы со смыслом «смерть» (в том числе
  // mortal/mortos/mortels, которые ревью нашло потерянными при первой замене) и частые обороты без слова «смерть».
  [words(['suicid*', 'suïcid*', 'zelfdoding', 'zelfmoord', 'overdos*', 'died', 'dies', 'death*', 'dead', 'killed',
    'murder*', 'fatal*', 'homicide', 'self-harm', 'took his own life', 'took her own life', 'took their own life',
    'killed himself', 'killed herself', 'passed away', 'lost his life', 'lost her life', 'lost their life',
    'ended his life', 'ended her life', 'ended his own life', 'ended her own life',
    'overleden', 'fallec*', 'muert*', 'asesin*', 'murió', 'perdió la vida', 'se quitó la vida',
    'morte', 'mortes', 'morto', 'morta', 'mortos', 'mortas', 'mortais', 'morreu', 'morti',
    'gestorben', 'ums leben', 'tot', 'décès', 'mort', 'morts', 'mortel', 'mortelle', 'mortels', 'mortelles', 'mortellement',
    'mortal', 'mortally', 'mortalmente']), 'смерть'],
];

/**
 * Слова, давшие совпадение, по темам. Нужны редактору в приватном newsReview: метка «уголовное
 * производство» без слова не позволяет отличить настоящее дело от ложного срабатывания (так
 * «a su juicio» пришлось искать вручную). В публичный лог это не попадает: там только коды.
 */
export function holdMatches(record) {
  const text = scanText(record);
  const out = new Map();
  for (const [re, why] of HOLD_PATTERNS) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    const hits = [...text.matchAll(g)].map((m) => (re.flags.includes('i') ? m[0].toLowerCase() : m[0]));
    if (hits.length) out.set(why, [...new Set([...(out.get(why) ?? []), ...hits])]);
  }
  return [...out].map(([why, words]) => ({ why, words }));
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Весь текст, в котором ищем темы: оригинал заголовка, факты, итоговые тексты и меты обоих языков. */
function scanText(record) {
  const f = record.factsParsed;
  return [
    record.event,
    f?.event,
    ...(f?.facts ?? []).map((x) => x.statement),
    ...(f?.unconfirmed ?? []),
    record.en?.text, record.es?.text,
    record.en?.meta?.title, record.en?.meta?.description,
    record.es?.meta?.title, record.es?.meta?.description,
  ].filter(Boolean).join('\n');
}

/** Темы «только человек», найденные в записи. Отдельная функция ради тестов. */
export function holdTopics(record) {
  const text = scanText(record);
  return [...new Set(HOLD_PATTERNS.filter(([re]) => re.test(text)).map(([, why]) => why))];
}

// ── ДАТА СОБЫТИЯ ────────────────────────────────────────────────────────────
// Найдено разбором живых черновиков: модель брала за дату события дату выхода страницы. Заявление
// Лулы, сделанное 22 октября перед вторым туром, вышло в тексте как «26 октября, после
// переизбрания»; арест 25 млн € по делу Lottomatica, объявленный 23 октября, — как 26 октября. Второй
// проход сверяет текст с ФАКТАМИ, а не с источниками, поэтому ошибку стадии фактов он не видит.
// Событие не может случиться позже, чем о нём впервые написали, — это и проверяем, и только по
// предложению «что произошло» (`factsParsed.event`, схема требует в нём дату): в абзацах текста
// законно стоят более поздние даты — выход публикации, срок, который наступил после.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_RE = '(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)';
const monthIndex = (name) => MONTHS.findIndex((m) => m === name.toLowerCase() || (name.length >= 3 && m.startsWith(name.toLowerCase().replace(/\.$/, ''))));
const DAY_MS = 86_400_000;

/**
 * Дата события в английском предложении. Предпочтение — дате после «on» («On 22 October…»); иначе первая дата,
 * кроме стоящих после from/by/until/since/before/after/ahead of/due/scheduled for/deadline/within: это сроки и
 * вступление в силу, а не момент события («From 1 January 2027 operators must register; announced on 22 October»).
 * Месяц — только с заглавной буквы: «may 5 operators» в тексте не дата. Год не указан — берём год опорной
 * даты, а если выйдет заметно позже опорной — предыдущий (событие декабря в январской заметке).
 * @returns {number|null} UTC-полночь этой даты, мс
 */
export function firstDateIn(text, ref) {
  if (typeof text !== 'string') return null;
  const found = [];
  for (const m of text.matchAll(/(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/g)) found.push({ i: m.index, y: +m[1], mo: +m[2] - 1, d: +m[3] });
  for (const m of text.matchAll(new RegExp(String.raw`(?<![\p{L}\d])(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(${MONTH_RE})\b\.?(?:,?\s+(\d{4}))?`, 'gu'))) {
    found.push({ i: m.index, y: m[3] ? +m[3] : null, mo: monthIndex(m[2]), d: +m[1] });
  }
  for (const m of text.matchAll(new RegExp(String.raw`(?<![\p{L}\d])(${MONTH_RE})\b\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?!\d)(?:,?\s+(\d{4}))?`, 'gu'))) {
    found.push({ i: m.index, y: m[3] ? +m[3] : null, mo: monthIndex(m[1]), d: +m[2] });
  }
  found.sort((x, y) => x.i - y.i);
  const resolve = (f) => {
    if (f.mo < 0 || f.d < 1 || f.d > 31) return null;
    let y = f.y;
    if (y == null) {
      y = new Date(ref).getUTCFullYear();
      if (Date.UTC(y, f.mo, f.d) > ref + 183 * DAY_MS) y -= 1;
    }
    const t = Date.UTC(y, f.mo, f.d);
    return new Date(t).getUTCMonth() === f.mo ? t : null; // 31 февраля — не дата
  };
  const usable = found.map((f) => ({ f, t: resolve(f) })).filter((x) => x.t != null);
  const lead = (f) => text.slice(Math.max(0, f.i - 24), f.i);
  const preferred = usable.find(({ f }) => /\b(?:on|dated)\s*$/i.test(lead(f)));
  const pick = preferred ?? usable.find(({ f }) => !/\b(?:from|by|until|till|starting|effective|since|before|after|ahead\s+of|due|scheduled\s+for|deadline|within)\s*(?:the\s+)?$/i.test(lead(f)));
  return pick ? pick.t : null;
}

/**
 * @returns {{ eventDate: string, firstSeen: string }|{ unverifiable: true }|null}
 *   проблема или null, если сверять нечего (в предложении нет даты) или всё сходится.
 *   unverifiable — дата в предложении есть, а даты первого упоминания нет или она нечитаема: гейт не должен молчать.
 */
export function eventDateIssue(record) {
  const sentence = record.factsParsed?.event;
  if (typeof sentence !== 'string') return null;
  const first = Date.parse(record.eventMeta?.firstSeen ?? '');
  if (!Number.isFinite(first)) return firstDateIn(sentence, Date.now()) == null ? null : { unverifiable: true };
  const firstDay = Date.UTC(new Date(first).getUTCFullYear(), new Date(first).getUTCMonth(), new Date(first).getUTCDate());
  const t = firstDateIn(sentence, first);
  if (t == null || t <= firstDay + DAY_MS) return null; // сутки запаса: пояса и публикация ночью
  return { eventDate: new Date(t).toISOString().slice(0, 10), firstSeen: new Date(first).toISOString().slice(0, 10) };
}

// ── УТВЕРЖДЕНИЯ ОБ ОТСУТСТВИИ ДРУГИХ ИСТОЧНИКОВ ────────────────────────────────────
// «Figures no other source repeats», «According to Yogonet alone», «No second source we checked has
// confirmed it». Это не атрибуция («по данным X» остаётся законной), а утверждение об отсутствии,
// и верно оно, только если ПРОЧИТАНЫ все издания события. Когда часть источников ответила 403,
// фраза описывает состояние конвейера, а не мир: в Бразилии GamblingNews повторяла обе цифры, о
// которых текст писал «никто больше не сообщает».
// Название издания: с заглавной (SBC, Yogonet, Casino.org, Legal Sports Report) или в виде iGB / iGaming Business.
const NAME = String.raw`(?:[A-ZÁÉÍÓÚÑ]|i[A-Z])[\p{L}\d.&-]*(?:\s+[A-ZÁÉÍÓÚÑ][\p{L}\p{N}.&-]*){0,3}`;
const VERB_EN = String.raw`(?:reports?|reported|has\s+reported|says|said|has\s+said|mentions?|mentioned|cites?|cited|publishes|published|has\s+published|carries|carried|puts)`;
const VERB_ES = String.raw`(?:informa|inform[oó]|ha\s+informado|recoge|recogi[oó]|ha\s+recogido|menciona|mencion[oó]|cita|cit[oó]|publica|public[oó]|ha\s+publicado|reporta|report[oó]|se[ñn]ala|se[ñn]al[oó]|afirma|afirm[oó])`;
// `\b` перед запретом «of/for/de»: «no other source of funds» — это про деньги, а не про издания.
const ABSENCE_CLAIMS = [
  /\bno\s+(?:other|second|further|additional)\s+(?:source|outlet|publication|report|media(?:\s+outlet)?)s?\b(?!\s+(?:of|for)\b)/i,
  /\bnone\s+of\s+the\s+other\s+(?:source|outlet|publication)s?\b/i,
  /\b(?:no\s*one|nobody)\s+else\s+(?:has\s+)?(?:reported|published|mentioned|confirmed|repeated)\b/i,
  /\bonly\s+(?:one|a\s+single|a\s+lone)\s+(?:outlet|source|publication|publisher|newspaper)\b/i,
  /\b(?:reported|reports|according\s+to|per)\s+(?:by\s+)?a\s+single\s+(?:outlet|source|publication)\b/i,
  /\b(?:not|never)\s+(?:been\s+)?(?:repeated|reported|confirmed|mentioned|picked\s+up)\s+(?:elsewhere|by\s+(?:any\s+)?other)\b/i,
  /\b(?:unconfirmed|unreported)\s+elsewhere\b/i,
  new RegExp(String.raw`\b(?:[Aa]ccording\s+to|[Rr]eports?|[Rr]eported\s+by|[Ss]ays|[Ss]aid\s+by|[Pp]er|[Ff]rom|[Bb]y)\s+${NAME}\s+alone\b`, 'u'),
  new RegExp(String.raw`\b[Oo]nly\s+${NAME}\s+${VERB_EN}\b`, 'u'),
  /\bninguna\s+otra\s+fuente\b/i,
  /\bning[uú]n\s+otro\s+(?:medio|portal|outlet|diario|peri[oó]dico)\b(?!\s+de\b)/i,
  /\bno\s+hay\s+(?:otra|ninguna\s+otra)\s+fuente\b(?!\s+de\b)/i,
  /\buna\s+sola\s+fuente\b/i,
  /\botros\s+medios\s+no\s+(?:lo|la|los|las)\s+(?:recogen|confirman|mencionan|repiten)\b/i,
  new RegExp(String.raw`\b(?:[Ss]olo|[Ss]ólo|[Úú]nicamente)\s+${NAME}\s+${VERB_ES}\b`, 'u'),
  new RegExp(String.raw`\b[Ss]eg[uú]n\s+${NAME}\s+(?:[uú]nicamente|solamente|solo|sólo)\b`, 'u'),
];

/** Найденные фразы-отсутствия в тексте (оба языка). */
export function absenceClaims(record) {
  const out = [];
  // И заголовок с описанием: мета читается в выдаче раньше текста, а metaCheck таких фраз не ловит.
  for (const text of [record.en?.text, record.es?.text, record.en?.meta?.title, record.en?.meta?.description,
    record.es?.meta?.title, record.es?.meta?.description]) {
    if (typeof text !== 'string') continue;
    for (const re of ABSENCE_CLAIMS) {
      const m = text.match(re);
      if (m) out.push(m[0]);
    }
  }
  return [...new Set(out)];
}

/**
 * @returns {{ publish: boolean, eligible: boolean, reasons: {code: string, text: string}[] }}
 *   reasons — почему НЕ автопубликация (пусто, если eligible и режим auto).
 *   eligible — прошёл бы в режиме auto.
 */
export function decide(record, mode = 'draft', env = process.env) {
  const blocks = [];
  const add = (code, text) => blocks.push({ code, text });

  if (!record.live) add('not-live', 'запись из сухого прогона');

  const cut = Object.entries(record.truncated ?? {}).filter(([, v]) => v).map(([k]) => k);
  if (cut.length) add('truncated', `ответ обрезан по max_tokens на шагах: ${cut.join(', ')}`);

  for (const lang of ['en', 'es']) {
    const check = record[lang]?.check;
    if (!check) add(`check-${lang}`, `нет результата постпроверки ${lang}`);
    else if (!check.ok) add(`check-${lang}`, `постпроверка ${lang}: ${check.issues.map((i) => i.kind).join(', ')}`);
  }

  // Второй проход читает ОБА языка и заголовки с описаниями: публичный текст
  // обещает именно это, а до ревью проверялся только английский текст.
  for (const [key, suffix, label] of [['verify', '', 'EN'], ['verifyEs', '-es', 'ES']]) {
    const v = record[key];
    if (!v) { add(`verify${suffix}-missing`, `нет вердикта второго прохода (${label}) — без него без человека нельзя`); continue; }
    if (!v.ok) add(`verify${suffix}`, `второй проход (${label}) не выпустил: ${v.blockers.map((b) => b.kind).join(', ') || 'без пояснения'}`);
    if (v.blockers?.length) add(`blockers${suffix}`, `блокеры (${label}): ${v.blockers.map((b) => `${b.kind} — «${b.quote}»`).join('; ')}`);
    if (v.namesPrivateIndividuals) {
      add(`named-individuals${suffix}`, `назван частный человек (${label}): ${(v.individuals ?? []).join(', ') || 'имя не указано'}`);
    }
  }

  // ПОДТВЕРЖДЕНИЕ. Считаем ГОЛОСА, а не группы: кластеризация схлопывает дословные
  // перепечатки в один голос (`voices`), а список групп остаётся длинным. Три группы,
  // из которых две — копии одного пресс-релиза, — это два голоса, и публичный текст
  // не должен называть их тремя независимыми изданиями.
  const nVoices = record.eventMeta?.voices ?? 0;
  const nGroups = record.eventMeta?.confirmingGroups?.length ?? 0;
  const independent = Math.min(nVoices, nGroups);
  const regulator = record.eventMeta?.verdict === 'regulator-primary';
  const need = minGroups(env);
  if (!regulator && independent < need) {
    add('groups', `независимых голосов ${independent} (групп ${nGroups}), без человека нужно ${need} или первоисточник-регулятор`);
  }

  // ПРОЧИТАНО ЛИ. «Подтверждено» — свойство кластера, а не прочитанных текстов: если два
  // издания из трёх ответили 403, модель видит одну статью, и «три источника» остаётся
  // подписью без содержания. Решение опирается на то, что реально скачано.
  const fetched = record.fetched;
  const fetchedGroups = new Set((fetched ?? []).filter((x) => x.chars >= 400).map((x) => x.group));
  if (!fetched) {
    add('retrieval-missing', 'нет сведений о том, какие источники реально прочитаны');
  } else {
    const needRead = regulator ? 1 : need;
    if (fetchedGroups.size < needRead) add('retrieval', `прочитаны тексты ${fetchedGroups.size} групп из ${needRead} нужных`);
    if (fetched.some((x) => x.suspicious)) add('source-suspicious', 'в тексте источника есть обращённое к модели, похожее на инструкции');
  }

  // ДАТА. Событие не может быть позже, чем о нём впервые написали (см. eventDateIssue).
  const dateIssue = eventDateIssue(record);
  if (dateIssue?.unverifiable) {
    add('date-unverifiable', 'в предложении о событии есть дата, а даты первого упоминания нет или она нечитаема: сверить нечем');
  } else if (dateIssue) {
    add('date-vs-first-seen', `в предложении о событии стоит дата ${dateIssue.eventDate}, а о нём впервые написали ${dateIssue.firstSeen}: вероятно, взята дата выхода страницы`);
  }

  // ОТСУТСТВИЕ ДРУГИХ ИСТОЧНИКОВ. Фраза «никто больше не сообщает» допустима, только если прочитаны
  // все издания события; иначе она описывает наши 403, а не мир.
  if (fetched) {
    const unreadGroups = (record.eventMeta?.confirmingGroups ?? []).filter((g) => !fetchedGroups.has(g));
    const claims = unreadGroups.length ? absenceClaims(record) : [];
    if (claims.length) {
      add('absence-claim', `в тексте сказано, что других источников нет (${claims.map((c) => `«${c}»`).join(', ')}), но не прочитаны группы: ${unreadGroups.join(', ')}`);
    }
  }

  // ФАКТЫ. Пустой основной список — значит, подтверждённого нет, и текст стоит
  // на пересказе одного источника или на догадках.
  const facts = record.factsParsed?.facts ?? [];
  if (!facts.length) {
    add('no-facts', 'в основном списке фактов пусто: нечего считать подтверждённым');
  } else if (fetched) {
    const reading = (f) => new Set((f.sourceGroups ?? []).filter((g) => fetchedGroups.has(g)));
    const grounded = facts.filter((f) => reading(f).size >= (regulator ? 1 : 2));
    if (!grounded.length) {
      add('facts-unconfirmed', regulator
        ? 'ни один факт не опирается на прочитанный текст регулятора'
        : 'ни один факт не подтверждён двумя ПРОЧИТАННЫМИ группами');
    }
  }

  if (record.eventMeta?.nearDuplicateOf) {
    add('duplicate', `возможный дубль уже доставленного события ${record.eventMeta.nearDuplicateOf}`);
  }

  const held = holdTopics(record);
  if (held.length) add('hold-topic', `тема из списка «только человек»: ${held.join(', ')}`);

  for (const lang of ['en', 'es']) {
    const m = record[lang]?.meta;
    if (!m?.title || !m?.description || !SLUG.test(m?.slug ?? '')) add(`meta-${lang}`, `мета ${lang} неполная или слаг не kebab-case`);
    // Мета читается в выдаче раньше материала, и служебная пометка в ней (на первом боевом
    // прогоне описание кончалось «Not verified.») проходила все гейты: проверялась только
    // полнота. Считаем здесь, а не берём из записи: старая запись или запись без поля не
    // должна обходить проверку, а правила остаются в одном месте — postcheck.metaCheck.
    const mc = metaCheck(m, lang);
    if (!mc.ok) add(`meta-check-${lang}`, `мета ${lang}: ${mc.issues.map((i) => `${i.field} — ${i.kind}`).join('; ')}`);
  }
  if (!SECTIONS.includes(record.en?.meta?.section)) add('section', `раздел «${record.en?.meta?.section}» не из списка`);

  const eligible = blocks.length === 0;
  const reasons = mode === 'auto' ? blocks : [{ code: 'mode', text: 'режим draft: публикует человек' }, ...blocks];
  return { publish: mode === 'auto' && eligible, eligible, reasons };
}
