import type { Language } from './languages';

/**
 * Службы помощи при игровой зависимости, по языковым версиям.
 *
 * Каждый адрес проверен вручную 24.08.2026 (код ответа и конечный адрес после
 * редиректов); адреса даются в конечной форме, без промежуточных 301. Состав
 * привязан к языку интерфейса как к приближению юрисдикции читателя: точнее
 * на уровне страницы не определить, а пустой блок хуже неточного.
 *
 * Это данные, а не UI-копия, поэтому они не в `ui.ts`: названия организаций
 * не переводятся, а состав списка меняется по своим причинам (служба закрылась,
 * появилась лучшая), не связанным с правками текстов.
 */
export type Helpline = { name: string; url: string };

export const HELPLINES: Record<Language, Helpline[]> = {
  // Общероссийской государственной службы нет; Gambling Therapy — международная
  // программа с полноценной русскоязычной версией и групповой поддержкой.
  ru: [
    { name: 'Gambling Therapy (по-русски)', url: 'https://gamblingtherapy.org/ru/' },
  ],
  en: [
    { name: 'GambleAware', url: 'https://www.gambleaware.org/' },
    { name: 'Gamblers Anonymous', url: 'https://gamblersanonymous.org/' },
  ],
  es: [
    { name: 'FEJAR', url: 'https://fejar.org/' },
    { name: 'Jugadores Anónimos', url: 'https://jugadoresanonimos.org/' },
  ],
  pt: [
    { name: 'Jogo Responsável (SRIJ)', url: 'https://jogoresponsavel.pt/' },
  ],
  // Check dein Spiel — программа BZgA, федерального ведомства здравоохранения.
  de: [
    { name: 'Check dein Spiel (BZgA)', url: 'https://www.check-dein-spiel.de/' },
  ],
  fr: [
    { name: 'Joueurs Info Service', url: 'https://www.joueurs-info-service.fr/' },
  ],
  br: [
    { name: 'Jogadores Anônimos', url: 'https://www.jogadoresanonimos.com.br/' },
  ],
};
