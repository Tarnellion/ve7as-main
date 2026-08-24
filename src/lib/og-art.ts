// Детерминированная геометрия «обложки» статьи.
//
// Модуль намеренно вынесен из `src/components/ArticleArt.astro` в обычный
// TypeScript: те же функции понадобятся будущему генератору OG-карточек,
// который будет запускаться в GitHub Actions на голом Node, а `.astro`-компонент
// туда не подключить. Поэтому здесь нет ни одного импорта из Astro и ни одного
// обращения к DOM или Node-API — только чистые функции над числами и строками.
//
// Инвариант: одинаковый `seed` всегда даёт одинаковую композицию. Из этого
// следует, что карточка, отрисованная в CI, совпадёт с SVG на странице.
// Любое изменение порядка вызовов `rand()` ниже меняет картинку у всех уже
// опубликованных статей — правь только осознанно.

/** FNV-1a: строка → 32-битное беззнаковое число. */
export function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: компактный ГПСЧ, выдаёт числа в [0, 1) от одного 32-битного зерна. */
export function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Одно размытое пятно фона в системе координат 100×100. */
export interface ArtBlob {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

/** Полный набор координат композиции в системе координат 100×100. */
export interface ArtGeometry {
  /** Префикс id для `<defs>` — уникален в пределах seed, чтобы градиенты не пересекались. */
  uid: string;
  blobs: ArtBlob[];
  ringCx: number;
  ringCy: number;
  ringR: number;
  /** Наклон глифа в градусах. */
  tilt: number;
  iconX: number;
  iconY: number;
}

/** Количество пятен фона. */
const BLOB_COUNT = 3;

/**
 * Строит композицию по строковому зерну (id статьи или секции).
 * Координаты даны в системе 100×100 — вызывающий код сам решает,
 * растянуть их в `viewBox` или домножить до пикселей растра.
 */
export function artGeometry(seed: string): ArtGeometry {
  const hash = hashSeed(seed);
  const rand = mulberry32(hash);

  const blobs = Array.from({ length: BLOB_COUNT }, () => ({
    cx: 16 + rand() * 68,
    cy: 14 + rand() * 72,
    r: 22 + rand() * 30,
    opacity: 0.1 + rand() * 0.16,
  }));

  const ringCx = 14 + rand() * 72;
  const ringCy = 14 + rand() * 72;
  const ringR = 16 + rand() * 22;

  const tilt = Math.round(-16 + rand() * 32);
  const iconX = 28 + rand() * 44;
  const iconY = 36 + rand() * 40;

  return {
    uid: `art-${hash.toString(36)}`,
    blobs,
    ringCx,
    ringCy,
    ringR,
    tilt,
    iconX,
    iconY,
  };
}
