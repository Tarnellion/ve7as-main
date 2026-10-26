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
    'condenad*', 'sentencia*', 'detenid*', 'imput*', 'juicio', 'cárcel', 'prisión', 'culpable', 'delito*', 'estafa*',
    'preso*', 'prisão', 'julgament*', 'criminos*', 'golpe',
    'verurteil*', 'festgenommen', 'verhaftet', 'angeklagt*', 'anklage*', 'strafverfahren', 'betrug*', 'haft',
    'condamn*', 'inculp*', 'procès', 'escroquer*']), 'уголовное производство'],
  [words(['alleg*', 'accus*', 'suspect*', 'verdacht*', 'acusad*', 'beschuldig*']), 'обвинения и подозрения'],
  [words(['lawsuit*', 'sue', 'sued', 'sues', 'suing', 'litigation', 'plaintiff*', 'defendant*', 'class action',
    'rechtszaak', 'demanda*', 'klage*', 'plainte*']), 'гражданский иск'],
  [words(['suicid*', 'overdos*', 'died', 'dies', 'death*', 'dead', 'killed', 'murder*', 'fatal*', 'homicide',
    'self-harm', 'overleden', 'fallec*', 'muert*', 'asesin*', 'morte', 'morreu', 'gestorben', 'tot',
    'décès', 'mort*']), 'смерть'],
];

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
  }
  if (!SECTIONS.includes(record.en?.meta?.section)) add('section', `раздел «${record.en?.meta?.section}» не из списка`);

  const eligible = blocks.length === 0;
  const reasons = mode === 'auto' ? blocks : [{ code: 'mode', text: 'режим draft: публикует человек' }, ...blocks];
  return { publish: mode === 'auto' && eligible, eligible, reasons };
}
